
'use server';

import { cookies } from 'next/headers';
import type { AdminSessionPayload, Voter, VoterSessionPayload } from './types';
import { getAdminCredentials, getVoters } from './data';
import { z } from 'zod';

const ADMIN_SESSION_COOKIE_NAME = 'votesync_admin_session';
const VOTER_SESSION_COOKIE_NAME = 'votesync_voter_session';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

// --- Admin Session ---

export async function createAdminSession(payload: AdminSessionPayload) {
    const expires = new Date(Date.now() + SESSION_DURATION);
    cookies().set(ADMIN_SESSION_COOKIE_NAME, JSON.stringify(payload), { expires, httpOnly: true, secure: process.env.NODE_ENV === 'production' });
}

export async function deleteAdminSession() {
  cookies().delete(ADMIN_SESSION_COOKIE_NAME);
}

const adminLoginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export async function loginAdmin(values: unknown) {
  const parsedCredentials = adminLoginSchema.safeParse(values);

  if (!parsedCredentials.success) {
    return { success: false, error: 'Invalid data format.' };
  }
  
  const { username, password } = parsedCredentials.data;
  
  try {
    const adminCreds = await getAdminCredentials();

    if (adminCreds && adminCreds.username === username && adminCreds.password === password) {
      const sessionPayload = { isAdmin: true };
      await createAdminSession(sessionPayload);
      return { success: true };
    } else {
      return { success: false, error: 'Invalid username or password' };
    }
  } catch (error) {
    console.error('Admin login error:', error);
    return { success: false, error: 'An internal server error occurred.' };
  }
}


// --- Voter Session ---

export async function createVoterSession(payload: VoterSessionPayload) {
    const expires = new Date(Date.now() + SESSION_DURATION);
    cookies().set(VOTER_SESSION_COOKIE_NAME, JSON.stringify(payload), { expires, httpOnly: true, secure: process.env.NODE_ENV === 'production' });
}

export async function deleteVoterSession() {
    cookies().delete(VOTER_SESSION_COOKIE_NAME);
}


const voterLoginSchema = z.object({
  voterId: z.string(),
  password: z.string(),
});

export async function loginVoter(values: unknown): Promise<{ success: boolean; error?: string; voterId?: string }> {
    const parsedCredentials = voterLoginSchema.safeParse(values);

    if (!parsedCredentials.success) {
        return { success: false, error: 'Invalid data format.' };
    }

    const { voterId, password } = parsedCredentials.data;

    try {
        const allVoters = await getVoters();
        
        const voter = allVoters.find(v => v.id === voterId);
        
        if (voter && voter.password === password) {
            const sessionPayload = { voterId: voter.id };
            await createVoterSession(sessionPayload);
            return { success: true, voterId: voter.id };
        } else {
            return { success: false, error: 'Invalid voter ID or password.' };
        }
    } catch (error) {
        console.error('Voter login error:', error);
        return { success: false, error: 'An internal server error occurred.' };
    }
}
