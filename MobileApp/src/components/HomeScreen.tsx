// screens/Home.js
import React, {useEffect} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {getUniqueId} from 'react-native-device-info';
import {SERVER_BASE_URL} from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Props {
  navigation: any;
}

async function createDeviceToken() {
  const deviceId = await getUniqueId();

  const response = await fetch(
    `${SERVER_BASE_URL}/device?deviceId=${deviceId}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );
  const data = await response.json();

  if (data.token !== 'undefined') {
    try {
      await AsyncStorage.setItem('@device', data.token);
    } catch (e) {
      console.log(e);
    }
  }
}

function HomeScreen({navigation}: Props) {
  const onScreenLoad = async () => {
    createDeviceToken();
  };

  useEffect(() => {
    onScreenLoad();
  });

  return (
    <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
      <Text style={styles.heading}>Welcome to the Demo Application</Text>
      <TouchableOpacity
        onPress={() => navigation.navigate('Login')}
        style={styles.button}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
    </View>
  );
}

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

export default HomeScreen;
