'use server';

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import type { Voter } from '@/lib/types';
import { handleApiError, verifyAdminSession } from '../../lib/api-helpers';

// Helper to normalize category names for robust matching
const normalizeCategory = (name: string) => name ? name.replace(/\s+/g, '').toLowerCase() : '';

export async function POST(request: Request) {
  try {
    await verifyAdminSession('voters');
    const { voters } = await request.json();

    if (!Array.isArray(voters) || voters.length === 0) {
      return NextResponse.json({ message: 'Tidak ada data pemilih untuk diimpor.' }, { status: 400 });
    }

    // Fetch existing categories to map names to IDs
    const categoriesSnapshot = await adminDb.ref('categories').get();
    if (!categoriesSnapshot.exists()) {
        return NextResponse.json({ message: 'Tidak ada kategori di database. Buat kategori terlebih dahulu.' }, { status: 400 });
    }
    const categoryNameMap = new Map<string, string>();
    categoriesSnapshot.forEach(snap => {
        const catData = snap.val();
        categoryNameMap.set(normalizeCategory(catData.name), catData.id);
    });

    const updates: { [key: string]: Voter } = {};
    const errors: string[] = [];

    for (const voterData of voters) {
      const id = voterData.id;
      if (!id) {
          errors.push(`Data baris tanpa ID dilewati: ${voterData.name}`);
          continue;
      }
      
      const normalizedCatName = normalizeCategory(voterData.category);
      const categoryId = categoryNameMap.get(normalizedCatName);

      if (!categoryId) {
          errors.push(`Kategori '${voterData.category}' untuk ${voterData.name} (ID: ${id}) tidak ditemukan.`);
          continue;
      }

      const newVoter: Voter = {
        id: id,
        name: voterData.name || '',
        category: categoryId,
        password: voterData.password || Math.random().toString(36).slice(-6),
        nik: voterData.nik || '',
        birthPlace: voterData.birthPlace || '',
        birthDate: voterData.birthDate || '',
        gender: voterData.gender || undefined,
        address: voterData.address || '',
        hasVoted: {},
      };
      updates[`/voters/${id}`] = newVoter;
    }
    
    if (errors.length > 0) {
        // You could choose to fail the whole batch, or import the valid ones.
        // Here, we'll return the errors and not import anything to ensure data integrity.
        // For a more lenient approach, you could import `updates` and return `errors`.
        return NextResponse.json({ message: 'Impor dibatalkan karena ada error.', errors }, { status: 400 });
    }
    
    if (Object.keys(updates).length > 0) {
        await adminDb.ref().update(updates);
    }

    return NextResponse.json({ message: `${Object.keys(updates).length} pemilih berhasil diimpor.` }, { status: 200 });

  } catch (error) {
    return handleApiError(error);
  }
}
