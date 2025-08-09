declare module 'expo-router' {
  // Minimal type shims to satisfy TS when index.d.ts doesn't export a module
  export function useRouter(): any;
  export function useLocalSearchParams<TParams = any>(): TParams;
  export const Stack: any;
  export const Tabs: any;
  export const Slot: any;
  const _default: any;
  export default _default;
}