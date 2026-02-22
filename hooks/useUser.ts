'use client';

import { useEffect, useState } from 'react';

interface User {
  userId: string;
  username: string;
  name: string;
  role: string;
  department: string;
  isLoggedIn: boolean;
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
    } finally {
      setLoading(false);
    }
  };

  return { user, loading, refetch: fetchUser };
}
