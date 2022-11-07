import React, {useState, useEffect} from 'react';
import {TouchableOpacity, View, Text, StyleSheet} from 'react-native';
import {StackScreenProps} from '@react-navigation/stack';
import RNSecureKeyStore from 'react-native-secure-key-store';
import {SERVER_BASE_URL} from '@env';

const SecureScreen = ({navigation}: StackScreenProps<{HomeScreen: any}>) => {
  const [phoneNumber, setPhoneNumber] = useState('');

  const onScreenLoad = async () => {
    const token = await RNSecureKeyStore.get('auth');

    if (token) {
      const response = await fetch(`${SERVER_BASE_URL}/secured-page`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
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
    await RNSecureKeyStore.remove('auth');
    navigation.navigate('Login');
  };

  return (
    <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
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
      <TouchableOpacity onPress={logoutHandler} style={styles.button}>
        <Text style={styles.buttonText}>Logout</Text>
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
});

export default SecureScreen;
