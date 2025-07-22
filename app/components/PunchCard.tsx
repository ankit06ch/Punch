import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, Animated, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
    <TouchableOpacity activeOpacity={onPress ? 0.85 : 1} onPress={onPress} style={[styles.cardContainer, { borderColor: color, shadowColor: color }, style as any]}> 
      {/* Large semi-transparent punch icon in background */}
      <Ionicons name="pricetag" size={100} color={color + '33'} style={styles.bgIcon} />
      <View style={[styles.cardAccent, { backgroundColor: color }]} />
      {/* Badge icon in top-right */}
      <View style={styles.badgeIconWrap}>
        <Ionicons name="star" size={22} color={color} style={{ backgroundColor: '#fff', borderRadius: 14, padding: 2, elevation: 2 }} />
      </View>
      {logo && <Image source={logo} style={styles.logo} />}
      <Text style={styles.businessName}>{businessName}</Text>
      {/* Punch count badge below the business name and above the punch row */}
      <View style={[styles.punchCountBadge, { backgroundColor: color, alignSelf: 'flex-start', marginBottom: 8, marginTop: 4 }]}> 
        <Text style={[styles.punchCountText, { fontSize: 16 }]}>{punches} / {total} punches</Text>
      </View>
      <View style={styles.punchRow}>
        {punchArray.map((_, index) => {
          const isFilled = index < punches;
          return (
            <Ionicons
              key={index}
              name={isFilled ? 'ellipse' : 'ellipse-outline'}
              size={18}
              color={isFilled ? color : '#ddd'}
              style={{ marginRight: 6, marginBottom: 2 }}
            />
          );
        })}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: 280,
    height: 150,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 0,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
    borderWidth: 2.5,
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
  bgIcon: {
    position: 'absolute',
    right: -30,
    top: 10,
    zIndex: 0,
  },
  badgeIconWrap: {
    position: 'absolute',
    top: 12,
    right: 18,
    zIndex: 3,
    backgroundColor: 'transparent',
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
  punchCountBadge: {
    position: 'relative',
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 16,
    zIndex: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  punchCountText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 