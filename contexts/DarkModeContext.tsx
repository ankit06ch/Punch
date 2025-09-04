import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface DarkModeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  colors: {
    light: {
      background: string;
      surface: string;
      text: string;
      textSecondary: string;
      border: string;
      cardBackground: string;
      tagBackground: string;
      tagBorder: string;
    };
    dark: {
      background: string;
      surface: string;
      text: string;
      textSecondary: string;
      border: string;
      cardBackground: string;
      tagBackground: string;
      tagBorder: string;
    };
  };
  currentColors: any;
}

const DarkModeContext = createContext<DarkModeContextType | undefined>(undefined);

export const useDarkMode = () => {
  const context = useContext(DarkModeContext);
  if (context === undefined) {
    throw new Error('useDarkMode must be used within a DarkModeProvider');
  }
  return context;
};

const colors = {
  light: {
    background: '#FFFFFF',
    surface: '#F8F9FA',
    text: '#2C3E50',
    textSecondary: '#7F8C8D',
    border: '#E9ECEF',
    cardBackground: 'rgba(255,255,255,0.95)',
    tagBackground: 'rgba(255,255,255,0.2)',
    tagBorder: 'rgba(255,255,255,0.3)',
  },
  dark: {
    background: '#0F1419', // Dark navy
    surface: '#1A1F2E', // Slightly lighter navy
    text: '#FFFFFF',
    textSecondary: '#BDC3C7',
    border: '#2C3E50',
    cardBackground: 'rgba(26, 31, 46, 0.95)',
    tagBackground: 'rgba(251, 122, 32, 0.2)',
    tagBorder: 'rgba(251, 122, 32, 0.3)',
  }
};

export const DarkModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    loadDarkModePreference();
  }, []);

  const loadDarkModePreference = async () => {
    try {
      const savedMode = await AsyncStorage.getItem('darkMode');
      if (savedMode !== null) {
        setIsDarkMode(JSON.parse(savedMode));
      }
    } catch (error) {
      console.error('Error loading dark mode preference:', error);
      // Fallback to light mode if AsyncStorage fails
      setIsDarkMode(false);
    }
  };

  const toggleDarkMode = async () => {
    try {
      const newMode = !isDarkMode;
      setIsDarkMode(newMode);
      await AsyncStorage.setItem('darkMode', JSON.stringify(newMode));
    } catch (error) {
      console.error('Error saving dark mode preference:', error);
      // Still update the state even if saving fails
      setIsDarkMode(!isDarkMode);
    }
  };

  const currentColors = isDarkMode ? colors.dark : colors.light;

  const value = {
    isDarkMode,
    toggleDarkMode,
    colors,
    currentColors,
  };

  return (
    <DarkModeContext.Provider value={value}>
      {children}
    </DarkModeContext.Provider>
  );
};