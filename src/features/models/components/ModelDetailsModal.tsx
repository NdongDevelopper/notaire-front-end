// components/ModelDetailsModal.tsx
import { useEffect, useRef, useState } from "react";
import jsPDF from "jspdf";
import { Download, FileText, Printer, X } from "lucide-react";
import { getErrorMessage } from "@/shared/utils/errors";
import { variablesSuggereesPour } from "../types/models";
import { listerTypesActes } from "../services/modelsApi";
import type { ModeleActe, ModeleActeInput, TypeActe } from "../types/models";

const VALEURS_VARIABLES_PAR_DEFAUT: Record<string, string> = {
  notaire: "Maître [Nom du notaire]",
  etude_nom: "[Nom de l'étude]",
  etude_adresse: "[Adresse de l'étude]",
  vendeur: "[Nom du vendeur]",
  acheteur: "[Nom de l'acheteur]",
  montant: "[Montant à préciser]",
  date_signature: "[Date de signature]",
  num_tf: "[Numéro de TF]",
  lieu_immeuble: "[Lieu de l'immeuble]",
  de_cujus: "[Nom du défunt]",
  liste_heritiers: "[Liste des héritiers]",
  date_deces: "[Date du décès]",
  donateur: "[Nom du donateur]",
  donataire: "[Nom du donataire]",
  bien_donne: "[Bien donné]",
  bailleur: "[Nom du bailleur]",
  locataire: "[Nom du locataire]",
  duree_bail: "[Durée du bail]",
};

function extraireVariables(texte: string): string[] {
  const variables = Array.from(texte.matchAll(/\{\{([^}]+)\}\}/g), (match) => match[1].trim());
  return Array.from(new Set(variables));
}

function formaterDocument(contenu: string): string {
  const contenuFormate = contenu.replace(/\{\{([^}]+)\}\}/g, (_match, variable: string) => {
    const cle = variable.trim().toLowerCase();
    return VALEURS_VARIABLES_PAR_DEFAUT[cle] ?? `[À compléter : ${variable.trim()}]`;
  });

  const lignes = [
    "Établi par l’étude notariale",
    `Date : ${new Date().toLocaleDateString("fr-FR")}`,
    "",
    contenuFormate,
    "",
  ];

  return lignes.join("\n");
}

function genererBrouillon(texte: string): { brouillon: string; champsManquants: string[] } {
  const variables = extraireVariables(texte);
  const champsManquants = variables.filter((variable) => {
    const cle = variable.toLowerCase();
    return !Object.prototype.hasOwnProperty.call(VALEURS_VARIABLES_PAR_DEFAUT, cle);
  });

  return {
    brouillon: formaterDocument(texte),
    champsManquants,
  };
}

interface ModelDetailsModalProps {
  open: boolean;
  mode: "creation" | "edition";
  modele?: ModeleActe | null;
  categories: TypeActe[];
  onClose: () => void;
  onSave: (values: ModeleActeInput) => Promise<void> | void;
}

/**
 * Éditeur de modèle d'acte, ouvert en modal depuis une carte de la
 * Bibliothèque de Modèles ou depuis "Nouveau Modèle".
 * Cahier des charges §12: variables dynamiques, statuts, versionning.
 */
export default function ModelDetailsModal({
  open,
  mode,
  modele,
  categories,
  onClose,
  onSave,
}: ModelDetailsModalProps) {
  const [titre, setTitre] = useState("");
  const [typeActe, setTypeActe] = useState("");
  const [contenu, setContenu] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [brouillon, setBrouillon] = useState("");
  const [champsManquants, setChampsManquants] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [localCategories, setLocalCategories] = useState<TypeActe[]>(categories);
  const [loadingCategories, setLoadingCategories] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitre(modele?.titre ?? "");
    const modeleType = modele?.type_acte;
    let defaultCode = "";
    if (modeleType !== undefined && modeleType !== null && modeleType !== "") {
      const asString = String(modeleType);
      const byCode = categories.find((c) => c.code === asString) || localCategories.find((c) => c.code === asString);
      if (byCode) defaultCode = byCode.code;
      else {
        const byId = categories.find((c) => String(c.id) === asString) || localCategories.find((c) => String(c.id) === asString);
        if (byId) defaultCode = byId.code;
        else defaultCode = "";
      }
    }
    if (!defaultCode) defaultCode = categories[0]?.code ?? localCategories[0]?.code ?? "";
    setTypeActe(defaultCode);
    setContenu(modele?.contenu ?? "");
    setErreur(null);
  }, [open, modele, categories]);

  useEffect(() => {
    if (!open) return;
    const resultat = genererBrouillon(contenu);
    setBrouillon(resultat.brouillon);
    setChampsManquants(resultat.champsManquants);
  }, [open, contenu, typeActe, titre]);

  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  useEffect(() => {
    if (!open) return;
    if (localCategories && localCategories.length > 0) return;
    let mounted = true;
    setLoadingCategories(true);
    listerTypesActes()
      .then((res) => {
        if (!mounted) return;
        setLocalCategories(res);
        if (!typeActe && res[0]) setTypeActe(res[0].code);
      })
      .catch((err) => {
        console.error("Échec du chargement des types d'actes depuis la modal:", err);
      })
      .finally(() => mounted && setLoadingCategories(false));
    return () => {
      mounted = false;
    };
  }, [open]);

  if (!open) return null;

  const variablesDisponibles = variablesSuggereesPour(typeActe);

  function inserer(variable: string) {
    const textarea = textareaRef.current;
    const balise = `{{${variable}}}`;
    if (!textarea) {
      setContenu((prev) => `${prev}${balise}`);
      return;
    }
    const debut = textarea.selectionStart ?? contenu.length;
    const fin = textarea.selectionEnd ?? contenu.length;
    const nouveauContenu = `${contenu.slice(0, debut)}${balise}${contenu.slice(fin)}`;
    setContenu(nouveauContenu);
    requestAnimationFrame(() => {
      textarea.focus();
      const positionCurseur = debut + balise.length;
      textarea.setSelectionRange(positionCurseur, positionCurseur);
    });
  }

  async function exporterPdf() {
    // Anciennement : `if (!modele?.id) return;` — rendait ce bouton inopérant
    // en mode création (précisément le cas signalé en recette : on doit
    // pouvoir exporter le brouillon en PDF même avant l'enregistrement).
    const nomFichier = `${(titre || modele?.titre || "modele").trim()}.pdf`;
    const contenuPdf = (brouillon || contenu || "")
      .replace(/^Établi par l’étude notariale\s*$/m, "")
      .replace(/^Date : .*$/m, "")
      .trim();

    try {
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 40;
      const maxWidth = pageWidth - margin * 2;
      const lineHeight = 13;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text(titre || modele?.titre || "Modèle d'acte", pageWidth / 2, 48, { align: "center" });

      doc.setFont("helvetica", "italic");
      doc.setFontSize(10);
      doc.text("Établi par l’étude notariale", margin, 72);
      doc.text(`Date : ${new Date().toLocaleDateString("fr-FR")}`, margin, 88);

      doc.setDrawColor(140, 140, 140);
      doc.setLineWidth(0.6);
      doc.line(margin, 104, pageWidth - margin, 104);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);

      const paragraphs = contenuPdf
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean);

      let y = 120;

      paragraphs.forEach((paragraph, index) => {
        const lines = doc.splitTextToSize(paragraph, maxWidth);

        if (y > pageHeight - margin - 40) {
          doc.addPage();
          y = margin;
        }

        if (index > 0) {
          y += 10;
        }

        lines.forEach((line: string) => {
          if (y > pageHeight - margin) {
            doc.addPage();
            y = margin;
          }
          doc.text(line, margin, y);
          y += lineHeight;
        });
      });

      doc.save(nomFichier);
      setErreur(null);
    } catch (error) {
      console.error("Erreur lors de la génération du PDF", error);
      setErreur(getErrorMessage(error) || "Échec de la génération du PDF.");
    }
  }

  function exporterWord() {
    const blob = new Blob([brouillon || contenu], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(titre || modele?.titre || "brouillon").trim()}.doc`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleEnregistrer() {
    setErreur(null);
    if (!titre.trim()) {
      setErreur("Le titre du modèle est obligatoire.");
      return;
    }
    if (!typeActe) {
      setErreur("Sélectionnez un type d'acte.");
      return;
    }
    const selectedCat = localCategories.find((c) => c.code === typeActe) || categories.find((c) => c.code === typeActe);
    if (!selectedCat) {
      setErreur("Type d'acte invalide — sélectionnez un type existant dans la liste.");
      return;
    }

    setSubmitting(true);
    try {
      // Convert selected type code to the numeric PK expected by the API.
      const payloadTypeActe = selectedCat.id;
      await onSave({
        titre: titre.trim(),
        type_acte: payloadTypeActe,
        contenu,
        variables: variablesDisponibles,
      });
      // Fermeture uniquement en cas de succès. En cas d'échec, le catch
      // ci-dessous garde la modale ouverte avec le contenu saisi intact :
      // aucune donnée n'est perdue, et les exports PDF/Word ci-dessus
      // restent utilisables pendant que l'utilisateur corrige le souci
      // (ex: droits insuffisants) sans avoir à tout retaper.
      onClose();
    } catch (err) {
      // getErrorMessage extrait un message lisible depuis la réponse du
      // serveur (ex: {"detail":"Accès réservé..."} devient une phrase en
      // français), au lieu d'afficher le JSON brut comme précédemment.
      setErreur(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-2 sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-[min(92vw,44rem)] max-w-full flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <FileText size={18} strokeWidth={2} />
            </span>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                {mode === "creation" ? "Nouveau modèle" : modele?.titre}
              </h2>
              <p className="text-xs text-slate-500">Éditeur de modèle d'acte</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label="Fermer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid flex-1 grid-cols-1 gap-3 overflow-y-auto p-3 sm:p-4 md:grid-cols-[1.45fr_0.8fr]">
          <div className="flex flex-col gap-3">
            {mode === "creation" && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Titre</label>
                  <input
                    type="text"
                    value={titre}
                    onChange={(e) => setTitre(e.target.value)}
                    placeholder="Ex: Acte de Vente Immobilière Standard"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Type d'acte
                  </label>
                  {loadingCategories ? (
                    <div className="text-sm text-slate-500">Chargement des catégories…</div>
                  ) : localCategories.length === 0 ? (
                    <div className="text-sm text-rose-600">Aucun type d'acte disponible.</div>
                  ) : (
                    <select
                      value={typeActe}
                      onChange={(e) => setTypeActe(e.target.value)}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    >
                      {localCategories.map((cat) => (
                        <option key={cat.id} value={cat.code}>
                          {cat.libelle}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            )}

            <textarea
              ref={textareaRef}
              value={contenu}
              onChange={(e) => setContenu(e.target.value)}
              placeholder="Rédigez la structure type de l'acte, et insérez des variables depuis le panneau de droite…"
              className="min-h-56 flex-1 rounded-xl border border-slate-200 p-3 text-sm leading-relaxed text-slate-800 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">Brouillon généré</h4>
                  <p className="text-xs text-slate-500">Prérempli, prêt à être relu puis exporté.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={exporterPdf}
                    className="flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    <Printer size={14} />
                    PDF
                  </button>
                  <button
                    type="button"
                    onClick={exporterWord}
                    className="flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    <Download size={14} />
                    Word
                  </button>
                </div>
              </div>

              {champsManquants.length > 0 ? (
                <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-2 text-xs text-amber-700">
                  Champs manquants : {champsManquants.join(", ")}
                </p>
              ) : (
                <p className="mt-2 text-xs text-emerald-600">Toutes les variables du modèle ont été préremplies.</p>
              )}

              <div className="printable mt-3 rounded-md border border-slate-200 bg-white p-4 text-xs leading-7 text-slate-700">
                <div className="whitespace-pre-wrap font-sans text-sm leading-7 text-slate-800">
                  {brouillon || "Le brouillon apparaîtra ici après génération."}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Variables disponibles
            </h3>
            <div className="flex-1 space-y-2 overflow-y-auto pr-1">
              {variablesDisponibles.map((variable) => (
                <button
                  key={variable}
                  type="button"
                  onClick={() => inserer(variable)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-left font-mono text-xs text-slate-700 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                >
                  {`{{${variable}}}`}
                </button>
              ))}
            </div>

            {erreur && (
              <p className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                {erreur}
              </p>
            )}

            <button
              type="button"
              onClick={handleEnregistrer}
              disabled={submitting}
              className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}