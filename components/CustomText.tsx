import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { useFonts, Nunito_400Regular, Nunito_500Medium, Nunito_600SemiBold, Nunito_700Bold } from '@expo-google-fonts/nunito';

interface CustomTextProps extends TextProps {
  variant?: 'title' | 'subtitle' | 'body' | 'caption' | 'button';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
}

export default function CustomText({ 
  variant = 'body', 
  weight = 'normal', 
  style, 
  children, 
  ...props 
}: CustomTextProps) {
  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });
  if (!fontsLoaded) return null;
  let fontFamily = 'Nunito_400Regular';
  if (weight === 'medium') fontFamily = 'Nunito_500Medium';
  if (weight === 'semibold') fontFamily = 'Nunito_600SemiBold';
  if (weight === 'bold') fontFamily = 'Nunito_700Bold';
  return (
    <Text 
      style={[
        styles.base,
        styles[variant],
        { fontFamily },
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