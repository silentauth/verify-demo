'use strict';
import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
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
  disabledButton: {
    backgroundColor: '#EBEBE4',
  },
  enabledButton: {
    backgroundColor: '#1955ff',
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
