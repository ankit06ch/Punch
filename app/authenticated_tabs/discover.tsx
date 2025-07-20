import { useEffect, useState } from 'react';
import { View, Text, ScrollView, FlatList } from 'react-native';
import discoverStyles from '../styles/discoverStyles';

export default function Discover() {
  const [promotions, setPromotions] = useState([
    { business: 'Cafe Delight', promo: 'Free Drink with Meal' },
    { business: 'Sushi Place', promo: '10% Off Rolls' },
    { business: 'Pizza Hub', promo: 'Buy 1 Get 1 Free' },
    { business: 'Pizza Hub', promo: 'Buy 1 Get 1 Free' },
    { business: 'Pizza Hub', promo: 'Buy 1 Get 1 Free' },
  ]);

  const [restaurants, setRestaurants] = useState([
    { name: 'Burger Hub', distance: '0.5 mi', hours: '9AM - 10PM', price: '$$' },
    { name: 'Sushi Town', distance: '0.8 mi', hours: '11AM - 11PM', price: '$$$' },
    { name: 'Taco Spot', distance: '1.2 mi', hours: '10AM - 9PM', price: '$' },
    { name: 'Taco Spot', distance: '1.2 mi', hours: '10AM - 9PM', price: '$' },
    { name: 'Taco Spot', distance: '1.2 mi', hours: '10AM - 9PM', price: '$' },
    { name: 'Taco Spot', distance: '1.2 mi', hours: '10AM - 9PM', price: '$' },
  ]);

  return (
    <ScrollView style={discoverStyles.container}>
      <Text style={discoverStyles.sectionTitle}>Promotions</Text>
      <FlatList
        horizontal
        data={promotions}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={discoverStyles.horizontalList}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={discoverStyles.promoCard}>
            <Text style={discoverStyles.cardTitle}>{item.business}</Text>
            <Text style={discoverStyles.cardText}>{item.promo}</Text>
          </View>
        )}
      />

      <Text style={discoverStyles.sectionTitle}>Restaurants Near Me</Text>
      {restaurants.map((restaurant, idx) => (
        <View key={idx} style={discoverStyles.restaurantCard}>
          <Text style={discoverStyles.cardTitle}>{restaurant.name}</Text>
          <Text style={discoverStyles.cardText}>
            {restaurant.distance} • {restaurant.hours} • {restaurant.price}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}