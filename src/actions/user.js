"use strict"

import auth from '../auth-services.js';
import { data } from './data';
import { NODE_USER } from '../constants'; 

/* action types */
export const USER = {
  /* synchronous actions */
  LOAD          : 'user.load',
  /* asynchronous actions */
  SIGNIN        : 'auth.signin',
  SIGNOUT       : 'auth.signout'
}

/* action creators */
export const user = {

  /* synchronous actions */
  load(user) {
    return {
      type    : USER.LOAD,
      payload : {
        user: user
      }
    }
  },

   /* asynchronous actions */

  signIn(email, password) {

    return (dispatch) => {
      dispatch(data.request(NODE_USER));
      return auth.signInWithEmailAndPassword(email, password).then( user => {
        dispatch(this.load(user));
        dispatch(data.received(NODE_USER));
      });
    } 

  },

  signOut() {

  }

}