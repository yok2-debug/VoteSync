'use server';

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { handleApiError, verifyAdminSession } from '../../lib/api-helpers';

export async function POST(request: Request) {
  try {
    await verifyAdminSession('settings');
    const { action } = await request.json();

    switch (action) {
      case 'reset_votes_and_status':
        await resetVotesAndStatus();
        break;
      case 'delete_all_voters':
        await adminDb.ref('voters').set(null);
        break;
      case 'reset_all_elections':
         await adminDb.ref('elections').set(null);
         await resetVotesAndStatus(); // Also clear hasVoted flags from any remaining voters
         // Clear election links from categories
         const categoriesSnapshot = await adminDb.ref('categories').get();
         if (categoriesSnapshot.exists()) {
              const updates: {[key: string]: null} = {};
              categoriesSnapshot.forEach(snap => {
                  updates[`/categories/${snap.key}/allowedElections`] = null;
              });
              await adminDb.ref().update(updates);
         }
        break;
      default:
        return NextResponse.json({ message: 'Aksi tidak valid' }, { status: 400 });
    }

    return NextResponse.json({ message: `Aksi '${action}' berhasil diselesaikan` }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

async function resetVotesAndStatus() {
  // 1. Reset hasVoted status for all voters
  const votersSnapshot = await adminDb.ref('voters').get();
  if (votersSnapshot.exists()) {
    const updates: { [key: string]: null } = {};
    votersSnapshot.forEach((voterSnap) => {
      updates[`/voters/${voterSnap.key}/hasVoted`] = null;
    });
    await adminDb.ref().update(updates);
  }

  // 2. Clear votes and results from all elections
  const electionsSnapshot = await adminDb.ref('elections').get();
  if (electionsSnapshot.exists()) {
    const updates: { [key: string]: null } = {};
    electionsSnapshot.forEach((electionSnap) => {
      updates[`/elections/${electionSnap.key}/votes`] = null;
      updates[`/elections/${electionSnap.key}/results`] = null;
    });
    await adminDb.ref().update(updates);
  }
}
