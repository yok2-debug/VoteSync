'use server';

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import type { Election } from '@/lib/types';
import { handleApiError, verifyAdminSession } from '../../lib/api-helpers';

export async function POST(request: Request) {
  try {
    await verifyAdminSession('settings');
    const { selections, originalElections } = await request.json();

    if (!selections || !Array.isArray(originalElections)) {
      return NextResponse.json({ message: 'Data tidak valid' }, { status: 400 });
    }

    const updates: { [key: string]: any } = {};

    originalElections.forEach((election: Election) => {
      const newSettings = selections[election.id];
      if (newSettings) {
        // Only update if there's a change to avoid unnecessary writes
        if (newSettings.show !== (election.showInRealCount || false)) {
          updates[`/elections/${election.id}/showInRealCount`] = newSettings.show;
        }
        if (newSettings.main !== (election.isMainInRealCount || false)) {
          updates[`/elections/${election.id}/isMainInRealCount`] = newSettings.main;
        }
      }
    });

    if (Object.keys(updates).length > 0) {
      await adminDb.ref().update(updates);
    }

    return NextResponse.json({ message: 'Pengaturan Real Count berhasil disimpan' }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
