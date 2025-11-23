export interface Election {
  id: string;
  name: string;
  description: string;
  startDate?: string;
  endDate?: string;
  status: 'active' | 'pending';
  candidates: Record<string, Candidate>;
  committee?: CommitteeMember[];
  votes?: Record<string, string>; // { [voterId]: candidateId }
  results?: Record<string, number>; // { [candidateId]: voteCount }
}

export interface Candidate {
  id: string;
  name: string;
  orderNumber?: number;
  viceCandidateId?: string;
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

export type Permission = 'dashboard' | 'elections' | 'candidates' | 'voters' | 'categories' | 'recapitulation' | 'settings' | 'users';

export interface Role {
    id: string;
    name: string;
    permissions: Permission[];
}

export interface AdminUser {
  id: string;
  username: string;
  password?: string;
  roleId: string;
}

export interface AdminSessionPayload {
  userId: string;
  username: string;
  permissions: Permission[];
  expires?: number;
}

export interface VoterSessionPayload {
    voterId: string;
    expires?: number;
}
