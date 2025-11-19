'use server';

import { getAdminCredentials, getVoterById } from '@/lib/data';
import { createSession, deleteSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import * as z from 'zod';
import { db } from '@/lib/firebase';
import { ref, remove, get, child, update } from 'firebase/database';

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
  redirect('/');
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
