'use server';

import { db } from '@/lib/firebase';
import type { AdminUser, Role, Permission } from '@/lib/types';
import { get, ref, update, set, push } from 'firebase/database';

async function initializeDefaultAdmin() {
  // Check if roles exist
  const rolesSnapshot = await get(ref(db, 'roles'));
  let superAdminRoleId: string | null = null;

  if (rolesSnapshot.exists()) {
    const roles = rolesSnapshot.val();
    for (const id in roles) {
      if (roles[id].name === 'Super Admin') {
        superAdminRoleId = id;
        break;
      }
    }
  }

  // If Super Admin role doesn't exist, create it
  if (!superAdminRoleId) {
    const newRoleRef = push(ref(db, 'roles'));
    const allPermissions: Permission[] = ['dashboard', 'elections', 'candidates', 'voters', 'categories', 'recapitulation', 'settings', 'users'];
    const superAdminRole: Omit<Role, 'id'> = {
      name: 'Super Admin',
      permissions: allPermissions
    };
    await set(newRoleRef, superAdminRole);
    superAdminRoleId = newRoleRef.key;
  }

  // Check if users exist
  const usersSnapshot = await get(ref(db, 'users'));
  if (!usersSnapshot.exists() && superAdminRoleId) {
    // If no users node, create the default admin
    const defaultAdmin: Omit<AdminUser, 'id'> = {
      username: 'admin',
      password: 'admin',
      roleId: superAdminRoleId
    };
    const newUserRef = push(ref(db, 'users'));
    await set(newUserRef, defaultAdmin);
    return [{ ...defaultAdmin, id: newUserRef.key! }];
  }

  const usersData = usersSnapshot.val();
  return usersData ? Object.keys(usersData).map(id => ({ id, ...usersData[id] })) : [];
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  try {
    const users = await initializeDefaultAdmin();
    return users;
  } catch (error) {
    console.error("Error fetching/initializing admin users:", error);
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
