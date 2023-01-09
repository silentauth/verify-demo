// screens/Home.js
import React, {useEffect} from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import {getUniqueId} from 'react-native-device-info';
import {SERVER_BASE_URL} from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {styles} from '../public/styles';

interface Props {
  navigation: any;
}

async function createDeviceToken() {
  const deviceId = await getUniqueId();

  const response = await fetch(
    `${SERVER_BASE_URL}/device?deviceId=${deviceId}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );
  const data = await response.json();

  if (data.token !== 'undefined') {
    try {
      await AsyncStorage.setItem('@device', data.token);
    } catch (e) {
      console.log(e);
    }
  }
}

function HomeScreen({navigation}: Props) {
  const onScreenLoad = async () => {
    createDeviceToken();
  };

  useEffect(() => {
    onScreenLoad();
  });

  return (
    <View style={styles.view}>
      <Text style={styles.heading}>Welcome to the Demo Application</Text>
      <TouchableOpacity
        onPress={() => navigation.navigate('Login')}
        style={[styles.button, styles.enabledButton]}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
    </View>
  );
}

export default HomeScreen;
