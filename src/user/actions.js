"use strict"

import auth from '../auth-services'
import db from '../data-services'
import { data } from '../data/actions'
import { DNODE } from '../data/constants'
import { error } from '../error/actions'
import { ECODE } from '../error/constants'
import { USER } from './constants'

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
    /* asynchronous actions */
    delete (msgIds = []) {
      return dispatch => {
        const uid = auth.currentUser.uid;
        const updates = {};
        if (!uid) {
          dispatch(error.update(ECODE.NOT_AUTHEN, {message : 'user is not signed in'}));
          return null;
        }
        if (msgIds.length > 0) {
          msgIds.forEach(id => {
            updates[`users/${uid}/msg/${id}`] = null;
          });
          dispatch(data.uploading(DNODE.USER));
          db.root.update(updates).then( () => {
            dispatch(data.uploaded(DNODE.USER));
          });
        }
        
      }
    }

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
      return new Promise((resolve, reject) => {
        return auth.signInWithEmailAndPassword(email, password)
          .then( user => {
            // successful signed in, clear error flag if any 
            dispatch(error.clear(ECODE.SIGNIN));
            dispatch(error.clear(ECODE.NOT_AUTHEN)); 
            resolve(user); 
          })
          .catch( err => {
            // sign in error
            dispatch(error.update(ECODE.SIGNIN, err));
            reject(err);
          });
      });
    } 

  },

  signOut() {
    return dispatch => {
      return auth.signOut()
        .then( () => {
          // successful signed out, clear error flag if any 
          dispatch(error.clear(ECODE.SIGNOUT));
        })
        .catch( err => {
          // sign out error
          dispatch(error.update(ECODE.SIGNOUT, err));
        })
    }
  },

  load() {
    return dispatch => {
      dispatch(data.request(DNODE.USER));
      return new Promise((resolve, reject) => {
        // reactive update if user data change
        db.users.getData(userPrivateData => {
          const usr   = auth.currentUser;
          const msg    = (userPrivateData) ? userPrivateData.msg || null : null;
          const todos  = (userPrivateData) ? userPrivateData.todos || null : null;
          dispatch(this.update(usr, msg, todos));
          dispatch(data.received(DNODE.USER));
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
