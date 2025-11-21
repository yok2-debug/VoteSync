'use server';

import { cookies } from 'next/headers';
import type { AdminSessionPayload, VoterSessionPayload } from './types';
import { getAdminCredentials } from './data';

const ADMIN_SESSION_COOKIE_NAME = 'votesync_admin_session';
const VOTER_SESSION_COOKIE_NAME = 'votesync_voter_session';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function loginAdmin(values: {username: string, password: string}): Promise<{ error?: string, success?: boolean }> {
  try {
    const adminCreds = await getAdminCredentials();

    if (adminCreds && adminCreds.username === values.username && adminCreds.password === values.password) {
      const expires = new Date(Date.now() + SESSION_DURATION);
      const sessionPayload = JSON.stringify({ isAdmin: true, username: values.username });
      cookies().set(ADMIN_SESSION_COOKIE_NAME, sessionPayload, { expires, httpOnly: true });
      return { success: true };
    } else {
      return { error: 'Invalid username or password.' };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred.';
    console.error('Admin login error:', errorMessage);
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
