'use server';

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { handleApiError, verifyAdminSession } from '../lib/api-helpers';

export async function POST(request: Request) {
  try {
    await verifyAdminSession('candidates');
    const data = await request.json();
    const { isEditing, initialData, electionId, ...candidateData } = data;

    if (!electionId) {
      return NextResponse.json({ message: 'ID Pemilihan wajib diisi.' }, { status: 400 });
    }

    if (isEditing && initialData) {
      // If electionId is changed, we need to move the candidate
      if (initialData.electionId !== electionId) {
          // Remove from old election
          await adminDb.ref(`elections/${initialData.electionId}/candidates/${initialData.id}`).remove();
      }
      
      const candidateRef = adminDb.ref(`elections/${electionId}/candidates/${initialData.id}`);
      await candidateRef.update({ ...candidateData, id: initialData.id });
      
      return NextResponse.json({ message: 'Kandidat berhasil diperbarui' }, { status: 200 });

    } else {
      // Creating new candidate
      const voterId = candidateData.voterId;
      if (!voterId) {
        return NextResponse.json({ message: 'ID Pemilih wajib diisi untuk kandidat baru.' }, { status: 400 });
      }
      
      // Ensure orderNumber is set if not provided
      if (!candidateData.orderNumber) {
        const candidatesSnapshot = await adminDb.ref(`elections/${electionId}/candidates`).get();
        const candidates = candidatesSnapshot.val() || {};
        const maxOrder = Object.values(candidates).reduce((max: number, cand: any) => Math.max(max, cand.orderNumber || 0), 0);
        candidateData.orderNumber = maxOrder + 1;
      }
      
      const newCandidateRef = adminDb.ref(`elections/${electionId}/candidates/${voterId}`);
      await newCandidateRef.set({ ...candidateData, id: voterId });

      return NextResponse.json({ message: 'Kandidat berhasil dibuat' }, { status: 201 });
    }
  } catch (error) {
    return handleApiError(error);
  }
}


export async function DELETE(request: Request) {
  try {
    await verifyAdminSession('candidates');
    const { electionId, candidateId } = await request.json();

    if (!electionId || !candidateId) {
      return NextResponse.json({ message: 'ID Pemilihan dan ID Kandidat wajib diisi' }, { status: 400 });
    }

    await adminDb.ref(`elections/${electionId}/candidates/${candidateId}`).remove();

    return NextResponse.json({ message: 'Kandidat berhasil dihapus' }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
