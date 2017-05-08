"use strict"

import firebase from 'firebase';

// Initialize Firebase
var config = {
  apiKey: "AIzaSyD1Dl4B0b2AD1zosQI1Y9moI1rU9cOrKEE",
  authDomain: "todo-together-d1d99.firebaseapp.com",
  databaseURL: "https://todo-together-d1d99.firebaseio.com",
  projectId: "todo-together-d1d99",
  storageBucket: "todo-together-d1d99.appspot.com",
  messagingSenderId: "392354673787"
};

export const fb = firebase.initializeApp(config);