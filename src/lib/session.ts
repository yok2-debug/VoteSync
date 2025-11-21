'use server';

import { cookies } from 'next/headers';
import type { AdminSessionPayload, VoterSessionPayload } from './types';
import { getAdminCredentials } from './data';
import { z } from 'zod';

const ADMIN_SESSION_COOKIE_NAME = 'votesync_admin_session';
const VOTER_SESSION_COOKIE_NAME = 'votesync_voter_session';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function createAdminSession(payload: AdminSessionPayload) {
    const expires = new Date(Date.now() + SESSION_DURATION);
    cookies().set(ADMIN_SESSION_COOKIE_NAME, JSON.stringify(payload), { expires, httpOnly: true, secure: process.env.NODE_ENV === 'production' });
}

export async function createVoterSession(payload: VoterSessionPayload) {
    const expires = new Date(Date.now() + SESSION_DURATION);
    cookies().set(VOTER_SESSION_COOKIE_NAME, JSON.stringify(payload), { expires, httpOnly: true, secure: process.env.NODE_ENV === 'production' });
}

export async function deleteAdminSession() {
  cookies().delete(ADMIN_SESSION_COOKIE_NAME);
}

export async function deleteVoterSession() {
    cookies().delete(VOTER_SESSION_COOKIE_NAME);
}

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export async function loginAdmin(values: unknown) {
  const parsedCredentials = loginSchema.safeParse(values);

  if (!parsedCredentials.success) {
    return { success: false, error: 'Invalid data format.' };
  }
  
  const { username, password } = parsedCredentials.data;
  
  try {
    const adminCreds = await getAdminCredentials();

    if (adminCreds && adminCreds.username === username && adminCreds.password === password) {
      const sessionPayload = { isAdmin: true, username: username };
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
