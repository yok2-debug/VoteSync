import type { AdminSessionPayload, VoterSessionPayload } from './types';

const ADMIN_SESSION_COOKIE_NAME = 'votesync_admin_session';
const VOTER_SESSION_COOKIE_NAME = 'votesync_voter_session';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

// This function now runs only on the client
function createSession(payload: AdminSessionPayload | VoterSessionPayload, role: 'admin' | 'voter') {
  if (typeof window === 'undefined') return; // Guard against server-side execution
  
  const expires = Date.now() + SESSION_DURATION;
  const session = JSON.stringify({ ...payload, expires });
  const storageKey = role === 'admin' ? ADMIN_SESSION_COOKIE_NAME : VOTER_SESSION_COOKIE_NAME;

  window.localStorage.setItem(storageKey, session);
}

export async function createAdminSession(payload: Omit<AdminSessionPayload, 'expires'>) {
    createSession({ ...payload, isAdmin: true }, 'admin');
}

export async function createVoterSession(payload: Omit<VoterSessionPayload, 'expires'>) {
    createSession(payload, 'voter');
}

// This function now runs only on the client
async function getSession<T>(storageKey: string): Promise<T | null> {
    if (typeof window === 'undefined') return null; // Guard against server-side execution

    const sessionString = window.localStorage.getItem(storageKey);

    if (!sessionString) {
        return null;
    }

    try {
        const parsed = JSON.parse(sessionString);
        if (parsed.expires && parsed.expires < Date.now()) {
            deleteSession(storageKey);
            return null;
        }
        return parsed as T;
    } catch (error) {
        return null;
    }
}

export async function getAdminSession(): Promise<AdminSessionPayload | null> {
    return getSession<AdminSessionPayload>(ADMIN_SESSION_COOKIE_NAME);
}

export async function getVoterSession(): Promise<VoterSessionPayload | null> {
    return getSession<VoterSessionPayload>(VOTER_SESSION_COOKIE_NAME);
}

// This function now runs only on the client
function deleteSession(storageKey: string) {
  if (typeof window === 'undefined') return; // Guard against server-side execution
  window.localStorage.removeItem(storageKey);
}

export async function deleteAdminSession() {
    deleteSession(ADMIN_SESSION_COOKIE_NAME);
}

export async function deleteVoterSession() {
    deleteSession(VOTER_SESSION_COOKIE_NAME);
}
