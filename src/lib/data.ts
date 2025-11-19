
'use server';

import { db } from '@/lib/firebase';
import type { Admin, Category, Election, Voter } from '@/lib/types';
import { get, ref } from 'firebase/database';

export async function getAdminCredentials(): Promise<Admin | null> {
  try {
    const snapshot = await get(ref(db, 'admin'));
    return snapshot.val();
  } catch (error) {
    console.error('Error fetching admin credentials:', error);
    return null;
  }
}

async function enrichVoterWithElections(voterData: Omit<Voter, 'id'>, id: string): Promise<Voter> {
    const [categories, elections] = await Promise.all([
        getCategories(),
        getElections()
    ]);
    const voterCategory = categories.find(c => c.id === voterData.category);
    const followedElections = elections.filter(e => voterCategory?.allowedElections?.includes(e.id));
    return { id, ...voterData, followedElections };
}

export async function getVoterById(voterId: string): Promise<Voter | null> {
  try {
    const snapshot = await get(ref(db, `voters/${voterId}`));
    if (snapshot.exists()) {
        const voterData = snapshot.val();
        return await enrichVoterWithElections(voterData, snapshot.key!);
    }
    return null;
  } catch (error) {
    console.error(`Error fetching voter ${voterId}:`, error);
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
        console.error('Error fetching elections:', error);
        return [];
    }
}

export async function getVoters(): Promise<Voter[]> {
    try {
        const snapshot = await get(ref(db, 'voters'));
        if (snapshot.exists()) {
            const votersData = snapshot.val();
            const votersPromises = Object.keys(votersData).map(id => 
                enrichVoterWithElections(votersData[id], id)
            );
            return await Promise.all(votersPromises);
        }
        return [];
    } catch (error) {
        console.error('Error fetching voters:', error);
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
        console.error('Error fetching categories:', error);
        return [];
    }
}
