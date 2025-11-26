'use server';

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { handleApiError, verifyAdminSession } from '../lib/api-helpers';

async function checkUsernameExists(username: string, userIdToExclude?: string): Promise<boolean> {
    const usersSnapshot = await adminDb.ref('users').get();
    if (!usersSnapshot.exists()) return false;

    const users = usersSnapshot.val();
    for (const id in users) {
        if (id !== userIdToExclude && users[id].username === username) {
            return true;
        }
    }
    return false;
}

export async function POST(request: Request) {
  try {
    await verifyAdminSession('users');
    const data = await request.json();
    const { isEditing, id, username, password, roleId } = data;
    
    let userId = id;

    if (isEditing) {
      if (!userId) {
        return NextResponse.json({ message: 'ID Pengguna wajib diisi untuk pengeditan.' }, { status: 400 });
      }
      
      const isUsernameTaken = await checkUsernameExists(username, userId);
      if (isUsernameTaken) {
        return NextResponse.json({ message: `Username "${username}" sudah digunakan.` }, { status: 409 });
      }

      const userRef = adminDb.ref(`users/${userId}`);
      const userSnapshot = await userRef.get();
      if (!userSnapshot.exists()) {
        return NextResponse.json({ message: 'Pengguna tidak ditemukan.' }, { status: 404 });
      }
      const existingUserData = userSnapshot.val();

      const updatedData = {
        ...existingUserData,
        username,
        roleId,
        ...(password && { password: password }), // Only update password if provided
      };
      
      await userRef.set(updatedData);
      return NextResponse.json({ message: 'Pengguna berhasil diperbarui', id: userId }, { status: 200 });

    } else {
        const isUsernameTaken = await checkUsernameExists(username);
        if (isUsernameTaken) {
            return NextResponse.json({ message: `Username "${username}" sudah digunakan.` }, { status: 409 });
        }

        const newUserRef = adminDb.ref('users').push();
        userId = newUserRef.key;
        if (!userId) throw new Error("Gagal membuat kunci pengguna baru.");

        const newUserData: any = {
            id: userId,
            username,
            roleId,
            password: password || Math.random().toString(36).slice(-8),
        };

        await newUserRef.set(newUserData);
        return NextResponse.json({ message: 'Pengguna berhasil dibuat', id: userId }, { status: 201 });
    }
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    await verifyAdminSession('users');
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ message: 'ID Pengguna wajib diisi' }, { status: 400 });
    }

    const userRef = adminDb.ref(`users/${userId}`);
    const userSnapshot = await userRef.get();
    if (userSnapshot.exists() && userSnapshot.val().username === 'admin') {
         return NextResponse.json({ message: 'Pengguna "admin" tidak dapat dihapus.' }, { status: 403 });
    }

    await userRef.remove();

    return NextResponse.json({ message: 'Pengguna berhasil dihapus' }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
