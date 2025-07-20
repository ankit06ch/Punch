import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  Dimensions,
  Animated,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import styles from '../styles/walletStyles';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.8;
const CARD_SPACING = width * 0.1;

const punchCardsData = [
  { id: '1', businessName: 'Coffee Shop', punches: 4, total: 10 },
  { id: '2', businessName: 'Bakery', punches: 7, total: 12 },
  { id: '3', businessName: 'Bookstore', punches: 3, total: 8 },
];

export default function Wallet() {
  const [cards, setCards] = useState(punchCardsData);

  const handlePunchToggle = (cardId: string, punchIndex: number) => {
    setCards((prevCards) =>
      prevCards.map((card) => {
        if (card.id === cardId) {
          let newPunches = card.punches;
          if (punchIndex < card.punches) {
            // If tapped on an already punched one, decrease punches
            newPunches = punchIndex;
          } else {
            // If tapped on next or further, increase punches up to total
            newPunches = punchIndex + 1 > card.total ? card.total : punchIndex + 1;
          }
          return { ...card, punches: newPunches };
        }
        return card;
      })
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Punch Cards</Text>
      <FlatList
        data={cards}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + CARD_SPACING / 2}
        decelerationRate="fast"
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: CARD_SPACING / 2 }}
        renderItem={({ item }) => (
          <PunchCard
            businessName={item.businessName}
            punches={item.punches}
            total={item.total}
            onPunchToggle={(index) => handlePunchToggle(item.id, index)}
          />
        )}
      />
      <View style={styles.addPassContainer}>
        <Text style={{ color: '#aaa', fontSize: 16 }}>Add to Apple Wallet coming soon</Text>
      </View>
    </View>
  );
}

function PunchCard({
  businessName,
  punches,
  total,
  onPunchToggle,
}: {
  businessName: string;
  punches: number;
  total: number;
  onPunchToggle: (index: number) => void;
}) {
  const punchArray = Array.from({ length: total });
  const scaleAnimations = useRef(punchArray.map(() => new Animated.Value(0))).current;

  React.useEffect(() => {
    // Animate scale of punched circles on mount and punches change
    punchArray.forEach((_, i) => {
      Animated.timing(scaleAnimations[i], {
        toValue: i < punches ? 1 : 0,
        duration: 350,
        useNativeDriver: true,
      }).start();
    });
  }, [punches]);

  return (
    <View style={styles.cardContainer}>
      <Text style={styles.businessName}>{businessName}</Text>
      <View style={styles.punchRow}>
        {punchArray.map((_, index) => {
          const isFilled = index < punches;
          const isNext = index === punches && punches !== total;

          return (
            <TouchableOpacity
              key={index}
              onPress={() => onPunchToggle(index)}
              activeOpacity={0.8}
            >
              <Animated.View
                style={[
                  styles.punch,
                  isFilled ? styles.filledPunch : styles.emptyPunch,
                  isNext ? styles.nextPunch : null,
                  {
                    transform: [{ scale: scaleAnimations[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 1],
                    }) }],
                    shadowOpacity: isFilled ? 0.4 : 0,
                    shadowRadius: isFilled ? 6 : 0,
                    shadowOffset: { width: 0, height: 3 },
                  },
                ]}
              />
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={styles.cardSubtitle}>
        {punches} / {total} punches
      </Text>
    </View>
  );
}