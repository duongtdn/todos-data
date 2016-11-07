"use strict"

import auth from '../auth-services';
import db from '../data-services';
import { data } from './data';
import { NODE_USER } from '../constants'; 

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
      payload : {
        user: user
      }
    }
  },

   /* asynchronous actions */

  signIn(email, password) {

    return (dispatch) => {      
      return auth.signInWithEmailAndPassword(email, password).then( user => {
        return dispatch(this.load(user));        
      });
    } 

  },

  signOut() {

  },

  load(user) {
    return (dispatch) => {
      dispatch(data.request(NODE_USER));
      return new Promise((resolve, reject) => {
        db.get.userPrivateData(userPrivateData => {
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