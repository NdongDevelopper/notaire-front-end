import type { Case, CaseStatus } from "./case";

export interface ExtendedCase extends Omit<Case, "clients"> {
  clients?: Array<{
    id: string;
    name: string;
    role: string;
  }>;
}

export interface CaseDetailsPageProps {
  onAddClient: (caseId: string, clientName: string, role: string) => void;
  onStatusChange: (caseId: string, newStatus: CaseStatus) => void;
}