import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, Animated, StyleSheet, ViewStyle } from 'react-native';

interface PunchCardProps {
  businessName: string;
  punches: number;
  total: number;
  color: string;
  logo?: any;
  onPress?: () => void;
  style?: ViewStyle;
}

export default function PunchCard({ businessName, punches, total, color, logo, onPress, style }: PunchCardProps) {
  const punchArray = Array.from({ length: total });
  const scaleAnimations = useRef(punchArray.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    punchArray.forEach((_, i) => {
      Animated.timing(scaleAnimations[i], {
        toValue: i < punches ? 1 : 0,
        duration: 350,
        useNativeDriver: true,
      }).start();
    });
  }, [punches]);

  return (
    <TouchableOpacity activeOpacity={onPress ? 0.85 : 1} onPress={onPress} style={[styles.cardContainer, { borderColor: color }, style as any]}> 
      <View style={[styles.cardAccent, { backgroundColor: color }]} />
      {logo && <Image source={logo} style={styles.logo} />}
      <Text style={styles.businessName}>{businessName}</Text>
      <View style={styles.punchRow}>
        {punchArray.map((_, index) => {
          const isFilled = index < punches;
          const isNext = index === punches && punches !== total;
          return (
            <Animated.View
              key={index}
              style={[
                styles.punch,
                { borderColor: color },
                isFilled ? { backgroundColor: color } : null,
                isNext ? styles.nextPunch : null,
                {
                  transform: [{ scale: scaleAnimations[index].interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 1],
                  }) }],
                  shadowColor: color,
                  shadowOpacity: isFilled ? 0.4 : 0,
                  shadowRadius: isFilled ? 6 : 0,
                  shadowOffset: { width: 0, height: 3 },
                },
              ]}
            />
          );
        })}
      </View>
      <Text style={styles.cardSubtitle}>
        {punches} / {total} punches
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: 320,
    height: 180,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    marginBottom: 0,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    borderWidth: 2,
    overflow: 'hidden',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  cardAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: 36,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    zIndex: 1,
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginBottom: 8,
    marginTop: 8,
    zIndex: 2,
  },
  businessName: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 15,
    color: '#222',
    marginTop: 44,
    zIndex: 2,
  },
  punchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 15,
    zIndex: 2,
  },
  punch: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  nextPunch: {
    borderColor: '#ffa94d',
    borderWidth: 3,
  },
  cardSubtitle: {
    fontSize: 16,
    color: '#555',
    fontWeight: '600',
    zIndex: 2,
  },
}); 