"use strict"

import firebase from 'firebase';

// Initialize Firebase
const config = {
  apiKey            : "AIzaSyDT4ogvYCFdgv8lohigvNXDG3QVSpRRIwI",
  authDomain        : "awesome-9f422.firebaseapp.com",
  databaseURL       : "https://awesome-9f422.firebaseio.com",
  storageBucket     : "awesome-9f422.appspot.com",
  messagingSenderId : "355266543315"
};


export const fb = firebase.initializeApp(config);