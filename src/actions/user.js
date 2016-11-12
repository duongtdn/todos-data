"use strict"

import auth from '../auth-services';
import db from '../data-services';
import { data } from './data';
import { error } from './error';
import { STATUS, ERROR, NODE_USER } from '../constants'; 


/* action types */
export const USER = {

  AUTH          : {
    /* synchronous actions */
    UPDATE      : 'user.auth.update'
  },
  MESSAGES     : {
    /* synchronous actions */
    UPDATE      : 'user.messages.update'
  },
  TODOS         : {
    /* synchronous actions */
    UPDATE      : 'user.todos.update'
  },
  
  /* asynchronous actions */
  SIGNIN        : 'user.signin',
  SIGNOUT       : 'user.signout',
  LOAD          : 'user.load',
  UPDATE        : 'user.update',
}

/* action creators */
export const user = {

  auth  : {
    /* synchronous actions */
    update (user) {
      return {
        type    : USER.AUTH.UPDATE,
        payload : { user }
      };
    }
  },

  messages : {
    /* synchronous actions */
    update (messages) {
      return {
        type    : USER.MESSAGES.UPDATE,
        payload : { messages }
      };
    },

  },

  todos : {
    /* synchronous actions */
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
        // reactive update if user data change
        db.users.getData(userPrivateData => {
          const usr   = auth.currentUser;
          const msg    = userPrivateData.msg;
          const todos  = userPrivateData.todos;
          dispatch(this.update(usr, msg, todos));
          dispatch(data.received(NODE_USER));
          resolve(user);
        });
      });       
    };
  },

  update(usr, msg, todos) {
    return dispatch => {
      dispatch(this.auth.update(usr));
      dispatch(this.messages.update(msg));
      dispatch(this.todos.update(todos));
    }
  }

}
