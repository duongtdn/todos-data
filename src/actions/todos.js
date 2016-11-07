"use strict"

import { STATUS, ERROR, OWNER, NODE_TODOS } from '../constants';
import db from '../data-services';
import auth from '../auth-services';
import { data } from './data';
import { error } from './error';


/* action types */
export const TODOS = {
  /* synchronous actions */
  COMPLETE  : 'todos.complete',
  CANCEL    : 'todos.cancel',
  UPDATE    : 'todos.update',
  /* asynchronous actions */
  FETCH     : 'todos.fetch',
  ADD       : 'todos.add',
}

/* action creators */

export const todos = {

  /* synchronous actions */

  // add(text, collaborators) {
  //   return {
  //     type    : TODOS.ADD,
  //     payload : {
  //       text          : text,
  //       collaborators : [...collaborators],
  //       createdAt     : new Date(),
  //       status        : STATUS.ACTIVE
  //     }
  //   }
  // },

  complete(id, uid) {
    return {
      type    : TODOS.COMPLETE,
      payload : {
        id            : id,
        completedBy   : uid,
        completedAt   : new Date(),
      }
    }
  },

  cancel(id, uid) {
    return {
      type    : TODOS.CANCEL,
      payload : {
        id            : id,
        cancelledBy   : uid
      }
    }
  },

  update(data) {
    return {
      type    : TODOS.UPDATE,
      payload : {
        data
      }
    }
  },

  /* asynchronous actions */

  fetch() {

    return dispatch => {
        
        // First dispatch: the app state is updated to inform
        // that the API call is starting.
        dispatch(data.request(NODE_TODOS));
        
        // The function called by the thunk middleware can return a value,
        // that is passed on as the return value of the dispatch method.
        return new Promise((resolve, reject) => {
          db.todos.get( todoList => {
            dispatch(todos.update(todoList));
            dispatch(data.received(NODE_TODOS));
            resolve(todoList);
          });
        });
        // catch error

      };
  },

  add(text, users) {

    return dispatch => {
      if (auth.currentUser) {
        /* add todo to todos db */
        if (!users) { users = {}; }
        users[auth.currentUser.uid] = OWNER;
        const todoRef = db.todos.add({
          text       : text,
          users      : users,
          createdAt  : new Date(),
          status     : STATUS.ACTIVE
        });  
        /* update todo id in user data */
        db.users.addTodo(todoRef.key, {status : STATUS.ACTIVE, role : OWNER});
      } else {
        dispatch(error.update(ERROR.NOT_AUTHEN, {message : 'user is not signed in'}));
      }
      
    }

  }

}