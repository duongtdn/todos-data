"use strict"

import { fb } from './firebase-services';
        
const db = fb.database();

db.root  = db.ref();
db.todos = db.ref('todos');
db.users = db.ref('users');
db.usersList = db.ref('usersList');

/* extend utilities for db.todos */

db.todos.lists = {};


db.todos.get = (list, callback) => {
  const uid = fb.auth().currentUser.uid;
  if (!uid) {
    throw 'Error : No-Auth';
  }
  const todosList = {};
  if (list) {
    const n = Object.keys(list).length;
    const done = [];
    const invalidateTodos = [];
    for (let i = 0; i < n; i++) {
      done.push(false);
    }
    for (let i = 0; i < n; i++) {
      const id = Object.keys(list)[i];
      // store the ref to todo on firebase server
      db.todos.lists[id] = db.todos.child(id);
      // register a listener
      db.todos.lists[id].on('value', snap => {
        console.log (`# INFO : Change in todo : ${id}`);
        const todo = snap.val();
        if (todo) {
          todosList[id] = todo;  
        } else {
          // incase this todo is removed
          db.todos.lists[id].off('value');
          db.todos.lists[id] = null;
        }

        done[i] = true;
        if (done.every( el => el)) {
          callback(todosList);
          // remove invalidated todos, this will cause the callback re-run --> need to optimize it
          if (invalidateTodos.length > 0) {
            const updates = {};
            invalidateTodos.forEach( todo => {
              updates[`users/${uid}/todos/${todo}`] = null;
            });
            db.root.update(updates);
          }
            
          
        }
      }, err => {
        // error while access this item may be because it does not exist 
        // or permission changed
        invalidateTodos.push(id);
        done[i] = true;
      });
    }
  } else {
    callback(todosList);
  }
  
}

/* extend utilities for db.users */


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
  if (user) {
    db.users.child(user.uid).child('todos').on('value', snapshot => {
      console.log ('# INFO : Change in User Todo List');
      callback(snapshot.val());
    });
  } else {
    callback(null);
  }
}


export default db;

