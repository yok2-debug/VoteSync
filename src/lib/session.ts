'use server';

import { cookies } from 'next/headers';
import type { AdminSessionPayload, VoterSessionPayload } from './types';

const ADMIN_SESSION_COOKIE_NAME = 'votesync_admin_session';
const VOTER_SESSION_COOKIE_NAME = 'votesync_voter_session';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function createAdminSession(payload: AdminSessionPayload) {
  const expires = new Date(Date.now() + SESSION_DURATION);
  cookies().set(ADMIN_SESSION_COOKIE_NAME, JSON.stringify(payload), { expires, httpOnly: true });
}

export async function createVoterSession(payload: VoterSessionPayload) {
    const expires = new Date(Date.now() + SESSION_DURATION);
    cookies().set(VOTER_SESSION_COOKIE_NAME, JSON.stringify(payload), { expires, httpOnly: true });
}

export async function getAdminSession(): Promise<AdminSessionPayload | null> {
    const session = cookies().get(ADMIN_SESSION_COOKIE_NAME)?.value;
    return session ? JSON.parse(session) : null;
}

export async function getVoterSession(): Promise<VoterSessionPayload | null> {
    const session = cookies().get(VOTER_SESSION_COOKIE_NAME)?.value;
    return session ? JSON.parse(session) : null;
}

export async function deleteAdminSession() {
  cookies().delete(ADMIN_SESSION_COOKIE_NAME);
}

export async function deleteVoterSession() {
    cookies().delete(VOTER_SESSION_COOKIE_NAME);
}
