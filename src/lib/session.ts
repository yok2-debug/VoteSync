'use server';

import { cookies } from 'next/headers';
import type { AdminSessionPayload } from './types';
import { redirect } from 'next/navigation';

const ADMIN_SESSION_COOKIE_NAME = 'votesync_admin_session';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function createAdminSession(payload: Omit<AdminSessionPayload, 'expires'>) {
  const expires = new Date(Date.now() + SESSION_DURATION);
  const session = { ...payload, expires: expires.getTime() };

  cookies().set(ADMIN_SESSION_COOKIE_NAME, JSON.stringify(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expires.getTime(),
    path: '/',
    sameSite: 'lax',
  });
}


export async function getAdminSession(): Promise<AdminSessionPayload | null> {
    const sessionCookie = cookies().get(ADMIN_SESSION_COOKIE_NAME)?.value;

    if (!sessionCookie) {
        return null;
    }

    try {
        const parsed = JSON.parse(sessionCookie);
        if (parsed.expires && parsed.expires < Date.now()) {
            await deleteAdminSession();
            return null;
        }
        return parsed;
    } catch (error) {
        return null;
    }
}


export async function deleteAdminSession() {
  cookies().delete(ADMIN_SESSION_COOKIE_NAME);
}


export async function logoutAdmin() {
  cookies().delete(ADMIN_SESSION_COOKIE_NAME);
  redirect('/admin-login');
}
