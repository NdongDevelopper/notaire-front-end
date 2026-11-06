/**
 * Domain types for the Clients module.
 *
 * Aligned with the confirmed backend contract (GET/POST /api/clients/,
 * GET/PATCH/DELETE /api/clients/<uuid:pk>/):
 *   { type_client: "physique" | "morale", nom, email, telephone, adresse, notes }
 *
 * NOTE: unlike the earlier draft, the backend does NOT split prenom/nom,
 * and does not model a discriminated union — it's a flat record. `nom`
 * holds the full name for "physique" and the raison sociale for "morale".
 * The richer CDC fields (nationalite, RCCM, NINEA, piece d'identite...)
 * are still not represented here — see NOTES.md.
 */

export type ClientType = 'physique' | 'morale';

export interface Client {
  id: string;
  type: ClientType;
  nom: string;
  telephone: string;
  email: string;
  adresse: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClientListParams {
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface ClientListResult {
  items: Client[];
  total: number;
}

export type CreateClientInput = Omit<Client, 'id' | 'createdAt' | 'updatedAt'>;

export type UpdateClientInput = { id: string } & Partial<CreateClientInput>;
