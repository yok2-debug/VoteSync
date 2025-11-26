'use server';

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { handleApiError, verifyAdminSession } from '../lib/api-helpers';

export async function POST(request: Request) {
  try {
    await verifyAdminSession('users');
    const data = await request.json();
    const { isEditing, id, ...roleData } = data;
    
    let roleId = id;

    if (isEditing) {
        if (!roleId) {
            return NextResponse.json({ message: 'ID Peran wajib diisi untuk pengeditan.' }, { status: 400 });
        }
        await adminDb.ref(`roles/${roleId}`).set({ ...roleData, id: roleId });
        return NextResponse.json({ message: 'Peran berhasil diperbarui', id: roleId }, { status: 200 });
    } else {
        const newRoleRef = adminDb.ref('roles').push();
        roleId = newRoleRef.key;
        if (!roleId) throw new Error("Gagal membuat kunci peran baru.");

        await newRoleRef.set({ ...roleData, id: roleId });
        return NextResponse.json({ message: 'Peran berhasil dibuat', id: roleId }, { status: 201 });
    }
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    await verifyAdminSession('users');
    const { roleId } = await request.json();

    if (!roleId) {
      return NextResponse.json({ message: 'ID Peran wajib diisi' }, { status: 400 });
    }

    const usersSnapshot = await adminDb.ref('users').get();
    if (usersSnapshot.exists()) {
      const users = usersSnapshot.val();
      const isRoleInUse = Object.values(users).some((user: any) => user.roleId === roleId);
      if (isRoleInUse) {
        return NextResponse.json({ message: 'Peran tidak dapat dihapus karena masih digunakan oleh pengguna.' }, { status: 409 });
      }
    }

    await adminDb.ref(`roles/${roleId}`).remove();

    return NextResponse.json({ message: 'Peran berhasil dihapus' }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
