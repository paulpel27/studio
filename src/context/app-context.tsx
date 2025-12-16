'use client';

import React, { createContext, useReducer, useContext, useEffect, type Dispatch } from 'react';
import type { AppFile, Chat, AppSettings } from '@/lib/types';
import { DEFAULT_MODEL } from '@/lib/constants';
import { encrypt, decrypt } from '@/lib/crypto';

interface AppState {
  files: AppFile[];
  chats: Chat[];
  settings: AppSettings;
}

type Action =
  | { type: 'ADD_FILE'; payload: AppFile }
  | { type: 'DELETE_FILE'; payload: { id: string } }
  | { type: 'ADD_CHAT'; payload: Chat }
  | { type: 'DELETE_CHAT'; payload: { id: string } }
  | { type: 'UPDATE_SETTINGS'; payload: AppSettings }
  | { type: 'SET_STATE'; payload: AppState };

const AppContext = createContext<{ state: AppState; dispatch: Dispatch<Action> } | undefined>(undefined);

const appReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'ADD_FILE':
      return { ...state, files: [...state.files, action.payload] };
    case 'DELETE_FILE':
      return { ...state, files: state.files.filter(file => file.id !== action.payload.id) };
    case 'ADD_CHAT':
      return { ...state, chats: [...state.chats, action.payload] };
    case 'DELETE_CHAT':
      return { ...state, chats: state.chats.filter(chat => chat.id !== action.payload.id) };
    case 'UPDATE_SETTINGS':
      return { ...state, settings: action.payload };
    case 'SET_STATE':
        return action.payload;
    default:
      return state;
  }
};

const getInitialState = (): AppState => {
  return {
    files: [],
    chats: [],
    settings: { apiKey: '', model: DEFAULT_MODEL },
  };
};

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(appReducer, getInitialState());

  // Load state from localStorage on initial mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const item = window.localStorage.getItem('raginfo-state');
        if (item) {
          const parsedState = JSON.parse(item) as AppState;
          // Decrypt the API key after loading
          if (parsedState.settings.apiKey) {
            decrypt(parsedState.settings.apiKey).then(decryptedKey => {
              parsedState.settings.apiKey = decryptedKey;
              dispatch({ type: 'SET_STATE', payload: parsedState });
            });
          } else {
             dispatch({ type: 'SET_STATE', payload: parsedState });
          }
        }
      } catch (error) {
        console.error('Error reading from localStorage', error);
      }
    }
  }, []);

  // Save state to localStorage on change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Don't save initial empty state
      if (state.files.length === 0 && state.chats.length === 0 && !state.settings.apiKey) {
        return;
      }
      // Encrypt the API key before saving
      encrypt(state.settings.apiKey).then(encryptedKey => {
        const stateToSave = {
          ...state,
          settings: {
            ...state.settings,
            apiKey: encryptedKey,
          },
        };
        try {
          window.localStorage.setItem('raginfo-state', JSON.stringify(stateToSave));
        } catch (error) {
          console.error('Error writing to localStorage', error);
        }
      });
    }
  }, [state]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
