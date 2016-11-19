"use strict"

import { STATUS, ERROR, OWNER, COLLABORATOR, NODE_TODOS, NODE_USER } from '../constants'
import { getTime } from '../util'
import db from '../data-services'
import auth from '../auth-services'
import { data } from './data'
import { error } from './error'
import messages, {TEMPLATE, MESSAGES} from '../messenger';


/* action types */
export const TODOS = {
  /* synchronous actions */
  UPDATE    : 'todos.update',
  /* asynchronous actions */
  FETCH     : 'todos.fetch',
  ADD       : 'todos.add',
  DELETE    : 'todos.delete',
  COMPLETE  : 'todos.complete',
  SHARE     : 'todos.share',
  ACCEPT    : 'todos.accept',
  DECLINE   : 'todos.decline',
}

/* action creators */

export const todos = {

  /* synchronous actions */

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
          share      : users,
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

  delete(id) {
    return dispatch => {
      if (auth.currentUser) {
        /* to be implemented after message system work */
      } else {
        dispatch(error.update(ERROR.NOT_AUTHEN, {message : 'user is not signed in'}));
      }
    }
  },

  complete(todo) {
    return dispatch => {
      const uid = auth.currentUser.uid;
      const updates = {};
      const stakeholders = [];
      for (let user in todo.share) {
        if (todo.share[user] === COLLABORATOR) {
          stakeholders.push(user);
        }
      }
      // change status of todo as complete, then broadcast a message 
      // to all stakeholders if any
      updates[`todos/${todo.id}/status`] = STATUS.COMPLETED;
      if (stakeholders.length > 0) {
        const message = messages.template(TEMPLATE.COMPLETE_TODO).create({
          receivers : stakeholders,
          content   : todo.id
        });
        stakeholders.forEach(user => {
          const msgKey = db.users.child(user).child('msg').push().key;
          message.id = msgKey;
          updates[`users/${user}/msg/${msgKey}`] = message;
        });
      }
      // update
      _updateTodoAndUser (dispatch, updates);
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
        message.id = msgKey;
        updates[`users/${user}/msg/${msgKey}`] = message;
        updates[`todos/${id}/share/${user}`] = 'invited';
      });

      // update
      _updateTodoAndUser (dispatch, updates);
    }
    
  },

  accept(message) {
    return dispatch => {
      const uid = auth.currentUser.uid;
      _validateMessage(uid, message);
      const todoId = message.content;
      const updates = {};
      if (todoId) {
        // update role in todo, add todo in user todo list, remove message
        updates[`todos/${todoId}/share/${uid}`] = 'collaborator';
        updates[`users/${uid}/todos/${todoId}`] = {status : STATUS.ACTIVE, role : COLLABORATOR};
        updates[`users/${uid}/msg/${message.id}`] = null;
        // update
        _updateTodoAndUser (dispatch, updates);
      }  
    }
  },

  decline(message) {
    return dispatch => {
      const uid = auth.currentUser.uid;
      _validateMessage(uid, message);
      const todoId = message.content;
      const updates = {};
      if (todoId) {
        // remove user in todo, remove message
        updates[`todos/${todoId}/share/${uid}`] = null;
        updates[`users/${uid}/msg/${message.id}`] = null;
        // update
        dispatch(data.uploading(NODE_TODOS));
        dispatch(data.uploading(NODE_USER));
        db.root.update(updates).then( () => {
          dispatch(data.uploaded(NODE_TODOS));
          dispatch(data.uploaded(NODE_USER));
        });
      }
    }
  },

  

}

function _updateTodoAndUser (dispatch, updates) {
    dispatch(data.uploading(NODE_TODOS));
    dispatch(data.uploading(NODE_USER));
    db.root.update(updates).then( () => {
      dispatch(data.uploaded(NODE_TODOS));
      dispatch(data.uploaded(NODE_USER));
    });
}

function _validateMessage(uid, msg) {
  
  if (msg === null || msg === undefined) {
    throw ERROR.INVALID;
  }

  let checkUID = false;
  msg.to.forEach( usr => {
    if (usr === uid) {
      checkUID = true;
      return;
    }
  });
  if (!checkUID) {
    throw ERROR.PERMISSION_DENINED;
  }

  if (!msg.type || msg.type !== MESSAGES.TYPE.NOTIFICATION) {
    throw ERROR.INVALID;
  }

  if (!msg.subject || msg.subject !== MESSAGES.SUBJECT.SHARE_TODO) {
    throw ERROR.INVALID;
  }

  if (!msg.content) {
    throw ERROR.INVALID;
  }

  return true;

}