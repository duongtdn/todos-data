"use strict"

import { STATUS, NODE_TODOS } from '../constants';
import db from '../data-services';
import { data } from './data';


/* action types */
export const TODOS = {
  /* synchronous actions */
  ADD       : 'todos.add',
  COMPLETE  : 'todos.complete',
  CANCEL    : 'todos.cancel',
  LOAD      : 'todos.load',
  /* asynchronous actions */
  FETCH     : 'todos.fetch'
}

/* action creators */

export const todos = {

  /* synchronous actions */

  add(text, collaborators) {
    return {
      type    : TODOS.ADD,
      payload : {
        text          : text,
        collaborators : [...collaborators],
        createdAt     : new Date(),
        status        : STATUS.ACTIVE
      }
    }
  },

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

  load(data) {
    return {
      type    : TODOS.LOAD,
      payload : {
        data
      }
    }
  },

  /* asynchronous actions */

  fetch() {

    return (dispatch) => {
        
        // First dispatch: the app state is updated to inform
        // that the API call is starting.
        dispatch(data.request(NODE_TODOS));
        
        // The function called by the thunk middleware can return a value,
        // that is passed on as the return value of the dispatch method.
        return new Promise((resolve, reject) => {
          db.tasks.on('value', snapshot => {
            console.log (`# --- Received data`);
            const todoList = snapshot.val();
            dispatch(todos.load(todoList));
            dispatch(data.received(NODE_TODOS));
            resolve(todoList);
          });
        });
        // catch error

      }
  },

}