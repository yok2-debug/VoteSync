'use server';

import { cookies } from 'next/headers';
import type { AdminSessionPayload, VoterSessionPayload } from './types';
import { getAdminCredentials } from './data';
import { redirect } from 'next/navigation';

const ADMIN_SESSION_COOKIE_NAME = 'votesync_admin_session';
const VOTER_SESSION_COOKIE_NAME = 'votesync_voter_session';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

// --- Asynchronous Server Actions for creating/deleting sessions ---

export async function loginAdmin(values: {username: string, password: string}): Promise<{ error?: string, success?: boolean }> {
  try {
    const adminCreds = await getAdminCredentials();
    
    let isValid = false;
    
    // Check against credentials from DB
    if (adminCreds) {
      isValid = adminCreds.username === values.username && adminCreds.password === values.password;
    } else {
      // Fallback to default if DB is empty
      isValid = values.username === 'admin' && values.password === 'admin';
    }

    if (isValid) {
      const expires = new Date(Date.now() + SESSION_DURATION);
      cookies().set(ADMIN_SESSION_COOKIE_NAME, JSON.stringify({ isAdmin: true }), { expires, httpOnly: true });
      return { success: true };
    } else {
      return { error: 'Invalid admin credentials.' };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { error: errorMessage };
  }
}


export async function createVoterSession(payload: VoterSessionPayload) {
    const expires = new Date(Date.now() + SESSION_DURATION);
    cookies().set(VOTER_SESSION_COOKIE_NAME, JSON.stringify(payload), { expires, httpOnly: true });
}

export async function deleteAdminSession() {
  cookies().delete(ADMIN_SESSION_COOKIE_NAME);
}

export async function deleteVoterSession() {
    cookies().delete(VOTER_SESSION_COOKIE_NAME);
}
