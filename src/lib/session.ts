import { cookies } from 'next/headers';
import type { AdminSessionPayload, VoterSessionPayload } from './types';

const ADMIN_SESSION_COOKIE_NAME = 'votesync_admin_session';
const VOTER_SESSION_COOKIE_NAME = 'votesync_voter_session';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

async function createSession(payload: AdminSessionPayload | VoterSessionPayload, role: 'admin' | 'voter') {
  const expires = new Date(Date.now() + SESSION_DURATION);
  const session = JSON.stringify({ ...payload, expires: expires.getTime() });
  const cookieName = role === 'admin' ? ADMIN_SESSION_COOKIE_NAME : VOTER_SESSION_COOKIE_NAME;

  cookies().set(cookieName, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires,
    path: '/',
    sameSite: 'lax',
  });
}

export async function createAdminSession(payload: Omit<AdminSessionPayload, 'expires'>) {
    await createSession({ ...payload, isAdmin: true }, 'admin');
}

export async function createVoterSession(payload: Omit<VoterSessionPayload, 'expires'>) {
    await createSession(payload, 'voter');
}


async function getSession<T>(cookieName: string): Promise<T | null> {
    const sessionCookie = cookies().get(cookieName)?.value;

    if (!sessionCookie) {
        return null;
    }

    try {
        const parsed = JSON.parse(sessionCookie);
        if (parsed.expires && parsed.expires < Date.now()) {
            await deleteSession(cookieName);
            return null;
        }
        return parsed;
    } catch (error) {
        return null;
    }
}

export async function getAdminSession(): Promise<AdminSessionPayload | null> {
    return await getSession<AdminSessionPayload>(ADMIN_SESSION_COOKIE_NAME);
}

export async function getVoterSession(): Promise<VoterSessionPayload | null> {
    return await getSession<VoterSessionPayload>(VOTER_SESSION_COOKIE_NAME);
}


async function deleteSession(cookieName: string) {
  cookies().delete(cookieName);
}

export async function deleteAdminSession() {
    await deleteSession(ADMIN_SESSION_COOKIE_NAME);
}

export async function deleteVoterSession() {
    await deleteSession(VOTER_SESSION_COOKIE_NAME);
}
