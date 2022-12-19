import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import {StackScreenProps} from '@react-navigation/stack';

import PhoneInput from 'react-native-phone-number-input';
import {getDeviceToken} from '../utils/deviceUtil';
import {SERVER_BASE_URL} from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import parsePhoneNumber, {CountryCode} from 'libphonenumber-js';

import SilentAuthSdkReactNative, {
  CheckResponse,
} from '@silentauth/silentauth-sdk-react-native';

const LoginScreen = ({navigation}: StackScreenProps<{HomeScreen: any}>) => {
  const [inputNumber, setInputNumber] = useState('');
  const [defaultNumber, setDefaultNumber] = useState('');
  const [countryCode, setCountryCode] = useState<CountryCode>('GB');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [isPhoneNumberValidState, setIsPhoneNumberValidState] = useState(false);

  useEffect(() => {
    const phoneNumber = parsePhoneNumber(inputNumber, countryCode);

    if (phoneNumber?.isValid()) {
      setIsPhoneNumberValidState(true);
    } else {
      setIsPhoneNumberValidState(false);
    }
  }, [inputNumber, countryCode]);

  const getCheckResults = async (requestId: string) => {
    const deviceToken = await getDeviceToken();

    let interval = setInterval(async () => {
      var checkResponse;
      var checkResponseData;

      checkResponse = await fetch(
        `${SERVER_BASE_URL}/check-status?request_id=${requestId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'silent-auth': deviceToken?.token,
            'device-id': deviceToken?.deviceId,
          },
        },
      );

      if (checkResponse.status === 200) {
        checkResponseData = await checkResponse.json();
        console.log(`Check Response: ${JSON.stringify(checkResponseData)}`);

        if ('token' in checkResponseData) {
          clearInterval(interval);

          try {
            setIsLoading(false);
            await AsyncStorage.setItem('@auth', checkResponseData.token);
            navigation.navigate('Secure');
          } catch (e) {
            setIsLoading(false);
            setErrorMessage('Unexpected Error. Unable to log in.');
          }
        }
      } else if (checkResponse.status === 401) {
        setIsLoading(false);
        clearInterval(interval);
        setErrorMessage('Phone number not a match.');
      } else {
        setIsLoading(false);
        clearInterval(interval);
        setErrorMessage('Unexpected error occured.');
      }
    }, 1000);
  };

  const getCheckUrlFromApi = async (requestId: string) => {
    const deviceToken = await getDeviceToken();

    let interval = setInterval(async () => {
      var checkUrlResponse;
      var checkUrlResponseData;

      checkUrlResponse = await fetch(
        `${SERVER_BASE_URL}/check-status?request_id=${requestId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'silent-auth': deviceToken?.token,
            'device-id': deviceToken?.deviceId,
          },
        },
      );
      checkUrlResponseData = await checkUrlResponse.json();

      if (checkUrlResponse.status === 200 && checkUrlResponseData.check_url) {
        clearInterval(interval);

        const resp =
          await SilentAuthSdkReactNative.openWithDataCellular<CheckResponse>(
            checkUrlResponseData.check_url,
          );

        if ('error' in resp) {
          console.log(
            `Error in openWithDataCellular: ${resp.error_description}`,
          );
          setIsLoading(false);
          setErrorMessage('Unexpected error occured');
        } else if ('http_status' in resp) {
          const httpStatus = resp.http_status;

          if (httpStatus >= 200) {
            await getCheckResults(requestId);
          } else {
            setIsLoading(false);
            navigation.navigate('Verify', {requestId: requestId});
          }
        }
      }
    }, 3000);
  };

  const loginHandler = async () => {
    Keyboard.dismiss();
    setErrorMessage('');
    setIsLoading(true);

    const deviceToken = await getDeviceToken();
    const tel = parsePhoneNumber(inputNumber, countryCode)?.number;

    // Step 1 - Make POST to /login
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
      await getCheckUrlFromApi(data.requestId);
    } else {
      setErrorMessage(data.message);
      setIsLoading(false);
    }
  };

  const AppButton = () => (
    <TouchableOpacity
      onPress={loginHandler}
      style={[
        styles.button,
        isPhoneNumberValidState ? styles.enabledButton : styles.disabledButton,
      ]}
      disabled={!isPhoneNumberValidState}>
      <Text style={styles.buttonText}>Login</Text>
    </TouchableOpacity>
  );

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
        <AppButton />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  view: {
    flex: 1,
    alignItems: 'center',
    marginTop: 120,
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
  disabledButton: {
    backgroundColor: '#EBEBE4',
  },
  enabledButton: {
    backgroundColor: '#1955ff',
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
  loadingContainer: {
    marginTop: 40,
    justifyContent: 'center',
    color: '#00B4FF',
  },
});

export default LoginScreen;
