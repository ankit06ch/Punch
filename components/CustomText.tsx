import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { useFonts, Nunito_400Regular, Nunito_500Medium, Nunito_600SemiBold, Nunito_700Bold } from '@expo-google-fonts/nunito';
import { 
  Figtree_300Light,
  Figtree_400Regular,
  Figtree_500Medium,
  Figtree_600SemiBold,
  Figtree_700Bold,
  Figtree_800ExtraBold,
  Figtree_900Black,
} from '@expo-google-fonts/figtree';

interface CustomTextProps extends TextProps {
  variant?: 'title' | 'subtitle' | 'body' | 'caption' | 'button';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  fontFamily?: 'nunito' | 'figtree';
}

export default function CustomText({ 
  variant = 'body', 
  weight = 'normal', 
  fontFamily = 'nunito',
  style, 
  children, 
  ...props 
}: CustomTextProps) {
  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Figtree_300Light,
    Figtree_400Regular,
    Figtree_500Medium,
    Figtree_600SemiBold,
    Figtree_700Bold,
    Figtree_800ExtraBold,
    Figtree_900Black,
  });
  
  if (!fontsLoaded) return null;
  
  let selectedFontFamily = 'Nunito_400Regular';
  
  if (fontFamily === 'figtree') {
    if (weight === 'medium') selectedFontFamily = 'Figtree_500Medium';
    else if (weight === 'semibold') selectedFontFamily = 'Figtree_600SemiBold';
    else if (weight === 'bold') selectedFontFamily = 'Figtree_700Bold';
    else selectedFontFamily = 'Figtree_400Regular';
  } else {
    if (weight === 'medium') selectedFontFamily = 'Nunito_500Medium';
    else if (weight === 'semibold') selectedFontFamily = 'Nunito_600SemiBold';
    else if (weight === 'bold') selectedFontFamily = 'Nunito_700Bold';
    else selectedFontFamily = 'Nunito_400Regular';
  }
  
  return (
    <Text 
      style={[
        styles.base,
        styles[variant],
        { fontFamily: selectedFontFamily },
        style,
      ]} 
      {...props}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    color: 'white',
  },
  title: {
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 18,
    lineHeight: 24,
    opacity: 0.9,
  },
  body: {
    fontSize: 16,
    lineHeight: 22,
    opacity: 0.8,
  },
  caption: {
    fontSize: 14,
    lineHeight: 18,
    opacity: 0.7,
  },
  button: {
    fontSize: 18,
    lineHeight: 22,
    letterSpacing: 0.5,
    color: '#FB7A20', // Override base color for buttons
  },
  normal: {},
  medium: {},
  semibold: {},
  bold: {},
}); 