
'use server';

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

async function enrichVoterWithElections(
    voterData: Omit<Voter, 'id' | 'followedElections'>, 
    id: string,
    allCategories: Category[],
    allElections: Election[]
): Promise<Voter> {
    const voterCategory = allCategories.find(c => c.id === voterData.category);
    const followedElections = allElections.filter(e => voterCategory?.allowedElections?.includes(e.id));
    return { id, ...voterData, followedElections };
}

export async function getVoterById(voterId: string): Promise<Voter | null> {
  try {
    const snapshot = await get(ref(db, `voters/${voterId}`));
    if (snapshot.exists()) {
        const voterData = snapshot.val();
        const [categories, elections] = await Promise.all([
            getCategories(),
            getElections()
        ]);
        return await enrichVoterWithElections(voterData, snapshot.key!, categories, elections);
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
        const [categories, elections] = await Promise.all([
            getCategories(),
            getElections()
        ]);
        
        const votersPromises = Object.keys(votersData).map(id => 
            enrichVoterWithElections(votersData[id], id, categories, elections)
        );
        return await Promise.all(votersPromises);
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
