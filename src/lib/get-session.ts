import { cookies } from 'next/headers';
import type { AdminSessionPayload, VoterSessionPayload } from './types';

const ADMIN_SESSION_COOKIE_NAME = 'votesync_admin_session';
const VOTER_SESSION_COOKIE_NAME = 'votesync_voter_session';

// --- Asynchronous functions for reading sessions ---

export async function getAdminSession(): Promise<AdminSessionPayload | null> {
    const session = cookies().get(ADMIN_SESSION_COOKIE_NAME)?.value;
    if (!session) return null;
    try {
        return JSON.parse(session);
    } catch (e) {
        return null;
    }
}

export async function getVoterSession(): Promise<VoterSessionPayload | null> {
    const session = cookies().get(VOTER_SESSION_COOKIE_NAME)?.value;
    if (!session) return null;
    try {
        return JSON.parse(session);
    } catch(e) {
        return null;
    }
}
