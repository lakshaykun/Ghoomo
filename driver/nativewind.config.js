import { withNativeWind } from 'nativewind';
import { withExpoRouter } from 'expo-router/with-expo-router';

export default withNativeWind(withExpoRouter({}), { input: 'global.css' });
