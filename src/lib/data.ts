
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

// Helper function to robustly process voter data which might be an array or object
const processVotersArray = (data: any): Voter[] => {
    if (!data) return [];
    if (Array.isArray(data)) {
        // Filter out null/undefined entries which can happen in Firebase arrays
        return data.filter(v => v).map((voter, index) => ({
            id: voter.id || voter.nik || String(index),
            ...voter
        }));
    }
    // Handle object-based structure from Firebase if it ever changes
    return Object.keys(data).map(id => ({ id, ...data[id] }));
}

export async function getVoterById(voterId: string): Promise<Voter | null> {
  try {
    // Since the data is an array, we must fetch all voters and then find the specific one.
    const voters = await getVoters();
    const voter = voters.find(v => v.id === voterId);
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

export async function getVoters(): Promise<Voter[]> {
    try {
        const votersSnapshot = await get(ref(db, 'voters'));
        if (!votersSnapshot.exists()) return [];
        const votersData = votersSnapshot.val();
        return processVotersArray(votersData);
    } catch (error) {
        console.error("Failed to get voters:", error);
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
