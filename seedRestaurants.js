const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin SDK using ADC and explicit projectId
initializeApp({
  projectId: 'punch-c1409',
  storageBucket: 'punch-c1409.appspot.com'
});

const db = getFirestore();
const storage = getStorage();
const bucket = storage.bucket();

// Cumming, GA coordinates (approximate center)
const CUMMING_CENTER = {
  latitude: 34.2073,
  longitude: -84.1402
};

// Helper function to calculate distance between two points
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

// Helper function to download and upload image to Firebase Storage
async function uploadImageToStorage(imageUrl, restaurantName) {
  try {
    // Download the image
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data);
    
    // Create a safe filename
    const safeName = restaurantName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const fileName = `restaurant-logos/${safeName}_logo.png`;
    
    // Upload to Firebase Storage
    const file = bucket.file(fileName);
    await file.save(buffer, {
      metadata: {
        contentType: 'image/png',
      }
    });
    
    // Make the file publicly accessible
    await file.makePublic();
    
    // Return the public URL
    return `https://storage.googleapis.com/${bucket.name}/${fileName}`;
  } catch (error) {
    console.error(`Error uploading image for ${restaurantName}:`, error.message);
    // Return a placeholder if upload fails
    return `https://placehold.co/64x64?text=${restaurantName.charAt(0)}`;
  }
}

const cummingRestaurants = [
  {
    name: "Alessio's Restaurant & Pizzeria",
    cuisine: "Italian, New York-style Pizza",
    location: "3775 Windermere Parkway, Cumming, GA 30041",
    hours: {
      "Mon-Thu": "11:30 AM – 9:30 PM",
      "Fri-Sat": "11:30 AM – 10:00 PM",
      "Sun": "12:00 PM – 9:00 PM"
    },
    activeRewards: [
      {
        title: "Free Appetizer",
        description: "Choice of garlic knots or mozzarella sticks",
        punchesRequired: 5
      }
    ],
    logoUrl: "https://static.spotapps.co/web/alessiosrestaurant–com/custom/logo_v2.png",
    latitude: 34.2073,
    longitude: -84.1402,
    price: "$$",
    total: 10
  },
  {
    name: "Village Italian",
    cuisine: "Italian",
    location: "5772 N Vickery St, Cumming, GA 30040",
    hours: {
      "Mon-Thu": "11:00 AM – 9:00 PM",
      "Fri": "11:00 AM – 10:00 PM",
      "Sat": "10:00 AM – 10:00 PM",
      "Sun": "10:00 AM – 9:00 PM"
    },
    activeRewards: [
      {
        title: "Birthday Discount",
        description: "10% off your meal during your birthday month",
        punchesRequired: 1
      }
    ],
    logoUrl: "https://images.getbento.com/accounts/0b96449058d495424ae7a8a707fade02/media/images/73901Village_Italian_.png?w=600&fit=max&auto=compress,format&cs=origin&h=600",
    latitude: 34.2156,
    longitude: -84.1389,
    price: "$$",
    total: 8
  },
  {
    name: "Tam's Backstage",
    cuisine: "American, Southern",
    location: "215 Ingram Ave, Cumming, GA 30040",
    hours: {
      "Mon-Thu": "11:00 AM – 9:00 PM",
      "Fri": "11:00 AM – 9:30 PM",
      "Sat": "4:00 PM – 9:30 PM",
      "Sun": "Closed"
    },
    activeRewards: [
      {
        title: "Free Dessert",
        description: "Cheesecake or ice cream",
        punchesRequired: 10
      }
    ],
    logoUrl: "https://tamsbackstage.com/wp-content/uploads/2024/03/BannerLogo-TamsBackStageNEW.png",
    latitude: 34.2034,
    longitude: -84.1421,
    price: "$$",
    total: 12
  },
  {
    name: "Branchwater",
    cuisine: "Steakhouse, American",
    location: "5820 S Vickery, Cumming, GA 30040",
    hours: {
      "Mon-Thu": "4:00 PM – 9:00 PM",
      "Fri-Sat": "4:00 PM – 10:00 PM",
      "Sun": "4:00 PM – 9:00 PM"
    },
    activeRewards: [
      {
        title: "Free Appetizer",
        description: "Choice of calamari or bruschetta",
        punchesRequired: 5
      }
    ],
    logoUrl: "https://popmenucloud.com/cdn-cgi/image/width=300,height=300,format=auto,fit=pad,background=transparent/umqfyitx/36ac8a50-9f7f-4c68-a8ed-36bffd6ea121",
    latitude: 34.1987,
    longitude: -84.1356,
    price: "$$$",
    total: 10
  },
  {
    name: "Marlow's Tavern",
    cuisine: "American",
    location: "410 Peachtree Parkway, Cumming, GA 30041",
    hours: {
      "Mon-Thu": "11:00 AM – 9:00 PM",
      "Fri-Sat": "11:00 AM – 10:00 PM",
      "Sun": "11:00 AM – 9:00 PM"
    },
    activeRewards: [
      {
        title: "Free Appetizer",
        description: "Choice of onion rings or mozzarella sticks",
        punchesRequired: 7
      }
    ],
    logoUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT0KMPqn1eRbGH6op3TXtgcUU_U7mmplIwA3Q&s",
    latitude: 34.2123,
    longitude: -84.1456,
    price: "$$",
    total: 10
  },
  {
    name: "Rreal Tacos",
    cuisine: "Mexican",
    location: "410 Peachtree Parkway, Cumming, GA 30041",
    hours: {
      "Mon-Thu": "11:00 AM – 9:00 PM",
      "Fri-Sat": "11:00 AM – 10:00 PM",
      "Sun": "Closed"
    },
    activeRewards: [
      {
        title: "Free Taco",
        description: "Choice of carne asada or al pastor",
        punchesRequired: 3
      }
    ],
    logoUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTtueKQOKspGpIDt4hWX6jmlWOqT7Wi2z47Cw&s",
    latitude: 34.2123,
    longitude: -84.1456,
    price: "$",
    total: 6
  },
  {
    name: "IHOP",
    cuisine: "American, Breakfast",
    location: "920 Market Place Blvd, Cumming, GA 30041",
    hours: {
      "Mon-Thu": "7:00 AM – 10:00 PM",
      "Fri-Sat": "7:00 AM – 12:00 AM",
      "Sun": "7:00 AM – 10:00 PM"
    },
    activeRewards: [
      {
        title: "Free Short Stack",
        description: "On your birthday",
        punchesRequired: 1
      }
    ],
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/IHOP_logo.svg/1200px-IHOP_logo.svg.png",
    latitude: 34.2089,
    longitude: -84.1489,
    price: "$",
    total: 8
  },
  {
    name: "KFC",
    cuisine: "Fast Food, Fried Chicken",
    location: "695 Atlanta Rd, Cumming, GA 30040",
    hours: {
      "Mon-Thu": "10:00 AM – 10:30 PM",
      "Fri-Sat": "10:00 AM – 11:00 PM",
      "Sun": "10:00 AM – 10:30 PM"
    },
    activeRewards: [
      {
        title: "Free Side",
        description: "Choice of mashed potatoes or coleslaw",
        punchesRequired: 5
      }
    ],
    logoUrl: "https://upload.wikimedia.org/wikipedia/sco/thumb/b/bf/KFC_logo.svg/2048px-KFC_logo.svg.png",
    latitude: 34.2012,
    longitude: -84.1523,
    price: "$",
    total: 8
  },
  {
    name: "Krystal",
    cuisine: "Fast Food, Burgers",
    location: "560 Atlanta Rd, Cumming, GA 30040",
    hours: {
      "Mon-Sun": "6:00 AM – 11:00 PM"
    },
    activeRewards: [
      {
        title: "Free Sandwich",
        description: "Choice of classic or spicy chicken",
        punchesRequired: 10
      }
    ],
    logoUrl: "https://static.wikia.nocookie.net/logopedia/images/9/9e/Krystal_-_1982r.svg/revision/latest/scale-to-width-down/300?cb=20240423042915",
    latitude: 34.2012,
    longitude: -84.1523,
    price: "$",
    total: 12
  }
];

async function seed() {
  console.log('Starting restaurant seeding process...');
  
  // Clear existing restaurants
  console.log('Clearing existing restaurants...');
  const existingRestaurants = await db.collection('restaurants').get();
  const deletePromises = existingRestaurants.docs.map(doc => doc.ref.delete());
  await Promise.all(deletePromises);
  console.log('Cleared existing restaurants');
  
  // Add new restaurants
  for (const restaurant of cummingRestaurants) {
    try {
      // Calculate distance from Cumming center
      const distance = calculateDistance(
        CUMMING_CENTER.latitude, 
        CUMMING_CENTER.longitude, 
        restaurant.latitude, 
        restaurant.longitude
      );
      
      // Generate random rating between 3.5 and 5.0
      const rating = Math.round((Math.random() * 1.5 + 3.5) * 10) / 10;
      
      // Upload logo to Firebase Storage
      console.log(`Uploading logo for ${restaurant.name}...`);
      const storageLogoUrl = await uploadImageToStorage(restaurant.logoUrl, restaurant.name);
      
      // Prepare restaurant data
      const restaurantData = {
        name: restaurant.name,
        businessName: restaurant.name, // For compatibility
        cuisine: restaurant.cuisine,
        location: restaurant.location,
        hours: restaurant.hours,
        activeRewards: restaurant.activeRewards,
        logoUrl: storageLogoUrl,
        latitude: restaurant.latitude,
        longitude: restaurant.longitude,
        distance: `${distance} mi`,
        price: restaurant.price,
        rating: rating,
        total: restaurant.total,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Add to Firestore
      await db.collection('restaurants').add(restaurantData);
      console.log(`✅ Added: ${restaurant.name} (${distance} mi away, ${rating} stars)`);
      
    } catch (error) {
      console.error(`❌ Error adding ${restaurant.name}:`, error.message);
    }
  }
  
  console.log('🎉 Restaurant seeding complete!');
  process.exit();
}

seed(); 