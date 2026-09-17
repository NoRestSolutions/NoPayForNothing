import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

interface User {
  id: string;
  wallet_address: string;
  email?: string;
  name?: string;
  role: string;
  avatar_url?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    const token = api.getToken();
    if (token) {
      api.getMe()
        .then(user => {
          setState({ user, isAuthenticated: true, isLoading: false });
        })
        .catch(() => {
          api.setToken(null);
          setState({ user: null, isAuthenticated: false, isLoading: false });
        });
    } else {
      setState({ user: null, isAuthenticated: false, isLoading: false });
    }
  }, []);

  const signIn = useCallback(async () => {
    try {
      // Check if window.ethereum is available
      if (!(window as any).ethereum) {
        throw new Error('No Ethereum wallet found. Please install MetaMask.');
      }

      // Request account access
      const accounts = await (window as any).ethereum.request({
        method: 'eth_requestAccounts',
      });

      const address = accounts[0];

      // Create SIWE message
      const domain = window.location.hostname;
      const message = `${domain} wants you to sign in with your Ethereum account:\n${address}\n\nSign in to SecureMarket`;

      // Sign message
      const signature = await (window as any).ethereum.request({
        method: 'personal_sign',
        params: [message, address],
      });

      // Send to backend
      const { token, user } = await api.signInWithEthereum(message, signature);
      api.setToken(token);
      setState({ user, isAuthenticated: true, isLoading: false });

      return user;
    } catch (error) {
      console.error('Sign in failed:', error);
      throw error;
    }
  }, []);

  const signOut = useCallback(() => {
    api.setToken(null);
    setState({ user: null, isAuthenticated: false, isLoading: false });
  }, []);

  return {
    ...state,
    signIn,
    signOut,
  };
}
