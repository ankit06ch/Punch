import React, { useEffect, useRef, useState } from 'react';
import { View, Image, Dimensions, Animated, Easing } from 'react-native';

const { width, height } = Dimensions.get('window');

interface OnboardingImagesProps {
  currentIndex: number;
  isVisible: boolean;
}

const OnboardingImages: React.FC<OnboardingImagesProps> = ({ currentIndex, isVisible }) => {
  // Use the first image from the onboarding1 folder
  const mainImage = require('../../assets/images/onboarding/onboarding1/1.png');
  // Use image4 from the onboarding1 folder
  const topImage = require('../../assets/images/onboarding/onboarding1/4.png');
  // Use images 5 and 6 from the onboarding1 folder
  const leftImage = require('../../assets/images/onboarding/onboarding1/5.png');
  const rightImage = require('../../assets/images/onboarding/onboarding1/6.png');
  // Use images 2 and 3 from the onboarding1 folder
  const bottomLeftImage = require('../../assets/images/onboarding/onboarding1/2.png');
  const bottomRightImage = require('../../assets/images/onboarding/onboarding1/3.png');
  // Use images 7, 8, and 9 from the onboarding2 folder
  const image7 = require('../../assets/images/onboarding/onboarding2/7.png');
  const image8 = require('../../assets/images/onboarding/onboarding2/8.png');
  const image9 = require('../../assets/images/onboarding/onboarding2/9.png');
  const image10 = require('../../assets/images/onboarding/onboarding2/10.png');
  // Use images 15, 16, and 17 from the onboarding4 folder
  const image15 = require('../../assets/images/onboarding/onboarding4/15.png');
  const image16 = require('../../assets/images/onboarding/onboarding4/16.png');
  const image17 = require('../../assets/images/onboarding/onboarding4/17.png');
  
  // Use images from onboarding3 folder for the third page
  const image11 = require('../../assets/images/onboarding/onboarding3/11.png');
  const image12 = require('../../assets/images/onboarding/onboarding3/12.png');
  const image13 = require('../../assets/images/onboarding/onboarding3/13.png');
  const image14 = require('../../assets/images/onboarding/onboarding3/14.png');

  // Fade transition animation for smooth page changes
  const fadeAnim = useRef(new Animated.Value(1)).current;
  
  // State to track when images are properly loaded and sized
  const [imagesLoaded, setImagesLoaded] = useState(false);
  
  // Pre-calculate all image dimensions to prevent size jumping
  const imageDimensions = {
    main: { width: width * 0.95, height: height * 0.75 },
    top: { width: width * 0.45, height: height * 0.3 },
    left: { width: width * 0.35, height: height * 0.23 },
    right: { width: width * 0.35, height: height * 0.23 },
    bottomLeft: { width: width * 0.3, height: height * 0.2 },
    bottomRight: { width: width * 0.3, height: height * 0.2 },
    image7: { width: width, height: height * 0.7 },
    image8: { width: width * 0.45, height: height * 0.23 },
    image9: { width: width * 0.4, height: height * 0.25 },
    image10: { width: width * 1.2, height: height * 0.6 },
    image11: { width: width * 0.95, height: height * 0.6 },
    image12: { width: width * 0.35, height: height * 0.25 },
    image13: { width: width * 0.5, height: height * 0.35 },
    image14: { width: width * 0.35, height: height * 0.25 },
    image15: { width: width * 0.4, height: height * 0.25 },
    image16: { width: width * 0.4, height: height * 0.25 },
    image17: { width: width * 0.4, height: height * 0.25 },
  };

  // Floating animation values for images 2-17
  const floatingAnim2 = useRef(new Animated.Value(0)).current;
  const floatingAnim3 = useRef(new Animated.Value(0)).current;
  const floatingAnim4 = useRef(new Animated.Value(0)).current;
  const floatingAnim5 = useRef(new Animated.Value(0)).current;
  const floatingAnim6 = useRef(new Animated.Value(0)).current;
  const floatingAnim7 = useRef(new Animated.Value(0)).current;
  const floatingAnim8 = useRef(new Animated.Value(0)).current;
  const floatingAnim9 = useRef(new Animated.Value(0)).current;
  const floatingAnim10 = useRef(new Animated.Value(0)).current;
  const floatingAnim11 = useRef(new Animated.Value(0)).current;
  const floatingAnim12 = useRef(new Animated.Value(0)).current;
  const floatingAnim13 = useRef(new Animated.Value(0)).current;
  const floatingAnim14 = useRef(new Animated.Value(0)).current;
  const floatingAnim15 = useRef(new Animated.Value(0)).current;
  const floatingAnim16 = useRef(new Animated.Value(0)).current;
  const floatingAnim17 = useRef(new Animated.Value(0)).current;

  // Set images as loaded when component mounts with a small delay to ensure proper sizing
  useEffect(() => {
    const timer = setTimeout(() => {
      setImagesLoaded(true);
    }, 50); // Small delay to ensure dimensions are calculated
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Create floating animations for images 2-9
    const createFloatingAnimation = (animValue: Animated.Value, delay: number = 0) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
            delay,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    // Start floating animations with different delays for variety
    createFloatingAnimation(floatingAnim2, 0);
    createFloatingAnimation(floatingAnim3, 400);
    createFloatingAnimation(floatingAnim4, 800);
    createFloatingAnimation(floatingAnim5, 1200);
    createFloatingAnimation(floatingAnim6, 1600);
    createFloatingAnimation(floatingAnim7, 2000);
    createFloatingAnimation(floatingAnim8, 2400);
    createFloatingAnimation(floatingAnim9, 2800);
    createFloatingAnimation(floatingAnim10, 3200);
    createFloatingAnimation(floatingAnim11, 3600);
    createFloatingAnimation(floatingAnim12, 4000);
    createFloatingAnimation(floatingAnim13, 4400);
    createFloatingAnimation(floatingAnim14, 4800);
    createFloatingAnimation(floatingAnim15, 5200);
    createFloatingAnimation(floatingAnim16, 5600);
    createFloatingAnimation(floatingAnim17, 6000);
  }, []);

  // Fade transition when currentIndex changes
  useEffect(() => {
    // Quick fade out to prevent image flash
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 50,
      useNativeDriver: true,
      easing: Easing.out(Easing.quad),
    }).start(() => {
      // Small delay to ensure scroll transition is complete
      setTimeout(() => {
        // Smooth fade back in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
          easing: Easing.in(Easing.quad),
        }).start();
      }, 100);
    });
  }, [currentIndex]);

  // Restart floating animations when showImages becomes true
  useEffect(() => {
    if (isVisible) {
      // Restart all floating animations
      const createFloatingAnimation = (animValue: Animated.Value, delay: number = 0) => {
        // Stop any existing animation first
        animValue.stopAnimation();
        
        Animated.loop(
          Animated.sequence([
            Animated.timing(animValue, {
              toValue: 1,
              duration: 2000,
              useNativeDriver: true,
              delay,
            }),
            Animated.timing(animValue, {
              toValue: 0,
              duration: 2000,
              useNativeDriver: true,
            }),
          ])
        ).start();
      };

      // Restart all animations
      createFloatingAnimation(floatingAnim2, 0);
      createFloatingAnimation(floatingAnim3, 400);
      createFloatingAnimation(floatingAnim4, 800);
      createFloatingAnimation(floatingAnim5, 1200);
      createFloatingAnimation(floatingAnim6, 1600);
      createFloatingAnimation(floatingAnim7, 2000);
      createFloatingAnimation(floatingAnim8, 2400);
      createFloatingAnimation(floatingAnim9, 2800);
      createFloatingAnimation(floatingAnim10, 3200);
      createFloatingAnimation(floatingAnim11, 3600);
      createFloatingAnimation(floatingAnim12, 4000);
      createFloatingAnimation(floatingAnim13, 4400);
      createFloatingAnimation(floatingAnim14, 4800);
      createFloatingAnimation(floatingAnim15, 5200);
      createFloatingAnimation(floatingAnim16, 5600);
      createFloatingAnimation(floatingAnim17, 6000);
    }
  }, [isVisible, currentIndex]); // Added currentIndex dependency

  // Restart animations when currentIndex changes to ensure smooth transitions
  useEffect(() => {
    if (isVisible) {
      // Small delay to ensure smooth transition
      const timer = setTimeout(() => {
        // Restart all floating animations for the new screen
        const createFloatingAnimation = (animValue: Animated.Value, delay: number = 0) => {
          animValue.stopAnimation();
          
          Animated.loop(
            Animated.sequence([
              Animated.timing(animValue, {
                toValue: 1,
                duration: 2000,
                useNativeDriver: true,
                delay,
              }),
              Animated.timing(animValue, {
                toValue: 0,
                duration: 2000,
                useNativeDriver: true,
              }),
            ])
          ).start();
        };

        // Restart all animations
        createFloatingAnimation(floatingAnim2, 0);
        createFloatingAnimation(floatingAnim3, 400);
        createFloatingAnimation(floatingAnim4, 800);
        createFloatingAnimation(floatingAnim5, 1200);
        createFloatingAnimation(floatingAnim6, 1600);
        createFloatingAnimation(floatingAnim7, 2000);
        createFloatingAnimation(floatingAnim8, 2400);
        createFloatingAnimation(floatingAnim9, 2800);
        createFloatingAnimation(floatingAnim10, 3200);
        createFloatingAnimation(floatingAnim11, 3600);
        createFloatingAnimation(floatingAnim12, 4000);
        createFloatingAnimation(floatingAnim13, 4400);
        createFloatingAnimation(floatingAnim14, 4800);
        createFloatingAnimation(floatingAnim15, 5200);
        createFloatingAnimation(floatingAnim16, 5600);
        createFloatingAnimation(floatingAnim17, 6000);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [currentIndex]);

  // Don't render until images are properly loaded and sized
  if (!imagesLoaded) {
    return null;
  }

  // Render different images based on currentIndex
  if (currentIndex === 0) {
    // First slide: Show images 1-6
    return (
      <Animated.View style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 1,
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: -(height * 0.3), // Main image position
        opacity: fadeAnim,
      }}>
        {/* Main image */}
        <Image 
          source={mainImage} 
          style={{ 
            width: imageDimensions.main.width, 
            height: imageDimensions.main.height, 
            resizeMode: 'contain' 
          }} 
        />

        {/* Top image (image4) */}
        <Animated.View style={{
          position: 'absolute', top: height * 0.02, left: width * 0.025, right: width * 0.025, alignItems: 'center',
          transform: [{ translateY: floatingAnim4.interpolate({ inputRange: [0, 1], outputRange: [0, -15] }) }]
        }}>
          <Image 
            source={topImage} 
            style={{ 
              width: imageDimensions.top.width, 
              height: imageDimensions.top.height, 
              resizeMode: 'contain', 
              shadowColor: '#000', 
              shadowOffset: { width: 2, height: 4 }, 
              shadowOpacity: 0.3, 
              shadowRadius: 8 
            }} 
          />
        </Animated.View>

        {/* Left image (image5) */}
        <Animated.View style={{
          position: 'absolute', top: height * 0.12, left: width * 0.05, alignItems: 'center',
          transform: [{ rotate: '-30deg' }, { translateY: floatingAnim5.interpolate({ inputRange: [0, 1], outputRange: [0, -15] }) }]
        }}>
          <Image 
            source={leftImage} 
            style={{ 
              width: imageDimensions.left.width, 
              height: imageDimensions.left.height, 
              resizeMode: 'contain', 
              shadowColor: '#000', 
              shadowOffset: { width: 2, height: 4 }, 
              shadowOpacity: 0.3, 
              shadowRadius: 8 
            }} 
          />
        </Animated.View>

        {/* Right image (image6) */}
        <Animated.View style={{
          position: 'absolute', top: height * 0.12, right: width * 0.05, alignItems: 'center',
          transform: [{ rotate: '30deg' }, { translateY: floatingAnim6.interpolate({ inputRange: [0, 1], outputRange: [0, -15] }) }]
        }}>
          <Image 
            source={rightImage} 
            style={{ 
              width: imageDimensions.right.width, 
              height: imageDimensions.right.height, 
              resizeMode: 'contain', 
              shadowColor: '#000', 
              shadowOffset: { width: 2, height: 4 }, 
              shadowOpacity: 0.3, 
              shadowRadius: 8 
            }} 
          />
        </Animated.View>

        {/* Bottom left image (image2) positioned near bottom left of main image */}
        <Animated.View style={{
          position: 'absolute',
          top: height * 0.35, // Move up from 0.4 to 0.35
          left: width * 0.12, // Move left from 0.08 to 0.12
          alignItems: 'center',
          transform: [{
            translateY: floatingAnim2.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -15], // Float up and down by 15 pixels
            })
          }]
        }}>
          <Image
            source={bottomLeftImage}
            style={{
              width: imageDimensions.bottomLeft.width,
              height: imageDimensions.bottomLeft.height,
              resizeMode: 'contain',
              shadowColor: '#000',
              shadowOffset: { width: 2, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
            }}
          />
        </Animated.View>

        {/* Bottom right image (image3) positioned near bottom right of main image */}
        <Animated.View style={{
          position: 'absolute',
          top: height * 0.4, // Move up higher so it's visible
          right: width * 0.08, // Near right but not exact corner
          alignItems: 'center',
          transform: [{
            translateY: floatingAnim3.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -15], // Float up and down by 15 pixels
            })
          }]
        }}>
          <Image
            source={bottomRightImage}
            style={{
              width: imageDimensions.bottomRight.width,
              height: imageDimensions.bottomRight.height,
              resizeMode: 'contain',
              shadowColor: '#000',
              shadowOffset: { width: 2, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
            }}
          />
        </Animated.View>
      </Animated.View>
    );
  } else if (currentIndex === 1) {
    // Second slide: Show images 7, 8, 9
    return (
      <View style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 1,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* Image 10 - positioned higher up, spans full width, and is very big in the back */}
        <Animated.View style={{
          position: 'absolute',
          top: height * 0.05, // Much higher up
          left: 0, right: 0, // Span full width
          alignItems: 'center',
          zIndex: 0, // Very back - behind everything
          transform: [{
            translateY: floatingAnim10.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -10], // Float up and down by 10 pixels
            })
          }]
        }}>
          <Image
            source={image10}
            style={{
              width: width * 1.2, // 120% of screen width - even bigger
              height: height * 0.6, // Proportionally sized
              resizeMode: 'contain',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
            }}
          />
        </Animated.View>

        {/* Image 7 - positioned as main centered image like image 1 */}
        <Animated.View style={{
          position: 'absolute',
          top: -(height * 0.05), // Slightly lower than before
          left: 0, right: 0,
          alignItems: 'center',
          zIndex: 2, // Above image 10
        }}>
          <Image
            source={image7}
            style={{
              width: width, // 100% of screen width - spans full phone width
              height: height * 0.7, // Proportionally sized
              resizeMode: 'contain',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
            }}
          />
        </Animated.View>

        {/* Image 8 - positioned in upper left area */}
        <Animated.View style={{
          position: 'absolute',
          top: height * 0.08, // Much higher up to avoid overlap
          left: width * 0.15, // Moved slightly to the right
          alignItems: 'center',
          zIndex: 3, // Above image 10 and image 7
          transform: [{
            translateY: floatingAnim8.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -12], // Float up and down by 12 pixels
            })
          }]
        }}>
          <Image
            source={image8}
            style={{
              width: width * 0.45, // 45% of screen width - bigger
              height: height * 0.23, // Proportionally sized
              resizeMode: 'contain',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
            }}
          />
        </Animated.View>

        {/* Image 9 - positioned at bottom right corner of image 8 */}
        <Animated.View style={{
          position: 'absolute',
          top: height * 0.18, // Moved slightly lower
          left: width * 0.48, // Slightly more to the right
          alignItems: 'center',
          zIndex: 3, // Above image 10 and image 7
          transform: [{
            translateY: floatingAnim9.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -12], // Float up and down by 12 pixels
            })
          }]
        }}>
          <Image
            source={image9}
            style={{
              width: width * 0.35, // 35% of screen width
              height: height * 0.23, // Proportionally sized
              resizeMode: 'contain',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
            }}
          />
        </Animated.View>
      </View>
    );
  } else if (currentIndex === 2) {
    // Third slide: Show all onboarding3 images
    return (
      <View style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 1,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* Image 11 - Large edge-to-edge background (no animation) */}
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1,
          height: height * 0.4,
          overflow: 'visible',
        }}>
          <Image
            source={image11}
            style={{
              width: '100%',
              height: '100%',
              resizeMode: 'cover',
            }}
          />
        </View>

        {/* Image 12 - Top of vertical stack (same size as 14) */}
        <Animated.View style={{
          position: 'absolute',
          top: height * 0.02,
          left: 0, right: 0,
          alignItems: 'center',
          zIndex: 3,
          transform: [{
            translateY: floatingAnim12.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -15],
            })
          }]
        }}>
          <Image
            source={image12}
            style={{
              width: width * 0.714, // 0.595 * 1.2 = 0.714 (50% bigger total)
              height: height * 0.3174, // 0.2645 * 1.2 = 0.3174 (50% bigger total)
              resizeMode: 'contain',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
            }}
          />
        </Animated.View>

        {/* Image 13 - Middle of vertical stack (bigger size) */}
        <Animated.View style={{
          position: 'absolute',
          top: height * 0.07,
          left: 0, right: 0,
          alignItems: 'center',
          zIndex: 3,
          transform: [{
            translateY: floatingAnim13.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -20],
            })
          }]
        }}>
          <Image
            source={image13}
            style={{
              width: width * 0.936, // 0.78 * 1.2 = 0.936 (50% bigger total)
              height: height * 0.4761, // 0.39675 * 1.2 = 0.4761 (50% bigger total)
              resizeMode: 'contain',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
            }}
          />
        </Animated.View>

        {/* Image 14 - Bottom of vertical stack (same size as 12) */}
        <Animated.View style={{
          position: 'absolute',
          top: height * 0.28,
          left: 0, right: 0,
          alignItems: 'center',
          zIndex: 3,
          transform: [{
            translateY: floatingAnim14.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -15],
            })
          }]
        }}>
          <Image
            source={image14}
            style={{
              width: width * 0.714, // 0.595 * 1.2 = 0.714 (50% bigger total)
              height: height * 0.3174, // 0.2645 * 1.2 = 0.3174 (50% bigger total)
              resizeMode: 'contain',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
            }}
          />
        </Animated.View>
      </View>
    );
  } else if (currentIndex === 3) {
    // Fourth slide: Show images 15, 16, 17
    return (
      <View style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 1,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* Image 15 - positioned as main centered image */}
        <Animated.View style={{
          position: 'absolute',
          top: height * 0.05, // Much higher up
          left: 0, right: 0, // Span full width
          alignItems: 'center',
          zIndex: 2, // Above background
        }}>
          <Image
            source={image15}
            style={{
              width: width, // 100% of screen width - spans from left edge to right edge
              height: height * 0.7, // Proportionally sized
              resizeMode: 'contain',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
            }}
          />
        </Animated.View>

        {/* Image 16 - positioned in upper left area */}
        <Animated.View style={{
          position: 'absolute',
          top: height * 0.08, // Higher up
          left: width * 0.15, // Left side
          alignItems: 'center',
          zIndex: 3, // Above image 15
          transform: [{
            translateY: floatingAnim16.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -12], // Float up and down by 12 pixels
            })
          }]
        }}>
          <Image
            source={image16}
            style={{
              width: width * 0.5, // 50% of screen width - bigger
              height: height * 0.33, // Proportionally sized
              resizeMode: 'contain',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
            }}
          />
        </Animated.View>

        {/* Image 17 - positioned in upper right area */}
        <Animated.View style={{
          position: 'absolute',
          top: height * 0.25, // Further down than before
          right: width * 0.15, // Right side
          alignItems: 'center',
          zIndex: 3, // Above image 15
          transform: [{
            translateY: floatingAnim17.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -12], // Float up and down by 12 pixels
            })
          }]
        }}>
          <Image
            source={image17}
            style={{
              width: width * 0.5, // 50% of screen width - bigger
              height: height * 0.33, // Proportionally sized
              resizeMode: 'contain',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
            }}
          />
        </Animated.View>
      </View>
    );
  }

  // For other slides (index 4+), show no images
  return null;
};

export default OnboardingImages; 