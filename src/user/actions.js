"use strict"

import auth from '../auth-services'
import db from '../data-services'
import { data } from '../data/actions'
import { DNODE } from '../data/constants'
import { error } from '../error/actions'
import { ECODE } from '../error/constants'
import { USER } from './constants'
import { MESSAGES} from '../messages'

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
          _updateUserNode(dispatch,updates);
        }
        
      }
    },
    cleanAll (msgList = []) {
      return dispatch => {
        const msgIds = [];
        msgList.forEach ( msg => {
          if (msg.type === MESSAGES.TYPE.ALERT) {
            msgIds.push(msgList.id);
          }
        });
        dispatch(this.delete(msgIds));
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

  friends : {
    /* synchronous actions */
    update (friends) {
      return {
        type    : USER.FRIENDS.UPDATE,
        payload : { friends }
      }
    },
    /* asynchronous actions */
    add (friends = []) {
      return dispatch => {
        const uid = auth.currentUser.uid;
        const updates = {};
        if (!uid) {
          dispatch(error.update(ECODE.NOT_AUTHEN, {message : 'user is not signed in'}));
          return null;
        }
        if (friends.length > 0) {
          friends.forEach( friend => {
            updates[`users/${uid}/friends/${friend.id}`] = friend;
          });
          _updateUserNode(dispatch,updates);
        }
      }
    },
    remove(id) {
      return dispatch => {
        const uid = auth.currentUser.uid;
        const updates = {};
        if (!uid) {
          dispatch(error.update(ECODE.NOT_AUTHEN, {message : 'user is not signed in'}));
          return null;
        }
        updates[`users/${uid}/friends/${id}`] = null;
        _updateUserNode(dispatch,updates);
      }
    },
    edit(id, {name = null, relationship = null}) {
      return dispatch => {
        const uid = auth.currentUser.uid;
        const updates = {};
        if (!uid) {
          dispatch(error.update(ECODE.NOT_AUTHEN, {message : 'user is not signed in'}));
          return null;
        }
        if (name !== null) {
          updates[`users/${uid}/friends/${id}/name`] = name;
        }
        if (relationship !== null) {
          updates[`users/${uid}/friends/${id}/relationship`] = relationship;
        }
        _updateUserNode(dispatch,updates);
      }
    }
  },


  /* asynchronous actions */

  signUp({email = null, password = null, name = null}) {
    return dispatch => {
      return new Promise((resolve, reject) => {
        // need to validate email and password
        if (email === null) {
          dispatch(error.update(ECODE.INVALID_EMAIL, 'invalid email'));
          reject('invalid email');
        }
        if (password === null) {
          dispatch(error.update(ECODE.INVALID_PASSWORD, 'invalid password'));
          reject('invalid password');
        }
        return auth.createUserWithEmailAndPassword(email, password)
          .then( user => {
            if (!name) { name = email; }
            const id = user.uid;
            db.root.child('usersList').child(user.uid).set({ id, email, name });
            // successful signed up, clear error flag if any 
            dispatch(error.clear(ECODE.INVALID_EMAIL));
            dispatch(error.clear(ECODE.INVALID_PASSWORD));
            dispatch(error.clear(ECODE.SIGNUP));
            user.updateProfile({ displayName : name });
            resolve(user); 
          })
          .catch( err => {
            dispatch(error.update(ECODE.SIGNUP, err));
            reject(err);
          });
      })
    }
  },

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
          const friends = (userPrivateData) ? userPrivateData.friends || null : null;
          dispatch(this.update(usr, msg, todos, friends));
          dispatch(data.received(DNODE.USER));
          resolve(user);
        });
      });       
    };
  },

  update(usr, msg, todos, friends) {
    return dispatch => {
      dispatch(this.auth.update(usr));
      dispatch(this.messages.update(msg));
      dispatch(this.todos.update(todos));
      dispatch(this.friends.update(friends));
    }
  }

}

function _updateUserNode(dispatch, updates) {
  dispatch(data.uploading(DNODE.USER));
  db.root.update(updates).then( () => {
    dispatch(data.uploaded(DNODE.USER));
  });
}
