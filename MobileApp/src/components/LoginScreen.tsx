import React, {useEffect, useRef, useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {StackScreenProps} from '@react-navigation/stack';

import PhoneInput from 'react-native-phone-number-input';
import {getDeviceToken} from '../utils/deviceUtil';
import {SERVER_BASE_URL} from '@env';

const LoginScreen = ({navigation}: StackScreenProps<{HomeScreen: any}>) => {
  const [value, setValue] = useState('');
  const [formattedValue, setFormattedValue] = useState('');
  const [countryCode, setCountryCode] = useState('GB');
  const [errorMessage, setErrorMessage] = useState('');

  const phoneInput = useRef<PhoneInput>(null);

  const loginHandler = async () => {
    if (countryCode === '') {
      setCountryCode('GB');
    }

    const deviceToken = await getDeviceToken();

    console.log({
      'silent-auth': deviceToken.token,
      'device-id': deviceToken.deviceId,
    });
    const body = {phone_number: formattedValue, country_code: countryCode};
    const response = await fetch(`${SERVER_BASE_URL}/login`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        'silent-auth': deviceToken?.token,
        'device-id': deviceToken?.deviceId,
      },
    });
    const data = await response.json();

    if (response.status === 200) {
      console.log('Verification Sent!!');
      navigation.navigate('Verify', {requestId: data.requestId});
    } else {
      setErrorMessage(data.error);
    }
  };

  return (
    <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
      <Text style={styles.heading}>Welcome to the Demo Application</Text>
      <Text style={styles.subHeading}>
        Please enter your phone number to login.
      </Text>
      <Text style={styles.errorText}>{errorMessage}</Text>
      <PhoneInput
        ref={phoneInput}
        defaultValue={value}
        defaultCode="GB"
        onChangeText={text => {
          console.log(text);
          setValue(text);
        }}
        onChangeFormattedText={text => {
          console.log(text);
          setFormattedValue(text);
        }}
        onChangeCountry={text => {
          setCountryCode(text.cca2);
          console.log(countryCode);
        }}
      />

      <TouchableOpacity onPress={loginHandler} style={styles.button}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  heading: {
    fontSize: 20,
    marginBottom: 50,
    marginLeft: 20,
    marginRight: 20,
  },
  subHeading: {
    fontSize: 15,
    marginBottom: 20,
    marginLeft: 20,
    marginRight: 20,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1955ff',
    color: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#1955ff',
    marginTop: 20,
    width: '80%',
  },
  buttonText: {
    color: '#fff',
  },
  errorText: {
    color: '#FF0000',
    fontSize: 15,
    marginBottom: 20,
    marginLeft: 20,
    marginRight: 20,
  },
});

export default LoginScreen;
