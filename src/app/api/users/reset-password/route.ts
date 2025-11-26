'use server';

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { handleApiError, verifyAdminSession } from '../../lib/api-helpers';

export async function POST(request: Request) {
  try {
    await verifyAdminSession('users');
    const { userId, newPassword } = await request.json();

    if (!userId || !newPassword) {
      return NextResponse.json({ message: 'ID Pengguna dan kata sandi baru wajib diisi.' }, { status: 400 });
    }
    
    if (newPassword.length < 6) {
        return NextResponse.json({ message: 'Kata sandi minimal harus 6 karakter.' }, { status: 400 });
    }

    const userRef = adminDb.ref(`users/${userId}`);
    const userSnapshot = await userRef.get();
    
    if (!userSnapshot.exists()) {
        return NextResponse.json({ message: 'Pengguna tidak ditemukan.' }, { status: 404 });
    }

    await userRef.update({ password: newPassword });

    return NextResponse.json({ message: 'Kata sandi pengguna berhasil direset.' }, { status: 200 });

  } catch (error) {
    return handleApiError(error);
  }
}
