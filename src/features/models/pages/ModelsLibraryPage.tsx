// pages/ModelsLibraryPage.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Plus, X } from "lucide-react";
import { getErrorMessage } from '@/shared/utils/errors';
import { useAuthStore } from "../../auth/store/auth.store";
import CategoryFilter from "../components/CategoryFilter";
import ModelCard from "../components/ModelCard";
import ModelDetailsModal from "../components/ModelDetailsModal";
import {
  creerModele,
  dupliquerModele,
  listerModeles,
  listerTypesActes,
  modifierModele,
  supprimerModele,
} from "../services/modelsApi";
import { CATEGORIE_TOUS, libelleTypeActe } from "../types/models";
import type { ModeleActe, ModeleActeInput, TypeActe } from "../types/models";

/**
 * "Bibliothèque de Modèles": liste des modèles d'actes, filtrables par
 * type d'acte, avec création et édition via modal.
 * Cahier des charges §12 — Rédaction et génération d'actes.
 *
 * Les droits (qui peut créer / supprimer un modèle) viennent exclusivement
 * de user.permissions, lui-même renvoyé par GET /api/auth/me/ (voir
 * core.views.MeView côté backend). On ne recalcule JAMAIS ces droits à
 * partir du rôle affiché côté client : l'ancienne version de cette page
 * utilisait une liste de rôles codée en dur (["associe","juriste","admin",
 * "notaire"]) qui contenait des rôles inexistants ("admin", "notaire") et
 * se désynchronisait de la règle serveur à chaque évolution des rôles.
 */
export default function ModelsLibraryPage() {
  const permissions = useAuthStore((state) => state.user?.permissions);
  const peutCreer = permissions?.peut_creer_modele_acte ?? false;
  const peutSupprimer = permissions?.peut_supprimer_modele_acte ?? false;

  const [categories, setCategories] = useState<TypeActe[]>([]);
  const [modeles, setModeles] = useState<ModeleActe[]>([]);
  const [categorieSelectionnee, setCategorieSelectionnee] = useState<string>(CATEGORIE_TOUS);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  const [modalOuvert, setModalOuvert] = useState(false);
  const [modalMode, setModalMode] = useState<"creation" | "edition">("creation");
  const [modeleActif, setModeleActif] = useState<ModeleActe | null>(null);
  const [modeleASupprimer, setModeleASupprimer] = useState<ModeleActe | null>(null);
  const [suppressionEnCours, setSuppressionEnCours] = useState(false);

  const chargerDonnees = useCallback(async () => {
    setLoading(true);
    setErreur(null);
    try {
      const [categoriesRes, modelesRes] = await Promise.all([
        listerTypesActes(),
        listerModeles(),
      ]);
      setCategories(categoriesRes);
      setModeles(modelesRes);
    } catch (err) {
      setErreur(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    chargerDonnees();
  }, [chargerDonnees]);

  const modelesFiltres = useMemo(() => {
    if (categorieSelectionnee === CATEGORIE_TOUS) return modeles;
    const selectedCat = categories.find((c) => c.code === categorieSelectionnee);
    return modeles.filter((m) => {
      // m.type_acte peut être un code (string) ou un id (number|string)
      const typeActeStr = String(m.type_acte);
      if (selectedCat) {
        return typeActeStr === String(selectedCat.id) || typeActeStr === selectedCat.code;
      }
      return typeActeStr === categorieSelectionnee;
    });
  }, [modeles, categorieSelectionnee, categories]);

  const libelleParCode = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((cat) => {
      map.set(cat.code, cat.libelle);
      map.set(String(cat.id), cat.libelle);
    });
    return map;
  }, [categories]);

  function ouvrirCreation() {
    if (!peutCreer) return;
    setModalMode("creation");
    setModeleActif(null);
    setModalOuvert(true);
  }

  function ouvrirDetail(modele: ModeleActe) {
    setModalMode("edition");
    setModeleActif(modele);
    setModalOuvert(true);
  }

  async function handleDupliquer(modele: ModeleActe) {
    if (!peutCreer) return;
    try {
      const duplique = await dupliquerModele(modele.id);
      setModeles((prev) => [{ ...duplique, statut: duplique.statut ?? "Brouillon", version: duplique.version ?? 1 }, ...prev]);
    } catch (err) {
      setErreur(getErrorMessage(err));
    }
  }

  function demanderSuppression(modele: ModeleActe) {
    if (!peutSupprimer) return;
    setModeleASupprimer(modele);
  }

  async function confirmerSuppression() {
    if (!modeleASupprimer) return;

    setSuppressionEnCours(true);
    try {
      await supprimerModele(modeleASupprimer.id);
      setModeles((prev) => prev.filter((item) => item.id !== modeleASupprimer.id));
      setModeleASupprimer(null);
    } catch (err) {
      setErreur(getErrorMessage(err));
    } finally {
      setSuppressionEnCours(false);
    }
  }

  async function handleEnregistrer(values: ModeleActeInput) {
    const maintenant = new Date().toISOString();
    try {
      if (modalMode === "creation") {
        const nouveauModele = await creerModele(values);
        setModeles((prev) => [
          {
            ...nouveauModele,
            created_at: nouveauModele.created_at ?? nouveauModele.createdAt ?? maintenant,
            updated_at: nouveauModele.updated_at ?? nouveauModele.updatedAt ?? null,
            derniere_maj:
              nouveauModele.derniere_maj ?? nouveauModele.derniereMaj ?? nouveauModele.updated_at ?? nouveauModele.updatedAt ?? maintenant,
            createdAt: nouveauModele.createdAt ?? nouveauModele.created_at ?? maintenant,
            updatedAt: nouveauModele.updatedAt ?? nouveauModele.updated_at ?? null,
            derniereMaj:
              nouveauModele.derniereMaj ?? nouveauModele.derniere_maj ?? nouveauModele.updatedAt ?? nouveauModele.updated_at ?? maintenant,
          },
          ...prev,
        ]);
      } else if (modeleActif) {
        const modeleMisAJour = await modifierModele(modeleActif.id, values);
        setModeles((prev) =>
          prev.map((m) =>
            m.id === modeleMisAJour.id
              ? {
                ...modeleMisAJour,
                created_at: modeleMisAJour.created_at ?? modeleMisAJour.createdAt ?? m.created_at ?? m.createdAt ?? maintenant,
                updated_at: modeleMisAJour.updated_at ?? modeleMisAJour.updatedAt ?? maintenant,
                derniere_maj:
                  modeleMisAJour.derniere_maj ?? modeleMisAJour.derniereMaj ?? modeleMisAJour.updated_at ?? modeleMisAJour.updatedAt ?? maintenant,
                createdAt:
                  modeleMisAJour.createdAt ?? modeleMisAJour.created_at ?? m.createdAt ?? m.created_at ?? maintenant,
                updatedAt:
                  modeleMisAJour.updatedAt ?? modeleMisAJour.updated_at ?? maintenant,
                derniereMaj:
                  modeleMisAJour.derniereMaj ?? modeleMisAJour.derniere_maj ?? modeleMisAJour.updatedAt ?? modeleMisAJour.updated_at ?? maintenant,
              }
              : m
          )
        );
      }
    } catch (err) {
      setErreur(getErrorMessage(err));
      throw err;
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white px-5 py-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Bibliothèque de Modèles
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Gérez les structures types de vos actes notariés.
          </p>
        </div>

        <button
          type="button"
          onClick={ouvrirCreation}
          disabled={!peutCreer}
          title={peutCreer ? undefined : "Réservé aux associés et aux juristes de l'étude."}
          className="flex items-center gap-2 self-start rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:hover:bg-slate-300"
        >
          <Plus size={16} />
          Nouveau Modèle
        </button>
      </div>

      {!peutCreer && (
        <p className="mx-5 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Votre rôle ne permet pas de créer ou modifier des modèles d'actes.
          Cette action est réservée aux associés et aux juristes de l'étude.
        </p>
      )}

      {erreur && (
        <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {erreur}
        </p>
      )}

      <div className="px-5 grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
        <CategoryFilter
          categories={categories}
          selected={categorieSelectionnee}
          onSelect={setCategorieSelectionnee}
          loading={loading}
        />

        {loading ? (
          <div className=" grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((key) => (
              <div key={key} className="h-52 animate-pulse rounded-2xl border border-slate-200 bg-slate-100" />
            ))}
          </div>
        ) : modelesFiltres.length === 0 ? (
          <div className="flex items-center justify-center rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
            Aucun modèle dans cette catégorie pour le moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {modelesFiltres.map((modele) => (
              <ModelCard
                key={modele.id}
                modele={modele}
                typeLibelle={libelleParCode.get(String(modele.type_acte)) ?? libelleTypeActe(modele.type_acte, categories)}
                onClick={() => ouvrirDetail(modele)}
                onDuplicate={peutCreer ? handleDupliquer : undefined}
                onDelete={peutSupprimer ? demanderSuppression : undefined}
              />
            ))}
          </div>
        )}
      </div>

      {modeleASupprimer && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 px-2 sm:px-4">
          <div className="w-[min(92vw,22rem)] max-w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                  <AlertTriangle size={18} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-slate-900">Confirmer la suppression</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Cette action supprimera définitivement le modèle <span className="font-semibold text-slate-900">{modeleASupprimer.titre}</span>.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModeleASupprimer(null)}
                className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModeleASupprimer(null)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmerSuppression}
                disabled={suppressionEnCours}
                className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {suppressionEnCours ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ModelDetailsModal
        open={modalOuvert}
        mode={modalMode}
        modele={modeleActif}
        categories={categories}
        onClose={() => setModalOuvert(false)}
        onSave={handleEnregistrer}
      />
    </div>
  );
}