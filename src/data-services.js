"use strict"

import { fb } from './firebase-services'; 
        
const db = fb.database();

db.todos = db.ref('tasks');
db.users = db.ref('users');

db.get = {

  todos(callback) {
    db.todos.on('value', snapshot => {
      callback(snapshot.val());
    });
  },

  userPrivateData(callback) {
    const user = fb.auth().currentUser;
    if (user) {
      db.users.child(user.uid).on('value', snapshot => {
        callback(snapshot.val());
      });
    } else {
      callback(null);
    }
  }

}

export default db;

