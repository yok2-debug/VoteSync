
'use server';

import { getAdminCredentials, getVoterById, getCategories } from '@/lib/data';
import { createAdminSession, createVoterSession, deleteAdminSession, deleteVoterSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import * as z from 'zod';
import { db } from '@/lib/firebase';
import { ref, remove, get, child, update, set, push, runTransaction } from 'firebase/database';
import type { Category, Election, Voter, Candidate } from './types';
import { getVoters } from './data';


const voterLoginSchema = z.object({
  voterId: z.string(),
  password: z.string(),
});

const adminLoginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

type LoginResult = {
  success: boolean;
  error?: string;
  redirectPath?: string;
};

export async function login(
  values: z.infer<typeof voterLoginSchema> | z.infer<typeof adminLoginSchema>,
  role: 'voter' | 'admin'
): Promise<LoginResult> {
  if (role === 'admin') {
    const parsedValues = adminLoginSchema.safeParse(values);
    if (!parsedValues.success) {
      return { success: false, error: 'Invalid input.' };
    }

    const adminCreds = await getAdminCredentials();
    if (
      adminCreds &&
      adminCreds.username === parsedValues.data.username &&
      adminCreds.password === parsedValues.data.password
    ) {
      await createAdminSession({ isAdmin: true });
      return { success: true, redirectPath: '/admin/dashboard' };
    } else {
      return { success: false, error: 'Invalid admin credentials.' };
    }
  }

  if (role === 'voter') {
    const parsedValues = voterLoginSchema.safeParse(values);
    if (!parsedValues.success) {
      return { success: false, error: 'Invalid input.' };
    }

    const voter = await getVoterById(parsedValues.data.voterId);
    if (voter && voter.password === parsedValues.data.password) {
      await createVoterSession({ voterId: voter.id });
      return { success: true, redirectPath: '/vote' };
    } else {
      return { success: false, error: 'Invalid voter ID or password.' };
    }
  }

  return { success: false, error: 'Invalid role.' };
}

export async function logout(role: 'admin' | 'voter') {
  if (role === 'admin') {
    await deleteAdminSession();
  } else {
    await deleteVoterSession();
  }
  revalidatePath('/');
}

export async function performResetAction(action: string) {
  const dbRef = ref(db);
  switch (action) {
    case 'reset_voter_status':
      const votersSnapshot = await get(child(dbRef, 'voters'));
      if (votersSnapshot.exists()) {
        const updates: { [key: string]: null } = {};
        votersSnapshot.forEach((voter) => {
          updates[`/voters/${voter.key}/hasVoted`] = null;
        });
        await update(dbRef, updates);
      }
      break;
    case 'reset_election_results':
      const electionsSnapshot = await get(child(dbRef, 'elections'));
      if (electionsSnapshot.exists()) {
        const updates: { [key: string]: null } = {};
        electionsSnapshot.forEach((election) => {
          updates[`/elections/${election.key}/votes`] = null;
          updates[`/elections/${election.key}/results`] = null;
        });
        await update(dbRef, updates);
      }
      break;
    case 'delete_all_voters':
      await remove(child(dbRef, 'voters'));
      break;
    case 'reset_all_elections':
      await remove(child(dbRef, 'elections'));
      break;
    default:
      throw new Error('Invalid reset action');
  }
  revalidatePath('/admin/settings');
}

// Category Actions
export async function saveCategory(category: { id?: string; name: string; allowedElections?: string[] }): Promise<void> {
  try {
    const dataToSave = {
      name: category.name,
      allowedElections: category.allowedElections || [],
    };
    let categoryId = category.id;
    if (!categoryId) {
      // Create new category
      categoryId = push(ref(db, 'categories')).key!;
    }
    await set(ref(db, `categories/${categoryId}`), dataToSave);
    revalidatePath('/admin/categories');
  } catch (error) {
    throw new Error('Could not save category. Please try again.');
  }
}

export async function deleteCategory(categoryId: string): Promise<void> {
    try {
      const allVoters = await getVoters();
      const isCategoryInUse = allVoters.some(voter => voter.category === categoryId);
  
      if (isCategoryInUse) {
        throw new Error('Cannot delete category. It is currently assigned to one or more voters.');
      }
  
      await remove(ref(db, `categories/${categoryId}`));
      revalidatePath('/admin/categories');
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Could not delete category. Please try again.');
    }
}


// Election Actions
export async function saveElection(formData: FormData): Promise<{ savedElectionId: string; }> {
  const electionId = formData.get('id') as string;
  
  const rawData = {
    id: electionId,
    name: formData.get('name') as string,
    description: formData.get('description') as string,
    status: formData.get('status') as 'pending' | 'active',
    startDate: formData.get('startDate') as string | null,
    endDate: formData.get('endDate') as string | null,
    committee: JSON.parse(formData.get('committee') as string),
  };
  
  let savedElectionId = rawData.id;

  try {
    const isNewElection = savedElectionId === 'new';
    if (isNewElection) {
        const newElectionRef = push(ref(db, `elections`));
        savedElectionId = newElectionRef.key!;
    }
    
    const electionData: Partial<Omit<Election, 'id' | 'candidates'>> = {
        name: rawData.name,
        description: rawData.description,
        status: rawData.status,
        committee: rawData.committee || [],
    };

    if (rawData.startDate) {
        electionData.startDate = rawData.startDate;
    }
    if (rawData.endDate) {
        electionData.endDate = rawData.endDate;
    }
    
    const electionSnapshot = await get(ref(db, `elections/${savedElectionId}`));
    const existingData = electionSnapshot.val() || {};

    await set(ref(db, `elections/${savedElectionId}`), {
        ...existingData,
        ...electionData
    });
    
    revalidatePath('/admin/elections');
    revalidatePath(`/admin/elections/${savedElectionId}`);
    return { savedElectionId };

  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('An unknown error occurred while saving the election.');
  }
}


export async function deleteElection(electionId: string): Promise<void> {
    try {
        await remove(ref(db, `elections/${electionId}`));
        revalidatePath('/admin/elections');
    } catch (error) {
        throw new Error('Could not delete election. Please try again.');
    }
}


// Voter Actions
export async function saveVoter(voter: Omit<Voter, 'hasVoted' | 'followedElections'>): Promise<Voter> {
  const { id, ...voterData } = voter;

  try {
    if (!voter.isEditing) {
        const existingVoter = await getVoterById(id);
        if (existingVoter) {
            throw new Error(`Voter with ID "${id}" already exists.`);
        }
    }
    
    const { isEditing, ...dataToSave } = voterData;

    const voterRef = ref(db, `voters/${id}`);
    
    if (voter.isEditing) {
      const snapshot = await get(voterRef);
      const existingData = snapshot.val() || {};
      
      if (!dataToSave.password) {
        dataToSave.password = existingData.password;
      }
      
      await set(voterRef, { ...existingData, ...dataToSave });
    } else {
      await set(voterRef, dataToSave);
    }

    revalidatePath('/admin/voters');
    
    const newSnapshot = await get(voterRef);
    return { id, ...newSnapshot.val() };

  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Could not save voter. Please try again.');
  }
}

export async function deleteVoter(voterId: string): Promise<void> {
  try {
    await remove(ref(db, `voters/${voterId}`));
    revalidatePath('/admin/voters');
  } catch (error) {
    throw new Error('Could not delete voter. Please try again.');
  }
}

export async function resetVoterPassword(voterId: string, newPassword: string):Promise<void> {
  try {
    await update(ref(db, `voters/${voterId}`), {
      password: newPassword
    });
    revalidatePath('/admin/voters');
  } catch (error) {
    throw new Error('Could not reset password. Please try again.');
  }
}

const importVoterSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  nik: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  birthPlace: z.string().optional(),
  birthDate: z.string().optional(),
  gender: z.string().optional(),
  address: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  password: z.string().optional(),
});

const normalizeCategory = (name: string) => name ? name.replace(/\s+/g, '').toLowerCase() : '';

export async function importVoters(data: any[]): Promise<{ importedCount: number, importedVoters: Voter[] }> {
  const categories = await getCategories();
  const categoryNameMap = new Map(categories.map(c => [normalizeCategory(c.name), c.id]));
  const allVoters = await getVoters();
  const existingVoterIds = new Set(allVoters.map(v => v.id));

  const votersToImport: Record<string, Omit<Voter, 'id' | 'hasVoted'>> = {};
  const importedVoters: Voter[] = [];
  
  for (const row of data) {
    let gender = typeof row.gender === 'string' ? row.gender.trim() : '';
    if (gender.toUpperCase() === 'L') {
      gender = 'Laki-laki';
    } else if (gender.toUpperCase() === 'P') {
      gender = 'Perempuan';
    }

    const cleanRow = {
      id: typeof row.id === 'string' ? row.id.trim() : row.id,
      nik: row.nik ? String(row.nik).trim() : '',
      name: typeof row.name === 'string' ? row.name.trim() : row.name,
      birthPlace: typeof row.birthPlace === 'string' ? row.birthPlace.trim() : '',
      birthDate: typeof row.birthDate === 'string' ? row.birthDate.trim() : '',
      gender: gender,
      address: typeof row.address === 'string' ? row.address.trim() : '',
      category: typeof row.category === 'string' ? row.category.trim() : row.category,
      password: row.password,
    };
    
    const validation = importVoterSchema.safeParse(cleanRow);
    if (!validation.success) {
      throw new Error(`Invalid data in CSV: ${JSON.stringify(validation.error.flatten().fieldErrors)}`);
    }

    const { id, category, ...rest } = validation.data;

    if (existingVoterIds.has(id)) {
        throw new Error(`Voter with ID "${id}" already exists.`);
    }
    
    const normalizedCategory = normalizeCategory(category);
    const categoryId = categoryNameMap.get(normalizedCategory);

    if (!categoryId) {
        throw new Error(`Category "${category}" not found for voter "${rest.name}".`);
    }

    const voterData: Omit<Voter, 'id'| 'followedElections' | 'hasVoted'> = {
      ...rest,
      category: categoryId,
      password: rest.password || Math.random().toString(36).substring(2, 8),
    };

    if (voterData.gender && !['Laki-laki', 'Perempuan'].includes(voterData.gender)) {
        throw new Error(`Invalid gender: '${row.gender}'. Must be 'L', 'P', 'Laki-laki' or 'Perempuan'.`);
    }


    votersToImport[`voters/${id}`] = voterData;
    importedVoters.push({ id, ...voterData });
  }

  if (Object.keys(votersToImport).length > 0) {
    try {
      await update(ref(db), votersToImport);
    } catch (error) {
      throw new Error('Failed to save imported voters to the database.');
    }
  }
  
  revalidatePath('/admin/voters');
  return { importedCount: importedVoters.length, importedVoters: importedVoters };
}

// Vote Action
export async function saveVote(electionId: string, candidateId: string, voterId: string): Promise<void> {
  const electionRef = ref(db, `elections/${electionId}`);
  const voterRef = ref(db, `voters/${voterId}`);

  try {
    // Transaction on election data
    await runTransaction(electionRef, (election) => {
      if (election) {
        // Initialize paths if they don't exist
        if (!election.votes) election.votes = {};
        if (!election.results) election.results = {};

        // Check if the voter has already voted in this specific election's data
        if (election.votes[voterId]) {
          // Abort transaction if vote already exists
          return;
        }

        // Record the vote
        election.votes[voterId] = candidateId;

        // Increment result for the candidate
        if (!election.results[candidateId]) {
          election.results[candidateId] = 0;
        }
        election.results[candidateId]++;
      }
      return election;
    });

    // Separate transaction for the main voter object
    await runTransaction(voterRef, (voter) => {
      if (voter) {
        if (!voter.hasVoted) {
          voter.hasVoted = {};
        }
        // Mark the voter as having voted for this election
        voter.hasVoted[electionId] = true;
      }
      return voter;
    });

    revalidatePath('/vote');
    revalidatePath(`/vote/${electionId}`);
    revalidatePath('/real-count');
    revalidatePath('/admin/recapitulation');
    revalidatePath(`/admin/recapitulation/${electionId}`);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Could not save your vote.');
  }
}

// Candidate Actions
export async function saveCandidate(candidate: Omit<Candidate, 'id'> & { id?: string }, electionId: string): Promise<void> {
  try {
    let candidateId = candidate.id;
    const electionRef = ref(db, `elections/${electionId}`);
    
    // Validate order number uniqueness within the election
    const electionSnapshot = await get(electionRef);
    if (electionSnapshot.exists()) {
      const electionData: Election = electionSnapshot.val();
      const candidates = electionData.candidates || {};
      const isOrderNumberTaken = Object.values(candidates).some(
        c => c.orderNumber === candidate.orderNumber && c.id !== candidateId
      );
      if (isOrderNumberTaken) {
        throw new Error(`Nomor urut ${candidate.orderNumber} sudah digunakan oleh kandidat lain pada pemilihan ini.`);
      }
    } else {
        throw new Error("Pemilihan tidak ditemukan.");
    }

    const electionCandidatesRef = ref(db, `elections/${electionId}/candidates`);

    if (!candidateId || candidate.id.startsWith('new-')) {
      candidateId = push(electionCandidatesRef).key!;
    }
    
    const candidateToSave = { ...candidate, id: candidateId };
    
    const candidateRef = ref(db, `elections/${electionId}/candidates/${candidateId}`);
    await set(candidateRef, candidateToSave);
    
    revalidatePath('/admin/candidates');
    revalidatePath(`/admin/elections/${electionId}`);

  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Could not save candidate.');
  }
}

export async function deleteCandidate(candidateId: string, electionId: string): Promise<void> {
    try {
        const candidateRef = ref(db, `elections/${electionId}/candidates/${candidateId}`);
        const electionVotesRef = ref(db, `elections/${electionId}/votes`);
        const electionResultsRef = ref(db, `elections/${electionId}/results/${candidateId}`);

        const votesSnapshot = await get(electionVotesRef);
        if (votesSnapshot.exists()) {
            const votes = votesSnapshot.val();
            const hasVotes = Object.values(votes).some(vote => vote === candidateId);
            if (hasVotes) {
                throw new Error("Cannot delete candidate. They have already received votes in this election.");
            }
        }
        
        await remove(candidateRef);
        await remove(electionResultsRef);

        revalidatePath('/admin/candidates');
        revalidatePath(`/admin/elections/${electionId}`);

    } catch (error) {
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('Could not delete candidate.');
    }
}

export async function reorderCandidates(electionId: string, candidates: Candidate[]): Promise<void> {
  try {
    const updates: { [key: string]: any } = {};
    candidates.forEach((candidate, index) => {
      updates[`/elections/${electionId}/candidates/${candidate.id}/orderNumber`] = index + 1;
    });

    await update(ref(db), updates);
    revalidatePath('/admin/candidates');
    revalidatePath(`/admin/elections/${electionId}`);
  } catch (error) {
    throw new Error('Could not reorder candidates.');
  }
}
