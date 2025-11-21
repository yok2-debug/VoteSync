
'use server';

import { db } from '@/lib/firebase';
import type { Admin, Category, Election, Voter } from '@/lib/types';
import { get, ref } from 'firebase/database';

export async function getAdminCredentials(): Promise<Admin> {
  try {
    const snapshot = await get(ref(db, 'admin'));
    if (snapshot.exists()) {
      return snapshot.val() as Admin;
    }
    // Return a default/empty object if it doesn't exist to prevent crashes
    return { username: '', password: '' };
  } catch (error) {
    console.error("Failed to get admin credentials:", error);
    // Return a default/empty object on error
    return { username: '', password: '' };
  }
}

export async function getVoters(): Promise<Voter[]> {
    try {
        const snapshot = await get(ref(db, 'voters'));
        const data = snapshot.val();
        // Ensure we always return an array, even if data is null or not an array
        if (Array.isArray(data)) {
            return data.filter(Boolean); // Filter out any null/falsy values from sparse arrays
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
            // Handle both object and array structures from Firebase
            if (Array.isArray(electionsData)) {
              return electionsData.filter(Boolean);
            }
            if (typeof electionsData === 'object' && electionsData !== null) {
              return Object.keys(electionsData).map(id => ({
                  id,
                  ...electionsData[id],
              }));
            }
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
            if (typeof categoriesData === 'object' && categoriesData !== null) {
                return Object.keys(categoriesData).map(id => ({
                    id,
                    ...categoriesData[id],
                }));
            }
        }
        return [];
    } catch (error) {
        console.error("Failed to get categories:", error);
        return [];
    }
}
