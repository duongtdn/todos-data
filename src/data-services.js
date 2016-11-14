"use strict"

import { fb } from './firebase-services';
        
const db = fb.database();

db.todos = db.ref('tasks');
db.users = db.ref('users');

/* extend utilities for db.todos */

db.todos.lists = {};

db.todos.add = content => {
  const ref = db.todos.push();
  ref.set(content);
  return ref;
}

db.todos.get = (list, callback) => {
  const todosList = {};
  if (list) {
    const n = Object.keys(list).length;
    const done = [];
    for (let i = 0; i < n; i++) {
      done.push(false);
    }
    for (let i = 0; i < n; i++) {
      const id = Object.keys(list)[i];
      // store the ref to todo on firebase server
      db.todos.lists[id] = db.todos.child(id);
      // register a listener
      db.todos.lists[id].on('value', snap => {
        console.log (`User update todo : ${id}`);
        const todo = snap.val();
        if (todo) {
          todosList[id] = todo;  
        } else {
          // incase this todo is removed
          db.todos.lists[id].off('value');
          db.todos.lists[id] = null;
        }
        // when all data is updated, invoke callback
        done[i] = true;
        if (done.every( el => el)) {
          callback(todosList);
        }
      });
    }
  } else {
    callback(todosList);
  }
  
}

/* extend utilities for db.users */

db.users.addTodo = (todoId, content) => {
   const user = fb.auth().currentUser;
    if (user) {
      const ref = db.users.child(user.uid).child('todos').child(todoId).set(content);
      return ref;
    } else {
      return null;
    }
}

db.users.getData = callback => {
  const user = fb.auth().currentUser;
  //console.log('db.users.getData : auth failed');
  if (user) {
    //console.log('db.users.getData : auth passed');
    db.users.child(user.uid).on('value', snapshot => {
      callback(snapshot.val());
    });
  } else {
    callback(null);
  }
}

db.users.getTodosList = callback => {
  const user = fb.auth().currentUser;
  //console.log('db.users.getTodosList : auth failed');
  if (user) {
    //console.log('db.users.getTodosList : auth passed');
    db.users.child(user.uid).child('todos').on('value', snapshot => {
      //console.log ('\n***** User Todo List changed\n');
      callback(snapshot.val());
    });
  } else {
    callback(null);
  }
}


export default db;

