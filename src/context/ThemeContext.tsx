import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { useColorScheme, Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark' | 'system';

interface Theme {
  background: string;
  surface: string;
  surfaceVariant: string;
  primary: string;
  primaryDark: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  error: string;
  warning: string;
  card: string;
  shadow: string;
  modalBackground: string;
  overlay: string;
}

const lightTheme: Theme = {
  background: '#F7F8FA',
  surface: '#FFFFFF',
  surfaceVariant: '#E8F6EF',
  primary: '#17C066',
  primaryDark: '#129854',
  text: '#1A1A1A',
  textSecondary: '#4B5563',
  border: '#E5E5E5',
  success: '#17C066',
  error: '#DC2626',
  warning: '#F59E0B',
  card: '#FFFFFF',
  shadow: 'rgba(17, 32, 23, 0.08)',
  modalBackground: 'rgba(26, 26, 26, 0.9)',
  overlay: 'rgba(26, 26, 26, 0.35)',
};

const darkTheme: Theme = {
  background: '#0F1A16',
  surface: '#162420',
  surfaceVariant: '#162420',
  primary: '#10B981',
  primaryDark: '#059669',
  text: '#F1F5F3',
  textSecondary: '#B7CDC4',
  border: 'rgba(255, 255, 255, 0.08)',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  card: '#162420',
  shadow: 'rgba(0, 0, 0, 0.5)',
  modalBackground: 'rgba(0, 0, 0, 0.8)',
  overlay: 'rgba(0, 0, 0, 0.7)',
};

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const systemTheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');

  const isDark =
    themeMode === 'system' ? systemTheme === 'dark' : themeMode === 'dark';

  const theme = isDark ? darkTheme : lightTheme;

  useEffect(() => {
    loadThemePreference();
  }, []);

  useEffect(() => {
    const subscription = Appearance.addChangeListener(() => {
      // Re-render when system theme changes
    });
    return () => subscription.remove();
  }, []);

  const loadThemePreference = async () => {
    try {
      const saved = await AsyncStorage.getItem('theme_mode');
      if (saved) {
        setThemeModeState(saved as ThemeMode);
      }
    } catch (error) {
      console.error('Failed to load theme preference:', error);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem('theme_mode', mode);
      setThemeModeState(mode);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, themeMode, isDark, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
