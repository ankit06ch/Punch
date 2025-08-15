import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { AntDesign } from '@expo/vector-icons';

interface CustomCheckboxProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
}

export default function CustomCheckbox({ value, onValueChange }: CustomCheckboxProps) {
  return (
    <TouchableOpacity
      style={[styles.checkbox, value && styles.checked]}
      onPress={() => onValueChange(!value)}
    >
      {value && (
        <AntDesign name="check" size={16} color="#FFFFFF" />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  checked: {
    backgroundColor: '#FB7A20',
    borderColor: '#FB7A20',
  },
}); 