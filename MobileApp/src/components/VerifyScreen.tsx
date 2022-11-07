import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import {StackScreenProps} from '@react-navigation/stack';

import RNSecureKeyStore, {ACCESSIBLE} from 'react-native-secure-key-store';
import {SERVER_BASE_URL} from '@env';

const VerifyScreen = ({
  navigation,
  route,
}: StackScreenProps<{HomeScreen: any}>) => {
  const [pin, setPin] = useState('');

  const verifyHandler = async () => {
    const body = {request_id: route?.params?.requestId, pin: pin};
    console.log(body);

    const response = await fetch(`${SERVER_BASE_URL}/verify`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    console.log(data);

    if (response.status === 200) {
      console.log('Verified! Go to Secure Page!!');

      RNSecureKeyStore.set('auth', data.token, {
        accessible: ACCESSIBLE.ALWAYS_THIS_DEVICE_ONLY,
      }).then(
        res => {
          console.log(res);
          navigation.navigate('Secure');
        },
        err => {
          console.log(err);
        },
      );
    }
  };

  return (
    <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
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
  input: {
    fontSize: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    marginVertical: 20,
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

export default VerifyScreen;
