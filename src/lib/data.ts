
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
        if (!votersSnapshot.exists()) {
            return []; // Return empty array if no voters node
        }
        const votersData = votersSnapshot.val();
        if (Array.isArray(votersData)) {
            // Filter out any potential null/undefined values from Firebase array
            return votersData.filter(v => v).map((voter, index) => ({
                id: voter.id || voter.nik || String(index),
                ...voter
            }));
        }
        // Handle cases where data might be an object
        if (typeof votersData === 'object' && votersData !== null) {
            return Object.keys(votersData).map(id => ({ id, ...votersData[id] }));
        }
        return []; // Return empty array for any other unexpected data type
    } catch (error) {
        console.error("Failed to get voters:", error);
        return []; // Return empty array on error
    }
}

export async function getVoterById(voterId: string): Promise<Voter | null> {
  try {
    const voters = await getVoters();
    // Ensure we don't try to find on a non-array
    if (!Array.isArray(voters)) {
        return null;
    }
    const voter = voters.find(v => v && v.id === voterId);
    return voter || null;
  } catch (error) {
    console.error(`Failed to get voter by ID ${voterId}:`, error);
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
