import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {StackScreenProps} from '@react-navigation/stack';

import PhoneInput from 'react-native-phone-number-input';
import {getDeviceToken} from '../utils/deviceUtil';
import {SERVER_BASE_URL} from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';

import SilentAuthSdkReactNative, {
  CheckResponse,
} from '@silentauth/silentauth-sdk-react-native';

const LoginScreen = ({navigation}: StackScreenProps<{HomeScreen: any}>) => {
  const [value, setValue] = useState('');
  const [formattedValue, setFormattedValue] = useState('');
  const [countryCode, setCountryCode] = useState('GB');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  const phoneInput = useRef<PhoneInput>(null);

  const getCheckResults = async (requestId: string) => {
    const deviceToken = await getDeviceToken();

    let interval = setInterval(async () => {
      var checkResponse;
      var checkResponseData;

      checkResponse = await fetch(
        `${SERVER_BASE_URL}/check-silent-auth-status?request_id=${requestId}`,
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
    }, 3000);
  };

  const getCheckUrlFromApi = async (requestId: string) => {
    const deviceToken = await getDeviceToken();

    let interval = setInterval(async () => {
      var checkUrlResponse;
      var checkUrlResponseData;

      checkUrlResponse = await fetch(
        `${SERVER_BASE_URL}/get-check-url?request_id=${requestId}`,
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
    setErrorMessage('');
    setIsLoading(true);

    if (countryCode === '') {
      setCountryCode('GB');
    }

    const deviceToken = await getDeviceToken();

    // Step 1 - Make POST to /login
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
      await getCheckUrlFromApi(data.requestId);
    } else {
      setErrorMessage(data.message);
      setIsLoading(false);
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
          setValue(text);
        }}
        onChangeFormattedText={text => {
          setFormattedValue(text);
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
        <TouchableOpacity onPress={loginHandler} style={styles.button}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>
      )}
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
  loadingContainer: {
    marginTop: 40,
    justifyContent: 'center',
    color: '#00B4FF',
  },
});

export default LoginScreen;
