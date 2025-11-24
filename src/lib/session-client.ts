'use client';

import type { AdminSessionPayload, VoterSessionPayload } from './types';

const VOTER_SESSION_KEY = 'votesync_voter_session';
const ADMIN_SESSION_KEY = 'votesync_admin_session';

// For voter session
export function getVoterSession(): VoterSessionPayload | null {
  if (typeof window === 'undefined') return null;
  const session = localStorage.getItem(VOTER_SESSION_KEY);
  if (!session) return null;
  try {
    return JSON.parse(session);
  } catch (e) {
    return null;
  }
}

export async function setVoterSession(payload: VoterSessionPayload) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(VOTER_SESSION_KEY, JSON.stringify(payload));
}

export async function deleteVoterSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(VOTER_SESSION_KEY);
}

// For admin session (client-side copy for UI purposes)
export function getAdminSession(): AdminSessionPayload | null {
    if (typeof window === 'undefined') return null;
    const session = localStorage.getItem(ADMIN_SESSION_KEY);
    if (!session) return null;
    try {
        const parsed = JSON.parse(session);
        // Expiry check is primarily for server-side, but good to have client-side too
        if (parsed.expires && parsed.expires < Date.now()) {
            deleteAdminSession();
            return null;
        }
        return parsed;
    } catch (e) {
        return null;
    }
}

export async function setAdminSession(payload: AdminSessionPayload) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(payload));
}


export async function deleteAdminSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ADMIN_SESSION_KEY);
  // Also remove the server-side cookie by telling browser to expire it
  document.cookie = "votesync_admin_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}
