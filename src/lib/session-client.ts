'use client';

import type { AdminSessionPayload, VoterSessionPayload } from './types';

const VOTER_SESSION_COOKIE_NAME = 'votesync_voter_session';
const ADMIN_SESSION_COOKIE_NAME = 'votesync_admin_session_client';

// For voter session
export function getVoterSession(): VoterSessionPayload | null {
  if (typeof window === 'undefined') return null;
  const session = localStorage.getItem(VOTER_SESSION_COOKIE_NAME);
  if (!session) return null;
  try {
    return JSON.parse(session);
  } catch (e) {
    return null;
  }
}

export function setVoterSession(payload: VoterSessionPayload) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(VOTER_SESSION_COOKIE_NAME, JSON.stringify(payload));
}

export function deleteVoterSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(VOTER_SESSION_COOKIE_NAME);
}

// For admin session (client-side copy for UI purposes)
export function getAdminSession(): AdminSessionPayload | null {
    if (typeof window === 'undefined') return null;
    const sessionCookie = document.cookie.split('; ').find(row => row.startsWith('votesync_admin_session='));
    const sessionValue = sessionCookie?.split('=')[1];
    
    if (!sessionValue) return null;
    try {
      const decoded = decodeURIComponent(sessionValue);
      return JSON.parse(decoded);
    } catch (e) {
      console.error("Failed to parse admin session from cookie", e);
      return null;
    }
}


export function deleteAdminSession() {
  if (typeof window === 'undefined') return;
  // This function is now just for client-side cleanup if needed.
  // The server-side delete should handle the cookie.
  document.cookie = "votesync_admin_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}
