'use server';

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { AuthError, handleApiError, verifyAdminSession } from '../../lib/api-helpers';

export async function POST(request: Request) {
  try {
    // For this specific route, we don't need a specific permission,
    // just a valid session. We can check for any permission, e.g., 'dashboard'.
    // A better approach might be a dedicated 'profile' permission or just checking for a valid session.
    const session = await verifyAdminSession('dashboard'); 
    const { userId, currentPassword, newPassword } = await request.json();
    
    // Security check: ensure the user is only changing their own password
    if (session.userId !== userId) {
        throw new AuthError('Anda hanya dapat mengubah kata sandi Anda sendiri.');
    }

    if (!userId || !currentPassword || !newPassword) {
      return NextResponse.json({ message: 'Semua field wajib diisi.' }, { status: 400 });
    }
    
    if (newPassword.length < 6) {
        return NextResponse.json({ message: 'Kata sandi baru minimal harus 6 karakter.' }, { status: 400 });
    }

    const userRef = adminDb.ref(`users/${userId}`);
    const snapshot = await userRef.get();
    const userData = snapshot.val();

    if (!snapshot.exists()) {
        return NextResponse.json({ message: 'Pengguna tidak ditemukan.' }, { status: 404 });
    }

    if (userData.password !== currentPassword) {
        return NextResponse.json({ message: 'Kata sandi saat ini tidak cocok.' }, { status: 400 });
    }

    await userRef.update({ password: newPassword });

    return NextResponse.json({ message: 'Kata sandi berhasil diperbarui.' }, { status: 200 });

  } catch (error) {
    return handleApiError(error);
  }
}
