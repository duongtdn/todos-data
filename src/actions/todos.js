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

  add({text = '', share = {}, urgent = false, highlight = false}) {

    return dispatch => {
      if (auth.currentUser) {
        const uid = auth.currentUser.uid;
        const updates = {};
        const todoId = db.todos.push().key;
        const stakeholders = {};
        
        // prepare invitation messages
        if (share.length > 0) {
          const message = messages.template(TEMPLATE.INVITE_TODO).create({
            receivers : share,
            content   : todoId
          });
          share.forEach(user => {
            const msgKey = db.users.child(user).child('msg').push().key;
            message.id = msgKey;
            updates[`users/${user}/msg/${msgKey}`] = message;
            stakeholders[user] = 'invited';
          });
        }
        // prepare todo
        stakeholders[uid] = OWNER;
        const timestamp = getTime();
        updates[`todos/${todoId}`] = {
          id          : todoId,
          text        : text,
          share       : stakeholders,
          createdAt   : timestamp,
          status      : STATUS.PENDING,
          completedBy : '',
          completedAt : '',
          urgent      : urgent,
          highlight   : highlight
        }
        // prepare todo in user list
        updates[`users/${uid}/todos/${todoId}`] = {status : STATUS.PENDING, role : OWNER};
        // update
         _updateTodoAndUser (dispatch, updates);
        return todoId;
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
      console.log('completing a todo');
      console.log(todo);
      const uid = auth.currentUser.uid;
      if (!uid) {
        dispatch(error.update(ERROR.NOT_AUTHEN, {message : 'user is not signed in'}));
        return null;
      }

      const updates = {};
      const stakeholders = [];
      for (let user in todo.share) {
        if (user !== uid) {
          stakeholders.push(user);
        }
      }
      // change status of todo as completed, then broadcast a message 
      // to all stakeholders if any
      updates[`todos/${todo.id}/status`] = STATUS.COMPLETED;
      updates[`todos/${todo.id}/completedBy`] = uid;
      updates[`todos/${todo.id}/completedAt`] = getTime();
      if (stakeholders.length > 0) {
        const message = messages.template(TEMPLATE.COMPLETE_TODO).create({
          receivers : stakeholders,
          content   : todo.id
        });
        stakeholders.forEach(user => {
          const msgKey = db.users.child(user).child('msg').push().key;
          message.id = msgKey;
          updates[`users/${user}/msg/${msgKey}`] = message;
          updates[`users/${user}/todos/${todo.id}/status`] = STATUS.COMPLETED;
        });
      }
      updates[`users/${uid}/todos/${todo.id}/status`] = STATUS.COMPLETED;
      // update
      console.log('updating to server');
      console.log(updates);
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
        updates[`todos/${todoId}/share/${uid}`] = COLLABORATOR;
        updates[`users/${uid}/todos/${todoId}`] = {status : STATUS.PENDING, role : COLLABORATOR};
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