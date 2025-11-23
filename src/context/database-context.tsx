'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { Election, Voter, Category, Role, AdminUser } from '@/lib/types';
import { db } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';

interface DatabaseContextType {
  elections: Election[];
  voters: Voter[];
  categories: Category[];
  roles: Role[];
  adminUsers: AdminUser[];
  isLoading: boolean;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export function DatabaseProvider({ children }: { children: ReactNode }) {
  const [elections, setElections] = useState<Election[]>([]);
  const [voters, setVoters] = useState<Voter[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const refs = {
      elections: ref(db, 'elections'),
      voters: ref(db, 'voters'),
      categories: ref(db, 'categories'),
      roles: ref(db, 'roles'),
      users: ref(db, 'users'),
    };

    let loaded = {
        elections: false,
        voters: false,
        categories: false,
        roles: false,
        users: false,
    };
    
    const checkAllLoaded = () => {
      if (Object.values(loaded).every(Boolean)) {
        setIsLoading(false);
      }
    };

    const createUnsubscriber = (
      nodeRef: any,
      setter: React.Dispatch<React.SetStateAction<any[]>>,
      key: keyof typeof loaded
    ) => {
      return onValue(nodeRef, (snapshot) => {
        const data = snapshot.val();
        const array = data ? Object.keys(data).map(id => ({ id, ...data[id] })) : [];
        setter(array);
        loaded[key] = true;
        checkAllLoaded();
      }, () => {
        // Handle potential errors or empty nodes
        setter([]);
        loaded[key] = true;
        checkAllLoaded();
      });
    };

    const unsubElections = createUnsubscriber(refs.elections, setElections, 'elections');
    const unsubVoters = createUnsubscriber(refs.voters, setVoters, 'voters');
    const unsubCategories = createUnsubscriber(refs.categories, setCategories, 'categories');
    const unsubRoles = createUnsubscriber(refs.roles, setRoles, 'roles');
    const unsubUsers = createUnsubscriber(refs.users, setAdminUsers, 'users');
    
    // Safety timeout in case Firebase listeners don't fire for empty nodes
    const timeout = setTimeout(() => {
      if(isLoading) {
        setIsLoading(false);
      }
    }, 2500);

    return () => {
      clearTimeout(timeout);
      unsubElections();
      unsubVoters();
      unsubCategories();
      unsubRoles();
      unsubUsers();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = { elections, voters, categories, roles, adminUsers, isLoading };

  return <DatabaseContext.Provider value={value}>{children}</DatabaseContext.Provider>;
}

export function useDatabase() {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
}
