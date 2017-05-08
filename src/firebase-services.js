"use strict"

import firebase from 'firebase';

// Initialize Firebase
var config = {
  apiKey: "AIzaSyCrT408W7FS9Sx4iRCoVxllJTG8e6QhPuI",
  authDomain: "todotogether-9ef1d.firebaseapp.com",
  databaseURL: "https://todotogether-9ef1d.firebaseio.com",
  projectId: "todotogether-9ef1d",
  storageBucket: "todotogether-9ef1d.appspot.com",
  messagingSenderId: "890607334661"
};

export const fb = firebase.initializeApp(config);