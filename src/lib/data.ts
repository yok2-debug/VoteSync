'use server';

import { db } from '@/lib/firebase';
import type { AdminUser, Role, Permission } from '@/lib/types';
import { get, ref, update, set, push } from 'firebase/database';

async function initializeDefaultAdmin(): Promise<void> {
  const rolesRef = ref(db, 'roles');
  const usersRef = ref(db, 'users');

  let superAdminRoleId: string | null = null;
  let adminUserExists = false;

  // 1. Check for Super Admin role
  const rolesSnapshot = await get(rolesRef);
  if (rolesSnapshot.exists()) {
    const roles = rolesSnapshot.val();
    for (const id in roles) {
      if (roles[id].name === 'Super Admin') {
        superAdminRoleId = id;
        break;
      }
    }
  }

  // 2. If Super Admin role doesn't exist, create it
  if (!superAdminRoleId) {
    const newRoleRef = push(rolesRef);
    const allPermissions: Permission[] = ['dashboard', 'elections', 'candidates', 'voters', 'categories', 'recapitulation', 'settings', 'users'];
    const superAdminRole: Omit<Role, 'id'> = {
      name: 'Super Admin',
      permissions: allPermissions
    };
    await set(newRoleRef, superAdminRole);
    superAdminRoleId = newRoleRef.key;
  }

  // 3. Check for 'admin' user
  const usersSnapshot = await get(usersRef);
  if (usersSnapshot.exists()) {
    const users = usersSnapshot.val();
    for (const id in users) {
      if (users[id].username === 'admin') {
        adminUserExists = true;
        break;
      }
    }
  }

  // 4. If 'admin' user doesn't exist, create it
  if (!adminUserExists && superAdminRoleId) {
    const defaultAdmin: Omit<AdminUser, 'id'> = {
      username: 'admin',
      password: 'admin',
      roleId: superAdminRoleId
    };
    // Note: We don't need to use push() for the very first user if the node doesn't exist,
    // but using a unique key is safer. Let's find a user with username 'admin' and if not found, create one.
    const newUserRef = push(usersRef);
    await set(newUserRef, defaultAdmin);
  }
}


export async function getAdminUsers(): Promise<AdminUser[]> {
  try {
    await initializeDefaultAdmin(); // Ensure default admin and role exist
    const usersSnapshot = await get(ref(db, 'users'));
    const usersData = usersSnapshot.val();
    return usersData ? Object.keys(usersData).map(id => ({ id, ...usersData[id] })) : [];
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
