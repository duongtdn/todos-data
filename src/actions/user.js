"use strict"

import auth from '../auth-services';
import db from '../data-services';
import { data } from './data';
import { error } from './error';
import { ERROR, NODE_USER } from '../constants'; 

/* action types */
export const USER = {
  /* synchronous actions */
  AUTH          : {
    UPDATE      : 'user.auth.update'
  },
  MESSAGES     : {
    UPDATE      : 'user.messages.update'
  },
  TODOS         : {
    UPDATE      : 'user.todos.update'
  },
  
  /* asynchronous actions */
  SIGNIN        : 'user.signin',
  SIGNOUT       : 'user.signout',
  LOAD          : 'user.load',
}

/* action creators */
export const user = {

  /* synchronous actions */
  auth  : {
    update (user) {
      return {
        type    : USER.AUTH.UPDATE,
        payload : { user }
      };
    }
  },

  messages : {
    update (messages) {
      return {
        type    : USER.MESSAGES.UPDATE,
        payload : { messages }
      };
    },
  },

  todos : {
    update (todos) {
      return {
        type    : USER.TODOS.UPDATE,
        payload : { todos }
      };
    }, 
  },


   /* asynchronous actions */

  signIn(email, password) {

    return dispatch => {      
      return auth.signInWithEmailAndPassword(email, password)
        .then( user => {
          // successful signed in, clear error flag if any 
          dispatch(error.clear(ERROR.SIGNIN));
          dispatch(error.clear(ERROR.NOT_AUTHEN));  
        })
        .catch( err => {
          // sign in error
          dispatch(error.update(ERROR.SIGNIN, err));
        });
    } 

  },

  signOut() {
    return dispatch => {
      return auth.signOut()
        .then( () => {
          // successful signed out, clear error flag if any 
          dispatch(error.clear(ERROR.SIGNOUT));
        })
        .catch( err => {
          // sign out error
          dispatch(error.update(ERROR.SIGNOUT, err));
        })
    }
  },

  load() {
    return dispatch => {
      dispatch(data.request(NODE_USER));
      return new Promise((resolve, reject) => {
        db.users.getData(userPrivateData => {
          const user = auth.currentUser;
          const msg    = userPrivateData.msg;
          const todos  = userPrivateData.todos;
          dispatch(this.auth.update(user));
          dispatch(this.messages.update(msg));
          dispatch(this.todos.update(todos));
          dispatch(data.received(NODE_USER));
          resolve(user);
        });
      });       
    };
  }

}