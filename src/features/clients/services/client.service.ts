import { clientApi } from '../api/client.api';
import {
  mapClientDtoToClient,
  mapClientListDtoToClients,
  mapCreateClientInputToDto,
} from '../mappers/client.mapper';
import type {
  Client,
  ClientListParams,
  ClientListResult,
  CreateClientInput,
  UpdateClientInput,
} from '../types/client.types';

export const clientService = {
  async list(params?: ClientListParams): Promise<ClientListResult> {
    const { data } = await clientApi.list({
      search: params?.search,
      page: params?.page,
      page_size: params?.pageSize,
    });
    return { items: mapClientListDtoToClients(data.results), total: data.count };
  },

  async getById(id: string): Promise<Client> {
    const { data } = await clientApi.getById(id);
    return mapClientDtoToClient(data);
  },

  async create(input: CreateClientInput): Promise<Client> {
    const dto = mapCreateClientInputToDto(input);
    const { data } = await clientApi.create(dto);
    return mapClientDtoToClient(data);
  },

  async update(input: UpdateClientInput): Promise<Client> {
    const { id, ...rest } = input;
    const dto = mapCreateClientInputToDto(rest as CreateClientInput);
    const { data } = await clientApi.update(id, dto);
    return mapClientDtoToClient(data);
  },

  async remove(id: string): Promise<void> {
    await clientApi.remove(id);
  },

  /**
   * CDC criteria: "Alerte si un telephone ou email existe deja."
   * There is no dedicated duplicate-check endpoint in the confirmed
   * contract, so this is a best-effort, client-side check against the
   * currently loaded list (i.e. only catches duplicates visible on the
   * current page/search results — not a hard guarantee). A real
   * uniqueness constraint should still live on the backend; the create
   * flow also surfaces a 400 from the API if the backend rejects it.
   */
  findLocalDuplicate(
    clients: Client[],
    fields: { telephone?: string; email?: string },
  ): Client | undefined {
    return clients.find(
      (c) =>
        (fields.telephone && c.telephone === fields.telephone) ||
        (fields.email && c.email.toLowerCase() === fields.email.toLowerCase()),
    );
  },
};
