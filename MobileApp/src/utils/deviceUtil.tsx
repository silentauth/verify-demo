import AsyncStorage from '@react-native-async-storage/async-storage';
import {getUniqueId} from 'react-native-device-info';

export async function getDeviceToken() {
  try {
    const token = await AsyncStorage.getItem('@device');
    const deviceId = await getUniqueId();

    return {token, deviceId};
  } catch (e) {
    console.log(e);
    return {};
  }
}
