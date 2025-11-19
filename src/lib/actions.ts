'use server';

import { getAdminCredentials, getVoterById, getElections, getCategories as getAllCategories, getVoters } from '@/lib/data';
import { createSession, deleteSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import * as z from 'zod';
import { db } from '@/lib/firebase';
import { ref, remove, get, child, update, set, push } from 'firebase/database';
import type { Category, Election, Voter } from './types';

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
      await createSession({ isAdmin: true });
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
      await createSession({ voterId: voter.id });
      return { success: true, redirectPath: '/vote' };
    } else {
      return { success: false, error: 'Invalid voter ID or password.' };
    }
  }

  return { success: false, error: 'Invalid role.' };
}

export async function logout() {
  await deleteSession();
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
export async function saveCategory(category: { id?: string; name: string }): Promise<void> {
  try {
    if (category.id) {
      // Update existing category
      await set(ref(db, `categories/${category.id}`), {
        name: category.name,
      });
    } else {
      // Create new category
      const newCategoryRef = push(ref(db, 'categories'));
      await set(newCategoryRef, { name: category.name });
    }
    revalidatePath('/admin/categories');
  } catch (error) {
    console.error('Error saving category:', error);
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
      console.error('Error deleting category:', error);
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
    status: formData.get('status') as 'pending' | 'ongoing' | 'completed',
    candidates: JSON.parse(formData.get('candidates') as string),
  };
  
  let savedElectionId = rawData.id;

  try {
    const isNewElection = savedElectionId === 'new';
    if (isNewElection) {
        const newElectionRef = push(ref(db, `elections`));
        savedElectionId = newElectionRef.key!;
    }
    
    // Fetch existing candidates to avoid overwriting them if they are not in the form
    let existingCandidates: Record<string, any> = {};
    if (!isNewElection) {
        const electionSnapshot = await get(ref(db, `elections/${savedElectionId}/candidates`));
        if (electionSnapshot.exists()) {
            existingCandidates = electionSnapshot.val();
        }
    }
    
    const candidatesObject = rawData.candidates.reduce((acc: any, candidate: any) => {
        let candidateId = candidate.id || '';
        if (candidate.id?.startsWith('temp-') || !candidate.id) {
          candidateId = push(ref(db, `elections/${savedElectionId}/candidates`)).key!;
        }

        acc[candidateId] = { ...candidate, id: candidateId };
        return acc;
    }, {});

    const electionData = {
        name: rawData.name,
        description: rawData.description,
        status: rawData.status,
        candidates: candidatesObject,
    };
    
    await set(ref(db, `elections/${savedElectionId}`), electionData);
    
    revalidatePath('/admin/elections');
    revalidatePath(`/admin/elections/${savedElectionId}`);
    return { savedElectionId };

  } catch (error) {
    console.error('Error saving election:', error);
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
        console.error('Error deleting election:', error);
        throw new Error('Could not delete election. Please try again.');
    }
}


// Voter Actions
export async function saveVoter(voter: Omit<Voter, 'hasVoted'>): Promise<Voter> {
  const { id, ...voterData } = voter;

  try {
    if (!voter.isEditing) {
        const existingVoter = await getVoterById(id);
        if (existingVoter) {
            throw new Error(`Voter with ID "${id}" already exists.`);
        }
    }
    
    // We don't save the `isEditing` flag to the database.
    const { isEditing, ...dataToSave } = voterData;

    const voterRef = ref(db, `voters/${id}`);
    
    if (voter.isEditing) {
      // For editing, we merge data to not overwrite `hasVoted` status.
      const snapshot = await get(voterRef);
      const existingData = snapshot.val() || {};

      // Only update password if a new one is provided
      if (!dataToSave.password) {
        delete dataToSave.password;
      }
      
      await set(voterRef, { ...existingData, ...dataToSave });
    } else {
      // For new voters, we set the data directly.
      await set(voterRef, dataToSave);
    }

    revalidatePath('/admin/voters');
    
    // Return the full voter object as it is in the database.
    const newSnapshot = await get(voterRef);
    return { id, ...newSnapshot.val() };

  } catch (error) {
    console.error('Error saving voter:', error);
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
    console.error('Error deleting voter:', error);
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
    console.error('Error resetting password:', error);
    throw new Error('Could not reset password. Please try again.');
  }
}
