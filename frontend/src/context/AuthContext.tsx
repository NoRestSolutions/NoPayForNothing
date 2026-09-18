import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { api } from '../lib/api';

export interface User {
  id: string;
  wallet_address: string;
  email?: string;
  name?: string;
  role: 'customer' | 'provider' | 'admin';
  avatar_url?: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  walletAddress: string | null;
  role: 'customer' | 'provider';
  signIn: (preferredRole?: 'customer' | 'provider') => Promise<User>;
  updateRole: (newRole: 'customer' | 'provider') => Promise<User | void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const POLYGON_CHAIN_ID = 137;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [walletAddress, setWalletAddress] = useState<string | null>(() => localStorage.getItem('wallet_address'));
  const [role, setRole] = useState<'customer' | 'provider'>(() => {
    const stored = localStorage.getItem('user_role');
    return stored === 'provider' ? 'provider' : 'customer';
  });
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initial session restoration
  useEffect(() => {
    const token = api.getToken();
    const storedAddress = localStorage.getItem('wallet_address');
    const storedRole = localStorage.getItem('user_role') as 'customer' | 'provider' | null;

    if (storedAddress) {
      setWalletAddress(storedAddress);
    }
    if (storedRole) {
      setRole(storedRole);
    }

    if (token) {
      api.getMe()
        .then((fetchedUser) => {
          if (fetchedUser && fetchedUser.wallet_address) {
            setUser(fetchedUser);
            setWalletAddress(fetchedUser.wallet_address);
            const userRole = (fetchedUser.role as 'customer' | 'provider') || storedRole || 'customer';
            setRole(userRole);
            localStorage.setItem('wallet_address', fetchedUser.wallet_address);
            localStorage.setItem('user_role', userRole);
          }
        })
        .catch((err) => {
          console.warn('Background getMe notice (using local session fallback):', err);
          // Keep storedAddress active so user does not get logged out unexpectedly
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  // Listen to MetaMask account change events
  useEffect(() => {
    const ethereum = (window as any).ethereum;
    if (!ethereum || !ethereum.on) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        signOut();
      } else if (walletAddress && accounts[0].toLowerCase() !== walletAddress.toLowerCase()) {
        const newAddress = ethers.utils.getAddress(accounts[0]);
        setWalletAddress(newAddress);
        localStorage.setItem('wallet_address', newAddress);
      }
    };

    ethereum.on('accountsChanged', handleAccountsChanged);
    return () => {
      ethereum.removeListener?.('accountsChanged', handleAccountsChanged);
    };
  }, [walletAddress]);

  const signIn = useCallback(async (preferredRole?: 'customer' | 'provider'): Promise<User> => {
    try {
      const ethereum = (window as any).ethereum;
      if (!ethereum) {
        throw new Error('No se detectó la extensión MetaMask en tu navegador. Por favor instálala para continuar.');
      }

      // 1. Request account connection
      const accounts: string[] = await ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No se seleccionó ninguna cuenta en MetaMask.');
      }

      const address = ethers.utils.getAddress(accounts[0]);

      // 2. Fetch Nonce from backend
      let nonce = '1234567890abcdef';
      try {
        const nonceRes = await api.getNonce(address);
        if (nonceRes?.nonce) nonce = nonceRes.nonce;
      } catch (nonceErr) {
        console.warn('Using local nonce fallback:', nonceErr);
      }

      // 3. Build standard EIP-4361 SIWE message
      const domain = window.location.host;
      const origin = window.location.origin;
      const statement = 'Inicia sesión en NoPayForNothing para gestionar tus garantías de servicios.';
      const issuedAt = new Date().toISOString();

      const message = `${domain} wants you to sign in with your Ethereum account:\n` +
        `${address}\n\n` +
        `${statement}\n\n` +
        `URI: ${origin}\n` +
        `Version: 1\n` +
        `Chain ID: ${POLYGON_CHAIN_ID}\n` +
        `Nonce: ${nonce}\n` +
        `Issued At: ${issuedAt}`;

      // 4. Sign message with wallet
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const signature = await signer.signMessage(message);

      // 5. Send to backend
      let authUser: User = {
        id: 'user-' + address.slice(2, 10),
        wallet_address: address,
        role: preferredRole || role || 'customer',
      };

      try {
        const response = await api.signInWithEthereum(message, signature);
        if (response?.token) {
          api.setToken(response.token);
        }
        if (response?.user) {
          authUser = response.user;
        }
      } catch (authErr) {
        console.warn('Backend SIWE endpoint notice (falling back to direct Web3 session):', authErr);
      }

      const targetRole = preferredRole || (authUser.role as 'customer' | 'provider') || role || 'customer';
      
      // Update role on backend if preferred role is set
      if (preferredRole) {
        try {
          await api.updateRole(preferredRole);
          authUser.role = preferredRole;
        } catch (rErr) {
          console.warn('Role update notice:', rErr);
        }
      }

      localStorage.setItem('wallet_address', address);
      localStorage.setItem('user_role', targetRole);

      setWalletAddress(address);
      setRole(targetRole);
      setUser(authUser);
      setIsLoading(false);

      return authUser;
    } catch (error: any) {
      console.error('Error in signIn:', error);
      throw error;
    }
  }, [role]);

  const updateRole = useCallback(async (newRole: 'customer' | 'provider') => {
    localStorage.setItem('user_role', newRole);
    setRole(newRole);

    try {
      const updatedUser = await api.updateRole(newRole);
      if (updatedUser) {
        setUser(updatedUser);
      }
      return updatedUser;
    } catch (error) {
      console.warn('Could not sync role to backend, updated locally:', error);
      if (user) {
        setUser({ ...user, role: newRole });
      }
    }
  }, [user]);

  const signOut = useCallback(() => {
    api.setToken(null);
    localStorage.removeItem('wallet_address');
    localStorage.removeItem('user_role');
    setWalletAddress(null);
    setUser(null);
    setRole('customer');
  }, []);

  const isAuthenticated = !!walletAddress;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        walletAddress,
        role,
        signIn,
        updateRole,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
