export interface Election {
  id: string;
  name: string;
  description: string;
  startDate?: string;
  endDate?: string;
  status: 'active' | 'pending';
  candidates: Record<string, Candidate>;
  committee?: CommitteeMember[];
  voters?: Voter[];
  votes?: Record<string, string>; // { [voterId]: candidateId }
  results?: Record<string, number>; // { [candidateId]: voteCount }
}

export interface Candidate {
  id: string;
  name: string;
  orderNumber?: number;
  viceCandidateName?: string;
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
  followedElections?: Election[];
  nik?: string;
  birthPlace?: string;
  birthDate?: string; // dd-mm-yyyy
  gender?: 'Laki-laki' | 'Perempuan';
  address?: string;
}

export interface Category {
  id: string;
  name: string;
  allowedElections?: string[];
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

export interface AdminSessionPayload {
  isAdmin: true;
  expires?: number;
}

export interface VoterSessionPayload {
    voterId: string;
    expires?: number;
}

export interface Vote {
  id: string;
  electionId: string;
  candidateId: string;
  voterId: string;
  createdAt: string;
}
