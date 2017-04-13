"use strict"

import { fb } from './firebase-services';
        
const db = fb.database();

db.root  = db.ref();
db.todos = db.ref('todos');
db.users = db.ref('users');
db.usersList = db.ref('usersList');
db.taskGroup = db.ref('groups');

/* extend utilities for db.todos */

db.todos.lists = {};


db.todos.get = (list, callback) => {
  const done = [];
  function _doneCheck() {
    if (done.every( el => el)) {
      callback(todosList);
      // remove invalidated todos, this will cause the callback re-run --> need to optimize it
      if (invalidateTodos.length > 0) {
        const updates = {};
        invalidateTodos.forEach( todo => {
          if (fb.auth().currentUser && db.todos.lists[todo]) {
            const uid = fb.auth().currentUser.uid;
            updates[`users/${uid}/todos/${todo}`] = null;
            db.todos.lists[todo].off('value');
            delete db.todos.lists[todo];
          }
        });
        db.root.update(updates);
      }
    }
  }

  const uid = fb.auth().currentUser && fb.auth().currentUser.uid;
  if (!uid) {
    return;
  }
  const todosList = {};
  const invalidateTodos = [];
  if (list) {
    const n = Object.keys(list).length;
    for (let i = 0; i < n; i++) {
      done.push(false);
    }
    for (let i = 0; i < n; i++) {
      const id = Object.keys(list)[i];
      // store the ref to todo on firebase server
      db.todos.lists[id] = db.todos.child(id);
      // register a listener
      db.todos.lists[id].on('value', snap => {
        const todo = snap.val();
        if (todo) {
          todosList[id] = todo;  
        } else {
          // incase this todo is removed
          db.todos.lists[id].off('value');
          delete db.todos.lists[id];
        }

        done[i] = true;
        _doneCheck();

      }, err => {
        // error while access this item may be because it does not exist, (someone
        // has deleted it for example) or permission changed. So we need to invalidate
        // these todo and remove them from user todo list
        invalidateTodos.push(id);
        done[i] = true;
        _doneCheck();
      });
    }
  } else {
    callback(todosList);
  }
  
}

/* extend utilities for db.users */


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

db.users.getTodosList = callback => {
  const user = fb.auth().currentUser;
  if (user) {
    db.users.child(user.uid).child('todos').on('value', snapshot => {
      callback(snapshot.val());
    });
  } else {
    callback(null);
  }
}

db.users.getTaskGroupList = callback => {
  const user = fb.auth().currentUser;
  if (user) {
    db.users.child(user.uid).child('groups').on('value', snapshot => {
      callback(snapshot.val());
    });
  } else {
    callback(null);
  }
}


db.taskGroup.get = (list, callback) => {
  const done = [];
  function _doneCheck() {
    if (done.every( el => el)) { 
      // remove deleted task group
      if (invalidateTaskGroups.length > 0) {
        const updates = {};
        invalidateTaskGroups.forEach(groupId => {
          if (fb.auth().currentUser) {
            const uid = fb.auth().currentUser.uid;
            updates[`users/${uid}/groups/${groupId}`] = null;
            db.taskGroup.child(groupId).off('value');
            delete taskGroups[groupId];
          }
        })
        db.root.update(updates);
      } 
      // return taskGroup through callback
      callback(taskGroups);
    }
  }

  const uid = fb.auth().currentUser && fb.auth().currentUser.uid;
  if (!uid) {
    return;
  }

  const taskGroups = {};
  const invalidateTaskGroups = [];

  if (!list || list.length === 0) {
    callback(taskGroups);
    return;
  }

  const n = Object.keys(list).length;
  for (let i = 0; i < n; i++) {
    done.push(false);
  }

  for (let i = 0; i < n; i++) {
    const id = Object.keys(list)[i];
    db.taskGroup.child(id).on('value', snap => {
      const group = snap.val();
      if (group) {
        taskGroups[id] = group
      } else {
        db.taskGroup.child(id).off('value');
        delete taskGroups[id];
      }
      done[i] = true;
      _doneCheck();
    }, err => {
      invalidateTaskGroups.push(id);
      done[i] = true;
      _doneCheck();
    });
  }

}

export default db;

