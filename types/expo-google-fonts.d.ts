// Fallback ambient module for any @expo-google-fonts/* package to satisfy TS module resolution during linting.
declare module '@expo-google-fonts/*' {
  export function useFonts(fontMap: Record<string, unknown>): [boolean, Error | null];
  const anyExport: any;
  export default anyExport;
}

