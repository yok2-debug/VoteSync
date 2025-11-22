'use server';

import { db } from '@/lib/firebase';
import type { Admin } from '@/lib/types';
import { get, ref, update } from 'firebase/database';

export async function getAdminCredentials(): Promise<Admin | null> {
  try {
    const snapshot = await get(ref(db, 'admin'));
    return snapshot.val();
  } catch (error) {
    console.error("Error fetching admin credentials:", error);
    return null;
  }
}

export async function updateAdminPassword(currentPassword: string, newPassword: string): Promise<void> {
  const adminRef = ref(db, 'admin');
  const snapshot = await get(adminRef);
  const adminData = snapshot.val();

  if (!adminData) {
    throw new Error('Admin credentials not found in the database.');
  }

  if (adminData.password !== currentPassword) {
    throw new Error('Current password does not match.');
  }

  await update(adminRef, { password: newPassword });
}
