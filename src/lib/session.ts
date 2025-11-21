'use server';

import { cookies } from 'next/headers';
import type { AdminSessionPayload, VoterSessionPayload } from './types';
import { getAdminCredentials } from './data';
import { redirect } from 'next/navigation';

const ADMIN_SESSION_COOKIE_NAME = 'votesync_admin_session';
const VOTER_SESSION_COOKIE_NAME = 'votesync_voter_session';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

// --- Asynchronous Server Actions for creating/deleting sessions ---

export async function loginAdmin(values: {username: string, password: string}): Promise<{ error: string } | void> {
  const adminCreds = await getAdminCredentials();
  
  if (
    adminCreds &&
    adminCreds.username === values.username &&
    adminCreds.password === 'sayangku'
  ) {
    const expires = new Date(Date.now() + SESSION_DURATION);
    cookies().set(ADMIN_SESSION_COOKIE_NAME, JSON.stringify({ isAdmin: true }), { expires, httpOnly: true });
    
  } else {
    return { error: 'Invalid admin credentials.' };
  }
  // Redirect happens after the cookie is set
  redirect('/admin/dashboard');
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
