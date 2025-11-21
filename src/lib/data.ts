
'use server';

import { db } from '@/lib/firebase';
import type { Admin, Category, Election, Voter } from '@/lib/types';
import { get, ref } from 'firebase/database';

export async function getAdminCredentials(): Promise<Admin | null> {
  try {
    const snapshot = await get(ref(db, 'admin'));
    if (snapshot.exists()) {
      return snapshot.val() as Admin;
    }
    return null;
  } catch (error) {
    console.error("Failed to get admin credentials:", error);
    return null;
  }
}

export async function getVoters(): Promise<Voter[]> {
    try {
        const votersSnapshot = await get(ref(db, 'voters'));
        const votersData = votersSnapshot.val();
        if (Array.isArray(votersData)) {
            // Firebase can return arrays with null values for empty indices, filter them out.
            return votersData.filter(v => v !== null);
        }
        return [];
    } catch (error) {
        console.error("Failed to get voters:", error);
        return [];
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
        console.error("Failed to get elections:", error);
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
        console.error("Failed to get categories:", error);
        return [];
    }
}
