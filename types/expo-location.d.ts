// Minimal ambient types to satisfy the linter/TS resolution when running from the repo root.
// The actual package provides full types; this just covers what the app uses.
declare module 'expo-location' {
  export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

  export interface PermissionResponse {
    status: PermissionStatus;
    granted: boolean;
    canAskAgain: boolean;
    expires: 'never' | number;
  }

  export interface LocationObjectCoords {
    latitude: number;
    longitude: number;
    altitude?: number | null;
    accuracy?: number | null;
    heading?: number | null;
    speed?: number | null;
  }

  export interface LocationObject {
    coords: LocationObjectCoords;
    timestamp?: number;
  }

  export enum Accuracy {
    Lowest = 1,
    Low = 2,
    Balanced = 3,
    High = 4,
    Highest = 5,
    BestForNavigation = 6,
  }

  export function requestForegroundPermissionsAsync(): Promise<PermissionResponse>;
  export function getCurrentPositionAsync(options?: { accuracy?: Accuracy }): Promise<LocationObject>;
}

