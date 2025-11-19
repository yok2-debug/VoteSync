export interface Election {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'ongoing' | 'completed';
  candidates: Record<string, Candidate>;
  committee?: CommitteeMember[];
  voters?: Voter[];
  votes?: Record<string, string>; // { [voterId]: candidateId }
  results?: Record<string, number>; // { [candidateId]: voteCount }
  allowedCategories?: string[]; // Array of category IDs
}

export interface Candidate {
  id: string;
  name: string;
  photo?: string;
  vision?: string;
  mission?: string;
}

export interface CommitteeMember {
  name: string;
  role: 'Ketua' | 'Anggota';
}

export interface Voter {
  id: string;
  name: string;
  category: string; // categoryId
  password?: string;
  hasVoted?: Record<string, boolean>; // { [electionId]: true }
  isEditing?: boolean; // client-side only
}

export interface Category {
  id: string;
  name: string;
}

export type Admin = {
  username: string;
  password?: string; // Should be handled securely, not stored plainly
};

export type AppSettings = {
  app_name: string;
  vote_name: string;
  periode: string;
};

export interface SessionPayload {
  voterId?: string;
  isAdmin?: boolean;
  expires?: number;
}
