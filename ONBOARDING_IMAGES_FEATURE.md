# Onboarding Images Feature

## Overview

Added animated onboarding images that fly up from the bottom of the screen when each onboarding screen is shown. The images are positioned behind the onboarding modal and animate in sequence with the modal transitions.

## Implementation Details

### Component: `OnboardingImages.tsx`

- **Location**: `punch/app/components/OnboardingImages.tsx`
- **Purpose**: Displays the 4 onboarding images with flying animations
- **Props**:
  - `currentIndex`: Current onboarding screen index (0-3)
  - `isVisible`: Whether the onboarding modal is visible

### Animation Behavior

1. **Initial State**: All images start at the bottom of the screen (off-screen)
2. **Flying Animation**: When a screen is shown, the corresponding image flies up from the bottom
3. **Positioning**: Images fly up to 30% from the top of the screen
4. **Timing**: Animation starts 300ms after the modal animation begins
5. **Transitions**: Smooth spring animations with opacity and scale effects

### Image Assets

- **Location**: `punch/assets/images/onboarding/`
- **Files**:
  - `1.png` - First onboarding screen
  - `2.png` - Second onboarding screen
  - `3.png` - Third onboarding screen
  - `4.png` - Fourth onboarding screen

### Integration

- **Added to**: `punch/app/unauthenticated_tabs/onboarding.tsx`
- **Position**: Behind the onboarding modal (zIndex: 1)
- **Timing**: Synchronized with modal visibility and screen transitions

## Technical Features

- **Responsive**: Images scale to 70% of screen width
- **Performance**: Uses React Native's native driver for smooth animations
- **Memory Efficient**: Only one image is animated at a time
- **Smooth Transitions**: Spring animations with proper easing

## Usage

The component automatically handles:

- Image loading and display
- Animation timing and sequencing
- Screen transitions
- Modal visibility synchronization

No additional configuration is required - the component works automatically with the existing onboarding flow.
