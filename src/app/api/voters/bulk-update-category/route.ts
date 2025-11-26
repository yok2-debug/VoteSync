'use server';

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { handleApiError, verifyAdminSession } from '../../lib/api-helpers';

export async function POST(request: Request) {
  try {
    await verifyAdminSession('voters');
    const { voterIds, newCategoryId } = await request.json();

    if (!Array.isArray(voterIds) || voterIds.length === 0 || !newCategoryId) {
      return NextResponse.json({ message: 'Data tidak valid.' }, { status: 400 });
    }

    const updates: { [key: string]: string } = {};
    voterIds.forEach(id => {
      updates[`/voters/${id}/category`] = newCategoryId;
    });

    await adminDb.ref().update(updates);

    return NextResponse.json({ message: `${voterIds.length} pemilih berhasil diperbarui.` }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
