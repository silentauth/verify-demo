import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  Keyboard,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import {StackScreenProps} from '@react-navigation/stack';
import parsePhoneNumber, {CountryCode} from 'libphonenumber-js';

import PhoneInput from 'react-native-phone-number-input';
import {getDeviceToken} from '../utils/deviceUtil';
import {SERVER_BASE_URL} from '@env';
import {styles} from '../public/styles';

const LoginScreen = ({
  navigation,
  route,
}: StackScreenProps<{HomeScreen: any}>) => {
  const [inputNumber, setInputNumber] = useState('');
  const [defaultNumber, setDefaultNumber] = useState('');
  const [countryCode, setCountryCode] = useState<CountryCode>('GB');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [isPhoneNumberValidState, setIsPhoneNumberValidState] = useState(false);

  useEffect(() => {
    const error = route?.params?.errorMessage;

    if (error) {
      setErrorMessage(error);
    }
  }, [route]);

  useEffect(() => {
    const phoneNumber = parsePhoneNumber(inputNumber, countryCode);

    if (phoneNumber?.isValid()) {
      setIsPhoneNumberValidState(true);
    } else {
      setIsPhoneNumberValidState(false);
    }
  }, [inputNumber, countryCode]);

  const loginHandler = async () => {
    Keyboard.dismiss();
    setErrorMessage('');
    setIsLoading(true);

    const deviceToken = await getDeviceToken();
    const tel = parsePhoneNumber(inputNumber, countryCode)?.number;

    const body = {phone_number: tel, country_code: countryCode};
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
      setIsLoading(false);
      navigation.navigate('Verify', {requestId: data.requestId});
    } else {
      setIsLoading(false);
      setErrorMessage(data.error);
    }
  };

  return (
    <View style={styles.view}>
      <Text style={styles.heading}>Welcome to the Demo Application</Text>
      <Text style={styles.subHeading}>
        Please enter your phone number to login.
      </Text>
      <Text style={styles.errorText}>{errorMessage}</Text>
      <PhoneInput
        defaultValue={defaultNumber}
        defaultCode="GB"
        onChangeText={text => {
          setInputNumber(text);
        }}
        onChangeFormattedText={text => {
          setInputNumber(text);
        }}
        onChangeCountry={text => {
          setCountryCode(text.cca2);
        }}
      />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            color={styles.loadingContainer.color}
            size="large"
          />
        </View>
      ) : (
        <TouchableOpacity
          onPress={loginHandler}
          style={[
            styles.button,
            isPhoneNumberValidState
              ? styles.enabledButton
              : styles.disabledButton,
          ]}
          disabled={!isPhoneNumberValidState}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default LoginScreen;
