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

export async function getVoterById(voterId: string): Promise<Voter | null> {
  try {
    const snapshot = await get(ref(db, `voters/${voterId}`));
    if (snapshot.exists()) {
        return { id: snapshot.key!, ...snapshot.val() };
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

export async function getElectionById(id: string): Promise<Election | null> {
    try {
        const snapshot = await get(ref(db, `elections/${id}`));
        if (snapshot.exists()) {
            return { id, ...snapshot.val() };
        }
        return null;
    } catch (error) {
        console.error(`Error fetching election ${id}:`, error);
        return null;
    }
}


export async function getVoters(): Promise<Voter[]> {
    try {
        const snapshot = await get(ref(db, 'voters'));
        if (snapshot.exists()) {
            const votersData = snapshot.val();
            return Object.keys(votersData).map(id => ({
                id,
                ...votersData[id],
            }));
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

export async function getCategoryById(id: string): Promise<Category | null> {
    try {
        const snapshot = await get(ref(db, `categories/${id}`));
        if (snapshot.exists()) {
            return { id, ...snapshot.val() };
        }
        return null;
    } catch (error) {
        console.error(`Error fetching category ${id}:`, error);
        return null;
    }
}
