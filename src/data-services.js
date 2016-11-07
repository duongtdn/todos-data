"use strict"

import { fb } from './firebase-services';
        
const db = fb.database();

db.todos = db.ref('tasks');
db.users = db.ref('users');

/* extend utilities for db.todos */

db.todos.add = content => {
  const ref = db.todos.push();
    ref.set(content);
    return ref;
}

db.todos.get = callback => {
  db.todos.on('value', snapshot => {
    callback(snapshot.val());
  });
}

/* extend utilities for db.users */

db.users.addTodo = (todo, content) => {
   const user = fb.auth().currentUser;
    if (user) {
      const ref = db.users.child(user.uid).child('todos').child(todo).set(content);
      return ref;
    } else {
      return null;
    }
}

db.users.getData = callback => {
  const user = fb.auth().currentUser;
    if (user) {
      db.users.child(user.uid).on('value', snapshot => {
        callback(snapshot.val());
      });
    } else {
      callback(null);
    }
}


export default db;

