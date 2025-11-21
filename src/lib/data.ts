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

export async function getVoterById(voterId: string): Promise<Voter | null> {
  try {
    const snapshot = await get(ref(db, `voters/${voterId}`));
    if (snapshot.exists()) {
        const voterData = snapshot.val();
        return { id: snapshot.key!, ...voterData };
    }
    return null;
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

        // Handle both array and object structures
        if (Array.isArray(votersData)) {
            return votersData
                .filter(v => v !== null) // Filter out null entries in the array
                .map((voter, index) => {
                  const id = voter.id || voter.nik || String(index);
                   if (voter.id) return voter;
                    return {
                      id: id,
                      ...voter
                    };
                });
        }
        
        return Object.keys(votersData).map(id => ({
          id,
          ...votersData[id],
        }));
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
