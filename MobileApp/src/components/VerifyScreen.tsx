import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import {StackScreenProps} from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {getDeviceToken} from '../utils/deviceUtil';

import {SERVER_BASE_URL} from '@env';

const VerifyScreen = ({
  navigation,
  route,
}: StackScreenProps<{HomeScreen: any}>) => {
  const [pin, setPin] = useState('');

  const verifyHandler = async () => {
    const body = {request_id: route?.params?.requestId, pin: pin};
    const deviceToken = await getDeviceToken();

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

      <TouchableOpacity onPress={verifyHandler} style={styles.button}>
        <Text style={styles.buttonText}>Verify Me!</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  view: {
    flex: 1,
    alignItems: 'center',
    marginTop: 120,
    marginLeft: 20,
    marginRight: 20,
  },
  heading: {
    fontSize: 20,
    marginBottom: 10,
    marginLeft: 10,
    marginRight: 10,
  },
  subHeading: {
    fontSize: 15,
    marginBottom: 10,
    marginLeft: 10,
    marginRight: 10,
  },
  input: {
    fontSize: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    marginVertical: 20,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#1955ff',
    marginTop: 10,
    width: '80%',
  },
  buttonText: {
    color: '#fff',
  },
});

export default VerifyScreen;
