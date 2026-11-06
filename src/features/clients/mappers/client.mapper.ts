import type { ClientDto, CreateClientDto } from '../api/client.dto';
import type { Client, CreateClientInput } from '../types/client.types';

export function mapClientDtoToClient(dto: ClientDto): Client {
  return {
    id: dto.id,
    type: dto.type_client,
    nom: dto.nom,
    telephone: dto.telephone,
    email: dto.email,
    adresse: dto.adresse,
    notes: dto.notes ?? undefined,
    createdAt: dto.created_at ?? '',
    updatedAt: dto.updated_at ?? '',
  };
}

export function mapClientListDtoToClients(dtos: ClientDto[]): Client[] {
  return dtos.map(mapClientDtoToClient);
}

export function mapCreateClientInputToDto(input: CreateClientInput): CreateClientDto {
  return {
    type_client: input.type,
    nom: input.nom,
    telephone: input.telephone,
    email: input.email,
    adresse: input.adresse,
    notes: input.notes || undefined,
  };
}
