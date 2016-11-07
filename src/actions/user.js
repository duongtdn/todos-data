"use strict"

import auth from '../auth-services';
import db from '../data-services';
import { data } from './data';
import { error } from './error';
import { ERROR, NODE_USER } from '../constants'; 

/* action types */
export const USER = {
  /* synchronous actions */
  UPDATE        : 'user.update',
  /* asynchronous actions */
  SIGNIN        : 'user.signin',
  SIGNOUT       : 'user.signout',
  LOAD          : 'user.load',
}

/* action creators */
export const user = {

  /* synchronous actions */
  update(user) {
    return {
      type    : USER.UPDATE,
      payload : { user }
    }
  },

   /* asynchronous actions */

  signIn(email, password) {

    return dispatch => {      
      return auth.signInWithEmailAndPassword(email, password)
        .then( user => {
          // successful signed in, clear error flag if any 
          dispatch(error.clear(ERROR.SIGNIN));
          dispatch(error.clear(ERROR.NOT_AUTHEN));
          // then, load user private data
          return dispatch(this.load());        
        })
        .catch( err => {
          // sign in error
          return dispatch(error.update(ERROR.SIGNIN, err));
        });
    } 

  },

  signOut() {
    return dispatch => {
      return auth.signOut()
        .then( () => {
          // successful signed out, clear error flag if any 
          dispatch(error.clear(ERROR.SIGNOUT));
          return dispatch(this.update(null));
        })
        .catch( err => {
          // sign out error
          return dispatch(error.update(ERROR.SIGNOUT, err));
        })
    }
  },

  load() {
    return dispatch => {
      dispatch(data.request(NODE_USER));
      return new Promise((resolve, reject) => {
        db.users.getData(userPrivateData => {
          const user = auth.currentUser;
          user.msg    = userPrivateData.msg;
          user.todos  = userPrivateData.tasks;
          dispatch(this.update(user));
          dispatch(data.received(NODE_USER));
          resolve(user);
        });
      });       
    };
  }

}