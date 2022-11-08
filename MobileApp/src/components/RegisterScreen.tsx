import React, {useRef, useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {StackScreenProps} from '@react-navigation/stack';

import PhoneInput from 'react-native-phone-number-input';
import {SERVER_BASE_URL} from '@env';

const RegisterScreen = ({navigation}: StackScreenProps<{HomeScreen: any}>) => {
  const [value, setValue] = useState('');
  const [formattedValue, setFormattedValue] = useState('');
  const [countryCode, setCountryCode] = useState('GB');

  const phoneInput = useRef<PhoneInput>(null);

  const registerHandler = async () => {
    if (countryCode === '') {
      setCountryCode('GB');
    }

    const body = {phone_number: formattedValue, country_code: countryCode};

    const response = await fetch(`${SERVER_BASE_URL}/register`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (response.status === 200) {
      console.log('Verification Sent!!');
      navigation.navigate('Verify', {requestId: data.requestId});
    } else {
      navigation.navigate('Login', {userExists: data.message});
    }
  };

  return (
    <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
      <Text style={styles.heading}>Welcome to the Demo Application</Text>
      <Text style={styles.subHeading}>
        Please enter your phone number to continue.
      </Text>
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

      <TouchableOpacity onPress={registerHandler} style={styles.button}>
        <Text style={styles.buttonText}>Register</Text>
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
  link: {
    color: '#0000FF;',
    fontSize: 15,
    marginBottom: 20,
    marginLeft: 20,
    marginRight: 20,
  },
});

export default RegisterScreen;
