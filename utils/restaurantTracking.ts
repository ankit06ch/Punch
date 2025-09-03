import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, increment } from 'firebase/firestore';
import { db } from '../firebase/config';

// Restaurant like tracking function
export const trackRestaurantLike = async (restaurantId: string, userId: string, isLiking: boolean) => {
  try {
    const restaurantRef = doc(db, 'restaurants', restaurantId);
    const restaurantDoc = await getDoc(restaurantRef);
    
    if (!restaurantDoc.exists()) return;
    
    const currentData = restaurantDoc.data();
    const currentLikedByUsers = currentData.likedByUsers || [];
    
    if (isLiking) {
      // User is liking the restaurant
      if (!currentLikedByUsers.includes(userId)) {
        await updateDoc(restaurantRef, {
          totalLikes: increment(1),
          likedByUsers: arrayUnion(userId),
          firstLikeDate: currentData.firstLikeDate || new Date(),
          lastLikeDate: new Date(),
          weeklyLikes: increment(1),
          monthlyLikes: increment(1),
        });
      }
    } else {
      // User is unliking the restaurant
      if (currentLikedByUsers.includes(userId)) {
        await updateDoc(restaurantRef, {
          totalLikes: increment(-1),
          likedByUsers: arrayRemove(userId),
          lastLikeDate: new Date(),
          weeklyLikes: increment(-1),
          monthlyLikes: increment(-1),
        });
      }
    }
    
    console.log(`${isLiking ? 'Liked' : 'Unliked'} restaurant ${restaurantId} by user ${userId}`);
  } catch (error) {
    console.error('Error tracking restaurant like:', error);
  }
};

// Restaurant view tracking function
export const trackRestaurantView = async (restaurantId: string, userId: string) => {
  try {
    const restaurantRef = doc(db, 'restaurants', restaurantId);
    
    // Update total views and add user to viewed list
    await updateDoc(restaurantRef, {
      totalViews: increment(1),
      lastViewDate: new Date(),
      searchImpressions: increment(1), // Count as impression when viewed
    });
    
    console.log(`Tracked view for restaurant ${restaurantId} by user ${userId}`);
  } catch (error) {
    console.error('Error tracking restaurant view:', error);
  }
};

// Restaurant click tracking function
export const trackRestaurantClick = async (restaurantId: string) => {
  try {
    const restaurantRef = doc(db, 'restaurants', restaurantId);
    
    // Update search clicks when restaurant is clicked
    await updateDoc(restaurantRef, {
      searchClicks: increment(1),
      lastViewDate: new Date(),
    });
    
    console.log(`Tracked click for restaurant ${restaurantId}`);
  } catch (error) {
    console.error('Error tracking restaurant click:', error);
  }
};

// Restaurant modal view tracking function
export const trackRestaurantModalView = async (restaurantId: string) => {
  try {
    const restaurantRef = doc(db, 'restaurants', restaurantId);
    await updateDoc(restaurantRef, {
      totalViews: increment(1),
      lastViewDate: new Date(),
      modalViews: increment(1), // Track modal-specific views
    });
    console.log(`Tracked modal view for restaurant ${restaurantId}`);
  } catch (error) {
    console.error('Error tracking restaurant modal view:', error);
  }
};

// Restaurant wallet interaction tracking function
export const trackRestaurantWalletInteraction = async (restaurantId: string) => {
  try {
    const restaurantRef = doc(db, 'restaurants', restaurantId);
    await updateDoc(restaurantRef, {
      totalViews: increment(1),
      lastViewDate: new Date(),
      walletInteractions: increment(1), // Track wallet-specific interactions
    });
    console.log(`Tracked wallet interaction for restaurant ${restaurantId}`);
  } catch (error) {
    console.error('Error tracking restaurant wallet interaction:', error);
  }
};

// Restaurant map interaction tracking function
export const trackRestaurantMapInteraction = async (restaurantId: string) => {
  try {
    const restaurantRef = doc(db, 'restaurants', restaurantId);
    await updateDoc(restaurantRef, {
      totalViews: increment(1),
      lastViewDate: new Date(),
      mapInteractions: increment(1), // Track map-specific interactions
    });
    console.log(`Tracked map interaction for restaurant ${restaurantId}`);
  } catch (error) {
    console.error('Error tracking restaurant map interaction:', error);
  }
}; 