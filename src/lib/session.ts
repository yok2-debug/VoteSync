import { cookies } from 'next/headers';
import type { SessionPayload } from './types';

const SESSION_COOKIE_NAME = 'votesync_session';

export async function createSession(payload: SessionPayload) {
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  const session = JSON.stringify({ ...payload, expires: expires.getTime() });

  cookies().set(SESSION_COOKIE_NAME, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires,
    path: '/',
    sameSite: 'lax',
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const sessionCookie = cookies().get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    return null;
  }

  try {
    const parsed = JSON.parse(sessionCookie);
    if (parsed.expires && parsed.expires < Date.now()) {
      await deleteSession();
      return null;
    }
    return parsed;
  } catch (error) {
    return null;
  }
}

export async function deleteSession() {
  cookies().delete(SESSION_COOKIE_NAME);
}
