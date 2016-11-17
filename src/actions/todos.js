"use strict"

import { STATUS, ERROR, OWNER, NODE_TODOS, NODE_USER } from '../constants'
import { getTime } from '../util'
import db from '../data-services'
import auth from '../auth-services'
import { data } from './data'
import { error } from './error'
import messages, {TEMPLATE} from '../messenger';


/* action types */
export const TODOS = {
  /* synchronous actions */
  COMPLETE  : 'todos.complete',
  CANCEL    : 'todos.cancel',
  UPDATE    : 'todos.update',
  /* asynchronous actions */
  FETCH     : 'todos.fetch',
  ADD       : 'todos.add',
  REMOVE    : 'todos.remove',
  SHARE     : 'todos.share'
}

/* action creators */

export const todos = {

  /* synchronous actions */

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
          db.users.getTodosList( list => {
            db.todos.get(list, todosList => {
              dispatch(todos.update(todosList));
              dispatch(data.received(NODE_TODOS));
              resolve(todosList);
            });
          });
        });
        

      };
  },

  add(text, users) {

    return dispatch => {
      if (auth.currentUser) {
        /* add todo to todos db */
        if (!users) { users = {}; }
        users[auth.currentUser.uid] = OWNER;
        const timestamp = getTime();
        const todoRef = db.todos.add({
          text       : text,
          users      : users,
          createdAt  : timestamp,
          status     : STATUS.ACTIVE
        });  
        /* update todo id in user data */
        db.users.addTodo(todoRef.key, {status : STATUS.ACTIVE, role : OWNER});
        return todoRef.key;
      } else {
        dispatch(error.update(ERROR.NOT_AUTHEN, {message : 'user is not signed in'}));
        return null;
      }
      
    }

  },

  remove(id) {
    return dispatch => {
      if (auth.currentUser) {
        /* to be implemented after message system work */
      } else {
        dispatch(error.update(ERROR.NOT_AUTHEN, {message : 'user is not signed in'}));
      }
    }
  },

  share({users = [], id = ''}) {

    return dispatch => {

      const updates = {};
      // create an invitation message
      const message = messages.template(TEMPLATE.INVITE_TODO).create({
        receivers : users,
        content   : id
      });

      // prepare update
      users.forEach(user => {
        const msgKey = db.users.child(user).child('msg').push().key;
        updates[`users/${user}/msg/${msgKey}`] = message;
        updates[`todos/${id}/users/${user}`] = 'invited';
      });

      // update
      dispatch(data.uploading(NODE_TODOS));
      dispatch(data.uploading(NODE_USER));
      db.root.update(updates).then( () => {
        dispatch(data.uploaded(NODE_TODOS));
        dispatch(data.uploaded(NODE_USER));
      });
    }
    
  }

}