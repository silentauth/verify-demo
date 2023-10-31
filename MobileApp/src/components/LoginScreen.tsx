import React, {useEffect, useState} from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import {styles} from '../public/styles';

import SilentAuthSdkReactNative, {
  CheckResponse,
} from '@silentauth/silentauth-sdk-react-native';

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
    console.log(`silent-auth deviceToken.token: ${deviceToken.token}`);
    console.log(`device-id deviceToken.deviceId: ${deviceToken.deviceId}`);
    // Step 1 - Make POST to /login
    const body = {phone_number: tel, country_code: countryCode};
    const loginResponse = await fetch(`${SERVER_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'silent-auth': deviceToken?.token,
        'device-id': deviceToken?.deviceId,
      },
      body: JSON.stringify(body),
    });
    const data = await loginResponse.json();
    if (loginResponse.status === 200) {
      const requestId = data.requestId;
      const checkUrl = data.checkUrl; // Vonage CheckURL
      console.log(`Response from server: ${{data}}`);
      console.log(`checkurl from login ${checkUrl}`);
      console.log(`1 requestId from POST/login: ${requestId}`);

      const openCheckResponse =
        await SilentAuthSdkReactNative.openWithDataCellular<CheckResponse>(
          checkUrl, //url: api-eu-3.vonage.com/
        );

      if ('error' in openCheckResponse) {
        setIsLoading(false);
        setErrorMessage(
          `Error in openWithDataCellular: ${openCheckResponse.error_description}`,
        );
      } else if ('http_status' in openCheckResponse) {
        const httpStatus = openCheckResponse.http_status;
        if (httpStatus >= 200) {
          console.log('Resp from silentauth 200');
          if (openCheckResponse.response_body) {
            const rBody = openCheckResponse.response_body;
            console.log(`SilentAuthResponse Body: ${rBody} ---`);
            if ('code' in rBody) {
              const code = rBody.code;
              console.log(`code: ${code}`);
              const newBody = {request_id: requestId, pin: code};
              console.log(`pin/code: ${code}`);
              console.log(`newBody: ${newBody.request_id} and ${newBody.pin}`);

              const verifyResponse = await fetch(`${SERVER_BASE_URL}/verify`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'silent-auth': deviceToken.token,
                  'device-id': deviceToken.deviceId,
                },
                body: JSON.stringify(newBody),
              });

              const verifyData = await verifyResponse.json();
              if (verifyResponse.status === 200) {
                console.log('Verified! Go to Secure Page!!');
                try {
                  await AsyncStorage.setItem('@auth', verifyData.token);
                  navigation.navigate('Secure');
                } catch (e) {
                  console.log(e);
                }
              } else if (verifyResponse.status === 400) {
                console.log('Verification Pin incorrect!!');
                setErrorMessage('Incorrect pin entered. Please retry');
              } else if (verifyResponse.status === 409) {
                console.log("Workflow doesn't require a pin.");
                setErrorMessage(
                  'A pin is not required for this step of the verification process.',
                );
              } else {
                console.log('Verification does not exist or has expired!!');
                navigation.navigate('Login', {errorMessage: verifyData?.error});
              }
            } else {
              setIsLoading(false);
              console.log('Before Verify No Code...');
              navigation.navigate('Verify', {requestId: requestId});
              console.log('After Verify No Code...');
            }
          }
        } else {
          setIsLoading(false);
          console.log('Before Verify...');
          navigation.navigate('Verify', {requestId: requestId});
          console.log(`After Verify...`);
        }
      }
    } else {
      console.log(`Error response from server: ${{data}}`);
      setErrorMessage(`Error in login: ${data.error}`);
      setIsLoading(false);
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
