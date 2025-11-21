
'use server';

import { cookies } from 'next/headers';
import type { AdminSessionPayload, VoterSessionPayload } from './types';

const ADMIN_SESSION_COOKIE_NAME = 'votesync_admin_session';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

async function createSession(payload: AdminSessionPayload, role: 'admin') {
  const expires = new Date(Date.now() + SESSION_DURATION);
  const session = JSON.stringify({ ...payload, expires: expires.getTime() });
  const cookieName = ADMIN_SESSION_COOKIE_NAME;

  cookies().set(cookieName, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expires.getTime(),
    path: '/',
    sameSite: 'lax',
  });
}

export async function createAdminSession(payload: Omit<AdminSessionPayload, 'expires'>) {
    await createSession({ ...payload, isAdmin: true }, 'admin');
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

async function deleteSession(cookieName: string) {
  cookies().delete(cookieName);
}

export async function deleteAdminSession() {
    await deleteSession(ADMIN_SESSION_COOKIE_NAME);
}
