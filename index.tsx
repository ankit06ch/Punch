import { GestureHandlerRootView } from 'react-native-gesture-handler';
import App from './App';

export default function Root() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <App />
    </GestureHandlerRootView>
  );
} 