'use client';

import React, { createContext, useReducer, useContext, useEffect, type Dispatch } from 'react';
import type { AppFile, Chat, AppSettings } from '@/lib/types';
import { DEFAULT_MODEL } from '@/lib/constants';

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
  | { type: 'UPDATE_SETTINGS'; payload: AppSettings };

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
    default:
      return state;
  }
};

const getInitialState = (): AppState => {
  if (typeof window === 'undefined') {
    return {
      files: [],
      chats: [],
      settings: { apiKey: '', model: DEFAULT_MODEL },
    };
  }
  try {
    const item = window.localStorage.getItem('raginfo-state');
    return item ? JSON.parse(item) : {
      files: [],
      chats: [],
      settings: { apiKey: '', model: DEFAULT_MODEL },
    };
  } catch (error) {
    console.error('Error reading from localStorage', error);
    return {
      files: [],
      chats: [],
      settings: { apiKey: '', model: DEFAULT_MODEL },
    };
  }
};


export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(appReducer, getInitialState());

  useEffect(() => {
    try {
      window.localStorage.setItem('raginfo-state', JSON.stringify(state));
    } catch (error) {
      console.error('Error writing to localStorage', error);
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
