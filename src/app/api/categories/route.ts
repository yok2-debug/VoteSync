'use server';

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { handleApiError, verifyAdminSession } from '../lib/api-helpers';

export async function POST(request: Request) {
  try {
    await verifyAdminSession('categories');
    const data = await request.json();
    const { isEditing, id, ...categoryData } = data;
    
    let categoryId = id;

    if (isEditing) {
        if (!categoryId) {
            return NextResponse.json({ message: 'ID Kategori wajib diisi untuk pengeditan.' }, { status: 400 });
        }
        await adminDb.ref(`categories/${categoryId}`).set({ ...categoryData, id: categoryId });
        return NextResponse.json({ message: 'Kategori berhasil diperbarui', id: categoryId }, { status: 200 });
    } else {
        const newCategoryRef = adminDb.ref('categories').push();
        categoryId = newCategoryRef.key;
        if (!categoryId) throw new Error("Gagal membuat kunci kategori baru.");

        await newCategoryRef.set({ ...categoryData, id: categoryId });
        return NextResponse.json({ message: 'Kategori berhasil dibuat', id: categoryId }, { status: 201 });
    }
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    await verifyAdminSession('categories');
    const { categoryId } = await request.json();

    if (!categoryId) {
      return NextResponse.json({ message: 'ID Kategori wajib diisi' }, { status: 400 });
    }

    // Optional: Check if category is in use by voters before deleting
    const votersSnapshot = await adminDb.ref('voters').get();
    if (votersSnapshot.exists()) {
        const voters = votersSnapshot.val();
        const isCategoryInUse = Object.values(voters).some((voter: any) => voter.category === categoryId);
        if (isCategoryInUse) {
            return NextResponse.json({ message: 'Kategori tidak dapat dihapus karena masih digunakan oleh pemilih.' }, { status: 409 }); // 409 Conflict
        }
    }

    await adminDb.ref(`categories/${categoryId}`).remove();

    return NextResponse.json({ message: 'Kategori berhasil dihapus' }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
