import { espaceClientApi } from '../api/espaceClient.api';
import { mapCertificatIntegriteDTO } from '../api/espaceClient.mapper';
import type { CertificatIntegrite, SharedDocument } from '../types/client.types';

/**
 * Heuristique de détection d'un « acte signé ». Le backend renvoie désormais
 * un type explicite sur /portail/documents-partages/ : `categorie` = "acte_signe"
 * et `categorie_display` = "Acte signé" (DocumentPartageSerializer). Cette
 * fonction l'utilise EN PRIORITÉ ; l'heuristique de nom de fichier (« acte » +
 * sign/scell/paraph) ne sert que de secours pour les documents sans catégorie.
 */
export function isActeSigneDocument(document: SharedDocument): boolean {
  const categorie = document.categorie ?? document.type;
  if (categorie) {
    const c = categorie.toLowerCase();
    if (c.includes('acte') && /sign|scell/.test(c)) return true;
  }

  const name = document.name?.toLowerCase() ?? '';
  return (
    name.includes('acte') &&
    (name.includes('sign') || name.includes('scell') || name.includes('paraph'))
  );
}

/**
 * Récupère le certificat d'intégrité cryptographique d'un acte signé
 * (GET /api/portail/integrite/document/{id}/certificat/ — scoped client).
 * Le mapping défensif se fait dans la couche api/mapper — aucun
 * post-traitement ici.
 */
export async function getCertificatIntegrite(documentId: string): Promise<CertificatIntegrite> {
  const dto = await espaceClientApi.getIntegriteCertificat(documentId);
  return mapCertificatIntegriteDTO(dto);
}