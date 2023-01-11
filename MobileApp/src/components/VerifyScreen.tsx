import React, {useEffect, useState} from 'react';
import {View, Text, TouchableOpacity, TextInput} from 'react-native';
import {StackScreenProps} from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {getDeviceToken} from '../utils/deviceUtil';
import {styles} from '../public/styles';

import {SERVER_BASE_URL} from '@env';

const VerifyScreen = ({
  navigation,
  route,
}: StackScreenProps<{HomeScreen: any}>) => {
  const [pin, setPin] = useState('');
  const [isPinValidState, setIsPinValidState] = useState(false);

  useEffect(() => {
    if (pin.length === 4) {
      setIsPinValidState(true);
    } else {
      setIsPinValidState(false);
    }
  }, [pin]);

  const verifyHandler = async () => {
    const body = {request_id: route?.params?.requestId, pin: pin};
    const deviceToken = await getDeviceToken();
    console.log("url= ",SERVER_BASE_URL); 

    const response = await fetch(`${SERVER_BASE_URL}/verify`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        'silent-auth': deviceToken.token,
        'device-id': deviceToken.deviceId,
      },
    });

    const data = await response.json();

    if (response.status === 200) {
      console.log('Verified! Go to Secure Page!!');
      setPin('');

      try {
        await AsyncStorage.setItem('@auth', data.token);
        navigation.navigate('Secure');
      } catch (e) {
        console.log(e);
      }
    } else {
      console.log('Verification does not exist or has expired!!');
      setPin('');
      navigation.navigate('Login', {errorMessage: data?.error});
    }
  };

  return (
    <View style={styles.view}>
      <Text style={styles.heading}>Welcome to the Demo Application</Text>
      <Text style={styles.subHeading}>
        Please enter your verification code to continue.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Verification Pin"
        keyboardType="numeric"
        autoCapitalize="none"
        onChangeText={text => setPin(text)}
        value={pin}
      />

      <TouchableOpacity
        onPress={verifyHandler}
        style={[
          styles.button,
          isPinValidState ? styles.enabledButton : styles.disabledButton,
        ]}
        disabled={!isPinValidState}>
        <Text style={styles.buttonText}>Verify Me!</Text>
      </TouchableOpacity>
    </View>
  );
};

export default VerifyScreen;
