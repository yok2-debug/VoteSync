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
    return JSON.parse(session);
  } catch (e) {
    return null;
  }
}

export function setVoterSession(payload: VoterSessionPayload) {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.setItem(VOTER_SESSION_COOKIE_NAME, JSON.stringify(payload));
}

export function deleteVoterSession() {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.removeItem(VOTER_SESSION_COOKIE_NAME);
}
