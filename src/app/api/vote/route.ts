'use server';

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { ServerValue } from 'firebase-admin/database';

export async function POST(request: Request) {
  try {
    const { electionId, candidateId, voterId } = await request.json();

    if (!electionId || !candidateId || !voterId) {
      return NextResponse.json({ message: 'Data tidak lengkap.' }, { status: 400 });
    }

    const voterRef = adminDb.ref(`voters/${voterId}`);
    const electionRef = adminDb.ref(`elections/${electionId}`);

    // 1. Periksa apakah pemilih sudah memberikan suara dalam pemilihan ini
    const hasVotedSnapshot = await adminDb.ref(`voters/${voterId}/hasVoted/${electionId}`).get();
    if (hasVotedSnapshot.exists() && hasVotedSnapshot.val() === true) {
      return NextResponse.json({ message: 'Anda sudah memberikan suara dalam pemilihan ini.' }, { status: 409 }); // 409 Conflict
    }

    // 2. Jalankan transaksi untuk memastikan integritas data
    const transactionResult = await electionRef.transaction((election) => {
        if (election) {
            // Inisialisasi jika path tidak ada
            if (!election.votes) {
                election.votes = {};
            }
            if (!election.results) {
                election.results = {};
            }
            if (!election.results[candidateId]) {
                election.results[candidateId] = 0;
            }

            // Catat suara pemilih
            election.votes[voterId] = candidateId;
            // Tambah jumlah suara kandidat
            election.results[candidateId]++;
        }
        return election;
    });

    if (!transactionResult.committed) {
         throw new Error('Transaksi suara gagal, mungkin ada konflik data. Silakan coba lagi.');
    }

    // 3. Tandai bahwa pemilih telah memilih
    await voterRef.child('hasVoted').child(electionId).set(true);

    return NextResponse.json({ message: 'Suara berhasil dicatat' }, { status: 200 });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan tidak diketahui';
    return NextResponse.json({ message: 'Gagal mencatat suara', error: errorMessage }, { status: 500 });
  }
}
