import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

export type Role =
  | 'admin'
  | 'sku_manager'
  | 'stock_counter'
  | 'stock_counter_toko'
  | 'stock_counter_gudang'
  | 'cashier'
  | 'driver'
  | 'production';

interface AuthContextType {
  user: any | null;
  role: Role;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  // Role helper flags
  isAdmin: boolean;
  canCount: boolean;
  canCountToko: boolean;
  canCountGudang: boolean;
  showAllLocationTabs: boolean;
  canCreateSession: boolean;
  canCompleteSession: boolean;
  canCountLocation: (locationType: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [role, setRole] = useState<Role>('stock_counter');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const fetchRole = async () => {
    try {
      const res = await api.get('/roles/me');
      const roleData = res.data;
      const fetchedRole = (roleData?.[0]?.role || roleData?.role || 'stock_counter') as Role;
      setRole(fetchedRole);
      await AsyncStorage.setItem('user_role', fetchedRole);
      return fetchedRole;
    } catch (err) {
      // Try to load from cache
      const cached = await AsyncStorage.getItem('user_role');
      if (cached) setRole(cached as Role);
      return cached as Role || 'stock_counter';
    }
  };

  const checkLoginStatus = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user_data');
      const cachedRole = await AsyncStorage.getItem('user_role');
      if (cachedRole) setRole(cachedRole as Role);

      if (storedUser) {
        setUser(JSON.parse(storedUser));
        // Verify with server & refresh role
        const res = await api.get('/auth/user');
        setUser(res.data);
        await AsyncStorage.setItem('user_data', JSON.stringify(res.data));
        await fetchRole();
      }
    } catch (err) {
      console.log('Not logged in or session expired');
      await AsyncStorage.removeItem('user_data');
      await AsyncStorage.removeItem('user_cookie');
      await AsyncStorage.removeItem('user_role');
      setUser(null);
      setRole('stock_counter');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      const res = await api.post('/auth/login', { username, password });
      setUser(res.data);
      await AsyncStorage.setItem('user_data', JSON.stringify(res.data));
      await fetchRole();
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Gagal login');
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setRole('stock_counter');
      await AsyncStorage.removeItem('user_data');
      await AsyncStorage.removeItem('user_cookie');
      await AsyncStorage.removeItem('user_role');
    }
  };

  // --- Role helper flags (mirrors use-role.ts from web) ---
  const isAdmin = role === 'admin';
  const isSKUManager = role === 'sku_manager';
  const canCount = isAdmin || role === 'stock_counter' || role === 'stock_counter_toko' || role === 'stock_counter_gudang';
  const canCountToko = isAdmin || role === 'stock_counter_toko' || role === 'stock_counter';
  const canCountGudang = isAdmin || role === 'stock_counter_gudang' || role === 'stock_counter';
  const showAllLocationTabs = isAdmin || isSKUManager || role === 'stock_counter';
  const canCreateSession = isAdmin || isSKUManager || role === 'stock_counter';
  const canCompleteSession = isAdmin || isSKUManager || role === 'stock_counter';

  const canCountLocation = (locationType: string) => {
    if (isAdmin || role === 'stock_counter') return true;
    if (locationType === 'toko' && role === 'stock_counter_toko') return true;
    if (locationType === 'gudang' && role === 'stock_counter_gudang') return true;
    return false;
  };

  return (
    <AuthContext.Provider value={{
      user, role, isLoading, login, logout,
      isAdmin, canCount, canCountToko, canCountGudang,
      showAllLocationTabs, canCreateSession, canCompleteSession,
      canCountLocation,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
