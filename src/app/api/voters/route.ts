'use server';

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import type { Voter } from '@/lib/types';
import { handleApiError, verifyAdminSession } from '../lib/api-helpers';

export async function POST(request: Request) {
  try {
    await verifyAdminSession('voters');
    const data = await request.json();
    const { isEditing, ...voterData } = data;
    let voterId = voterData.id;

    if (isEditing) {
        if (!voterId) {
            return NextResponse.json({ message: 'ID Pemilih wajib diisi untuk pengeditan.' }, { status: 400 });
        }
        const voterRef = adminDb.ref(`voters/${voterId}`);
        const snapshot = await voterRef.get();
        if (!snapshot.exists()) {
            return NextResponse.json({ message: 'Pemilih tidak ditemukan.' }, { status: 404 });
        }
        
        const { password, ...restData } = voterData;
        
        const updateData: Partial<Voter> = { ...restData };
        if (password) {
            updateData.password = password;
        }

        await voterRef.update(updateData);
        return NextResponse.json({ message: 'Pemilih berhasil diperbarui', id: voterId }, { status: 200 });
    } else {
        const voterRef = voterId ? adminDb.ref(`voters/${voterId}`) : adminDb.ref('voters').push();
        voterId = voterId || voterRef.key;

        if (!voterId) {
            throw new Error("Tidak dapat membuat ID pemilih baru.");
        }
        
        const snapshot = await voterRef.get();
        if (snapshot.exists()) {
            return NextResponse.json({ message: `ID Pemilih '${voterId}' sudah ada.` }, { status: 409 });
        }
        
        const newVoterData: Voter = {
            id: voterId,
            name: voterData.name,
            category: voterData.category,
            password: voterData.password || Math.random().toString(36).slice(-6),
            nik: voterData.nik || '',
            birthPlace: voterData.birthPlace || '',
            birthDate: voterData.birthDate || '',
            gender: voterData.gender,
            address: voterData.address || '',
            hasVoted: {},
        };

        await voterRef.set(newVoterData);
        return NextResponse.json({ message: 'Pemilih berhasil dibuat', id: voterId }, { status: 201 });
    }
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    await verifyAdminSession('voters');
    const { voterIds } = await request.json();

    if (!voterIds || !Array.isArray(voterIds) || voterIds.length === 0) {
      return NextResponse.json({ message: 'ID Pemilih wajib diisi' }, { status: 400 });
    }

    const updates: { [key: string]: null } = {};
    voterIds.forEach(id => {
        updates[`/voters/${id}`] = null;
    });

    await adminDb.ref().update(updates);

    return NextResponse.json({ message: `${voterIds.length} pemilih berhasil dihapus` }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
