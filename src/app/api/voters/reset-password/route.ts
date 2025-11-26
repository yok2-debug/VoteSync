'use server';

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { handleApiError, verifyAdminSession } from '../../lib/api-helpers';

export async function POST(request: Request) {
  try {
    await verifyAdminSession('voters');
    const { voterId, newPassword } = await request.json();

    if (!voterId || !newPassword) {
      return NextResponse.json({ message: 'ID Pemilih dan kata sandi baru wajib diisi.' }, { status: 400 });
    }

    if (newPassword.length < 6) {
        return NextResponse.json({ message: 'Kata sandi minimal harus 6 karakter.' }, { status: 400 });
    }

    const voterRef = adminDb.ref(`voters/${voterId}`);
    const voterSnapshot = await voterRef.get();
    
    if (!voterSnapshot.exists()) {
        return NextResponse.json({ message: 'Pemilih tidak ditemukan.' }, { status: 404 });
    }

    await voterRef.update({ password: newPassword });

    return NextResponse.json({ message: 'Kata sandi berhasil direset.' }, { status: 200 });

  } catch (error) {
    return handleApiError(error);
  }
}
