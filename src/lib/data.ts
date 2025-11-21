

import { db } from '@/lib/firebase';
import type { Admin, Category, Election, Voter } from '@/lib/types';
import { get, ref } from 'firebase/database';

export async function getAdminCredentials(): Promise<Admin | null> {
  try {
    const snapshot = await get(ref(db, 'admin'));
    return snapshot.val();
  } catch (error) {
    return null;
  }
}

export async function getVoterById(voterId: string): Promise<Voter | null> {
  try {
    const snapshot = await get(ref(db, `voters/${voterId}`));
    if (snapshot.exists()) {
        const voterData = snapshot.val();
        return { id: snapshot.key!, ...voterData };
    }
    return null;
  } catch (error) {
    return null;
  }
}

export async function getElections(): Promise<Election[]> {
    try {
        const snapshot = await get(ref(db, 'elections'));
        if (snapshot.exists()) {
            const electionsData = snapshot.val();
            return Object.keys(electionsData).map(id => ({
                id,
                ...electionsData[id],
            }));
        }
        return [];
    } catch (error) {
        return [];
    }
}

export async function getVoters(): Promise<Voter[]> {
    try {
        const votersSnapshot = await get(ref(db, 'voters'));
        if (!votersSnapshot.exists()) return [];
        const votersData = votersSnapshot.val();
        return Object.keys(votersData).map(id => ({
          id,
          ...votersData[id],
        }));
    } catch (error) {
        return [];
    }
}

export async function getCategories(): Promise<Category[]> {
    try {
        const snapshot = await get(ref(db, 'categories'));
        if (snapshot.exists()) {
            const categoriesData = snapshot.val();
            return Object.keys(categoriesData).map(id => ({
                id,
                ...categoriesData[id],
            }));
        }
        return [];
    } catch (error) {
        return [];
    }
}
