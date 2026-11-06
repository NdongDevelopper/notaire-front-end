export interface Payment {
  id: string;
  categorie?: string;
  montant: number;
  date_paiement: string;
  mode: string;
  reference?: string;
}

export interface Invoice {
  id: string;
  categorie: string;
  montant: number;
  libelle: string;
}