export interface JournalEntry {
  id: string;
  action: string;
  utilisateur: string;
  created_at: string;
  details?: string;
}