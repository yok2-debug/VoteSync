'use server';

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { handleApiError, verifyAdminSession } from '../lib/api-helpers';

export async function POST(request: Request) {
  try {
    await verifyAdminSession('elections');
    const data = await request.json();
    const { id, ...electionData } = data;
    
    let electionId = id;

    if (id === 'new') {
      // Create new election
      const newElectionRef = adminDb.ref('elections').push();
      electionId = newElectionRef.key;
       if (!electionId) {
        throw new Error("Could not generate a new election ID.");
      }
      await newElectionRef.set(electionData);
      return NextResponse.json({ message: 'Pemilihan berhasil dibuat', id: electionId }, { status: 201 });
    } else {
      // Update existing election
       if (!electionId) {
        return NextResponse.json({ message: 'ID Pemilihan tidak valid untuk pembaruan' }, { status: 400 });
      }
      const electionRef = adminDb.ref(`elections/${electionId}`);
      await electionRef.update(electionData);
      return NextResponse.json({ message: `Pemilihan berhasil diperbarui`, id: electionId }, { status: 200 });
    }
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    await verifyAdminSession('elections');
    const { electionId } = await request.json();

    if (!electionId) {
      return NextResponse.json({ message: 'ID Pemilihan wajib diisi' }, { status: 400 });
    }
    
    await adminDb.ref(`elections/${electionId}`).remove();

    return NextResponse.json({ message: 'Pemilihan berhasil dihapus' }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
