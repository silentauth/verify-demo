import React, {useState, useEffect} from 'react';
import {TouchableOpacity, View, Text} from 'react-native';
import {StackScreenProps} from '@react-navigation/stack';
import {SERVER_BASE_URL} from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {getDeviceToken} from '../utils/deviceUtil';
import {styles} from '../public/styles';

const SecureScreen = ({navigation}: StackScreenProps<{HomeScreen: any}>) => {
  const [phoneNumber, setPhoneNumber] = useState('');

  const onScreenLoad = async () => {
    var token;
    try {
      token = await AsyncStorage.getItem('@auth');
    } catch (e) {
      console.log(e);
      navigation.navigate('Login');
    }

    if (token) {
      const deviceToken = await getDeviceToken();
      const response = await fetch(`${SERVER_BASE_URL}/secured-page`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'silent-auth': deviceToken.token,
          'device-id': deviceToken.deviceId,
        },
      });

      const data = await response.json();

      if (response.status === 200) {
        setPhoneNumber(data.phone_number);
      } else {
        navigation.navigate('Login');
      }
    } else {
      navigation.navigate('Login');
    }
  };

  useEffect(() => {
    onScreenLoad();
  });

  const logoutHandler = async () => {
    // This is the place to unset everything!!
    try {
      await AsyncStorage.removeItem('@auth');
    } catch (e) {
      console.log(e);
    }

    navigation.navigate('Login');
  };

  return (
    <View style={styles.view}>
      <Text style={styles.heading}>
        Welcome to the Secure Section of Demo Application
      </Text>
      <Text style={styles.subHeading}>
        This is a secure screen! You will only see this if you've verified
        yourself with your phone number.
      </Text>
      <Text style={styles.subHeading}>
        Here is your phone number, retrieved from an authenticated endpoint on
        the server: {phoneNumber}.
      </Text>
      <TouchableOpacity onPress={logoutHandler} style={[styles.button, styles.enabledButton]}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

export default SecureScreen;
