import { useState, useEffect } from "react";
import { Modal } from '../../../../shared/components/ui/Modal/Modal';
import { Button } from "../../../../shared/components/ui/Button/Button";
import { Input } from "../../../../shared/components/ui/Input/Input";
import { caseService } from "../../services/case.service";
import { api } from "../../../../shared/services/api";
import type { TypeActe, User, Client } from "../../types/case";

interface EditCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  dossierId: string;
  onSave: (updates: {
    objet: string;
    type_acte: number;
    montant: number;
    date_cible: string;
    priorite: "basse" | "normale" | "haute";
    description: string;
    responsable?: string;
    client?: string;
  }) => Promise<void>;
}

export const EditCaseModal = ({ isOpen, onClose, dossierId, onSave }: EditCaseModalProps) => {
  const [objet, setObjet] = useState("");
  const [typeActe, setTypeActe] = useState<number | "">("");
  const [responsableId, setResponsableId] = useState<string>("");
  const [clientId, setClientId] = useState<string>("");
  const [montant, setMontant] = useState<number>(0);
  const [dateCible, setDateCible] = useState("");
  const [priorite, setPriorite] = useState<"basse" | "normale" | "haute">("normale");
  const [description, setDescription] = useState("");
  const [typesActesList, setTypesActesList] = useState<TypeActe[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [clientsList, setClientsList] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const internalUsers = usersList.filter((user) => user.role?.toLowerCase() !== 'client');

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;

    const loadData = async () => {
      setLoading(true);
      try {
        const [typesRes, usersRes, clientsRes] = await Promise.all([
          api.get('/types-actes/'),
          api.get('/users/'),
          api.get('/clients/')
        ]);

        const typesData = Array.isArray(typesRes.data)
          ? typesRes.data
          : (typesRes.data as any).results || [];
        const usersData = Array.isArray(usersRes.data)
          ? usersRes.data
          : (usersRes.data as any).results || [];
        const clientsData = Array.isArray(clientsRes.data)
          ? clientsRes.data
          : (clientsRes.data as any).results || [];

        if (isMounted) {
          setTypesActesList(typesData);
          setUsersList(usersData);
          setClientsList(clientsData);
        }

        const dossierData = await caseService.getDossier(dossierId);
        if (!isMounted) return;

        setObjet(dossierData?.objet || "");
        const typeActeId = typeof dossierData?.type_acte === 'object' && dossierData?.type_acte !== null
          ? (dossierData.type_acte as any).id
          : dossierData?.type_acte;
        setTypeActe(typeActeId || "");
        
        if (dossierData?.responsable) {
          if (typeof dossierData.responsable === 'object' && dossierData.responsable !== null) {
            setResponsableId((dossierData.responsable as any).id || "");
          } else {
            setResponsableId(String(dossierData.responsable));
          }
        } else {
          setResponsableId("");
        }

        if (dossierData?.client) {
          if (typeof dossierData.client === 'object' && dossierData.client !== null) {
            setClientId((dossierData.client as any).id || "");
          } else {
            setClientId(String(dossierData.client));
          }
        } else {
          setClientId("");
        }

        setMontant(Number(dossierData?.montant) || 0);
        setDateCible(dossierData?.date_cible ? String(dossierData.date_cible).slice(0, 10) : "");
        setPriorite((dossierData?.priorite as "basse" | "normale" | "haute") || "normale");
        setDescription(dossierData?.description || "");
      } catch (error) {
        console.error("Erreur lors du chargement:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [isOpen, dossierId]);

  const handleSubmit = async () => {
    if (!objet.trim() || !typeActe || !clientId || !responsableId) {
      alert("Veuillez remplir tous les champs obligatoires (*)");
      return;
    }
    setSaving(true);
    try {
      await onSave({
        objet: objet.trim(),
        type_acte: Number(typeActe),
        montant,
        date_cible: dateCible,
        priorite,
        description,
        responsable: responsableId,
        client: clientId,
      });
    } finally {
      setSaving(false);
    }
  };

  // Fonction pour obtenir le nom d'un utilisateur
  const getUserDisplayName = (user: User | any): string => {
    if (!user) return "";
    const firstName = user.first_name || '';
    const lastName = user.last_name || '';
    const username = user.username || '';
    
    if (firstName || lastName) {
      return `${firstName} ${lastName}`.trim();
    }
    return username || "Utilisateur";
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Modifier le dossier"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} className="hover:!bg-slate-200" disabled={saving}>
            Annuler
          </Button>
          <Button variant="primary" onClick={handleSubmit} className="hover:!bg-blue-700" disabled={saving || loading}>
            {saving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </>
      }
    >
      {loading ? (
        <div className="py-10 text-center text-sm font-medium text-slate-500">Chargement...</div>
      ) : (
        <div className="space-y-4">
          <Input
            label="Objet / Titre du dossier *"
            type="text"
            value={objet}
            onChange={(e) => setObjet(e.target.value)}
            required
            placeholder="Ex: Vente terrain"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Type d'acte *
              </label>
              <select
                value={typeActe}
                onChange={(e) => setTypeActe(Number(e.target.value))}
                className="w-full text-sm bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 font-medium text-slate-700 shadow-sm"
                required
              >
                <option value="">Sélectionner un type</option>
                {typesActesList.map((t) => (
                  <option key={t.id} value={t.id}>{t.libelle}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Client associé *
              </label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full text-sm bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 font-medium text-slate-700 shadow-sm"
                required
              >
                <option value="">Sélectionner un client</option>
                {clientsList.map((c) => (
                  <option key={c.id} value={c.id}>{c.nom}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Responsable *
              </label>
              <select
                value={responsableId}
                onChange={(e) => setResponsableId(e.target.value)}
                className="w-full text-sm bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 font-medium text-slate-700 shadow-sm"
                required
              >
                <option value="">Sélectionner un responsable</option>
                {internalUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {getUserDisplayName(u)}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Date Cible"
              type="date"
              value={dateCible}
              onChange={(e) => setDateCible(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Montant (FCFA)"
              type="number"
              value={montant}
              onChange={(e) => setMontant(Number(e.target.value))}
            />
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Priorité</label>
              <select
                value={priorite}
                onChange={(e) => setPriorite(e.target.value as "basse" | "normale" | "haute")}
                className="w-full text-sm bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 font-medium text-slate-700 shadow-sm"
              >
                <option value="basse">Basse</option>
                <option value="normale">Normale</option>
                <option value="haute">Haute</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-sm bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 h-20 resize-none outline-none font-medium"
              placeholder="Description du dossier..."
            />
          </div>
        </div>
      )}
    </Modal>
  );
};