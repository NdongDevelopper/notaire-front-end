/**
 * Wire-format types (snake_case) — confirmed contract:
 *   GET    /api/clients/
 *   POST   /api/clients/
 *   GET    /api/clients/<uuid:pk>/
 *   PATCH  /api/clients/<uuid:pk>/
 *   DELETE /api/clients/<uuid:pk>/
 *
 * Example payload from the backend team:
 * {
 *   "type_client": "physique",
 *   "nom": "Moussa Diop",
 *   "email": "moussa@example.com",
 *   "telephone": "770000001",
 *   "adresse": "Dakar",
 *   "notes": "Client test"
 * }
 *
 * ASSUMPTION: `id` (uuid), `created_at`, `updated_at` are present on
 * read responses (standard DRF pattern) even though the example above
 * only shows the write payload. Confirm the exact read shape (in
 * particular whether pagination wraps `results`/`count` a la DRF
 * PageNumberPagination rather than the `items`/`total` used below).
 */

export type ClientTypeDto = 'physique' | 'morale';

export interface ClientDto {
  id: string;
  type_client: ClientTypeDto;
  nom: string;
  telephone: string;
  email: string;
  adresse: string;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ClientListResponseDto {
  count: number;
  next: string | null;
  previous: string | null;
  results: ClientDto[];
}

export interface ClientListQueryDto {
  search?: string;
  page?: number;
  page_size?: number;
}

export type CreateClientDto = Omit<ClientDto, 'id' | 'created_at' | 'updated_at'>;

export interface UpdateClientDto extends Partial<CreateClientDto> {
  id: string;
}
