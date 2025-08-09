// Minimal ambient module for @expo-google-fonts/figtree to satisfy TypeScript in editors/linting.
declare module '@expo-google-fonts/figtree' {
  export const Figtree_300Light: any;
  export const Figtree_400Regular: any;
  export const Figtree_500Medium: any;
  export const Figtree_600SemiBold: any;
  export const Figtree_700Bold: any;
  export const Figtree_800ExtraBold: any;
  export const Figtree_900Black: any;

  export function useFonts(
    fontMap: Record<string, unknown>
  ): [boolean, Error | null];
}

