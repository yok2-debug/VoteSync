'use server';

import { db } from '@/lib/firebase';
import type { AdminUser, Role } from '@/lib/types';
import { get, ref, update, set } from 'firebase/database';

export async function getAdminUsers(): Promise<AdminUser[]> {
  try {
    const snapshot = await get(ref(db, 'users'));
    if (!snapshot.exists()) {
        // If no users node, create the default admin
        const superAdminRoleSnapshot = await get(ref(db, 'roles'));
        let superAdminRoleId = null;
        if (superAdminRoleSnapshot.exists()) {
            const roles = superAdminRoleSnapshot.val();
            for (const id in roles) {
                if (roles[id].name === 'Super Admin') {
                    superAdminRoleId = id;
                    break;
                }
            }
        }
        
        if (!superAdminRoleId) {
             const rolesRef = ref(db, 'roles');
             const newRoleRef = push(rolesRef);
             const superAdminRole: Omit<Role, 'id'> = {
                name: 'Super Admin',
                permissions: ['dashboard', 'elections', 'candidates', 'voters', 'categories', 'recapitulation', 'settings', 'users']
             };
             await set(newRoleRef, superAdminRole);
             superAdminRoleId = newRoleRef.key;
        }

        if(superAdminRoleId) {
            const usersRef = ref(db, 'users');
            const adminUserRef = push(usersRef);
            const defaultAdmin: Omit<AdminUser, 'id'> = {
                username: 'admin',
                password: 'admin',
                roleId: superAdminRoleId
            };
            await set(adminUserRef, defaultAdmin);
            return [{ ...defaultAdmin, id: adminUserRef.key! }];
        }
        return [];
    }
    const data = snapshot.val();
    return data ? Object.keys(data).map(id => ({ id, ...data[id] })) : [];
  } catch (error) {
    console.error("Error fetching admin users:", error);
    return [];
  }
}

export async function getRoles(): Promise<Role[]> {
    try {
        const snapshot = await get(ref(db, 'roles'));
        const data = snapshot.val();
        return data ? Object.keys(data).map(id => ({ id, ...data[id] })) : [];
    } catch (error) {
        console.error("Error fetching roles:", error);
        return [];
    }
}

export async function updateAdminPassword(userId: string, newPassword: string): Promise<void> {
  const userRef = ref(db, `users/${userId}`);
  const snapshot = await get(userRef);
  const userData = snapshot.val();

  if (!userData) {
    throw new Error('User not found in the database.');
  }

  await update(userRef, { password: newPassword });
}

export async function changeOwnPassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const userRef = ref(db, `users/${userId}`);
    const snapshot = await get(userRef);
    const userData = snapshot.val();
  
    if (!userData) {
      throw new Error('User not found.');
    }
  
    if (userData.password !== currentPassword) {
      throw new Error('Current password does not match.');
    }
  
    await update(userRef, { password: newPassword });
}
