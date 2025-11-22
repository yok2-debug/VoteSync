'use client';

import type { VoterSessionPayload } from './types';

const VOTER_SESSION_COOKIE_NAME = 'votesync_voter_session';

export function getVoterSession(): VoterSessionPayload | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const session = localStorage.getItem(VOTER_SESSION_COOKIE_NAME);
  if (!session) return null;
  try {
    const parsed = JSON.parse(session);
    // Optional: Add expiry check if needed
    // if (parsed.expires && parsed.expires < Date.now()) {
    //   deleteVoterSession();
    //   return null;
    // }
    return parsed;
  } catch (e) {
    return null;
  }
}

export function setVoterSession(payload: VoterSessionPayload) {
  if (typeof window === 'undefined') {
    return;
  }
  // Optional: Add expiry to payload
  // const expires = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days
  // const payloadWithExpiry = { ...payload, expires };
  localStorage.setItem(VOTER_SESSION_COOKIE_NAME, JSON.stringify(payload));
}

export function deleteVoterSession() {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.removeItem(VOTER_SESSION_COOKIE_NAME);
}
