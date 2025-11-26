'use server';

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { handleApiError, verifyAdminSession } from '../../lib/api-helpers';

export async function POST(request: Request) {
  try {
    await verifyAdminSession('candidates');
    const { electionId, candidates } = await request.json();

    if (!electionId || !Array.isArray(candidates)) {
      return NextResponse.json({ message: 'Data tidak valid' }, { status: 400 });
    }

    const updates: { [key: string]: any } = {};
    candidates.forEach((candidate, index) => {
      updates[`/elections/${electionId}/candidates/${candidate.id}/orderNumber`] = index + 1;
    });

    await adminDb.ref().update(updates);

    return NextResponse.json({ message: 'Urutan kandidat berhasil diperbarui' }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
