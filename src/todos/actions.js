"use strict"

import { getTime } from '../util'
import db from '../data-services'
import auth from '../auth-services'
import { data } from '../data/actions'
import { DNODE } from '../data/constants'
import { error } from '../error/actions'
import { ECODE } from '../error/constants'
import messages, {TEMPLATE, MESSAGES} from '../messages'
import { TODOS, STATUS, OWNER, COLLABORATOR } from './constants'

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
        dispatch(data.request(DNODE.TODOS));
        
        // The function called by the thunk middleware can return a value,
        // that is passed on as the return value of the dispatch method.
        return new Promise((resolve, reject) => {
          db.users.getTodosList( list => {
            db.todos.get(list, todosList => {
              dispatch(todos.update(todosList));
              dispatch(data.received(DNODE.TODOS));
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
        updates[`users/${uid}/todos/${todoId}`] = {status : STATUS.LISTING, role : OWNER};
        // update
         _updateTodoAndUser (dispatch, updates);
        return todoId;
      } else {
        dispatch(error.update(ECODE.NOT_AUTHEN, {message : 'user is not signed in'}));
        return null;
      }
      
    }

  },

  delete(todo) {
    return dispatch => {
      if (auth.currentUser) {
        
        const uid = auth.currentUser.uid;
        const updates = {};
        const stakeholders = [];
        // delete todo in todos at root and users, then broadcast a mesage to 
        // all stakeholders
        for (let user in todo.share) {
          if (user !== uid) {
            stakeholders.push(user);
          }
        }
        updates[`todos/${todo.id}`] = null; // delete todo or change status to deleted???
        if (stakeholders.length > 0) {
          const message = messages.template(TEMPLATE.DELETE_TODO).create({
            receivers : stakeholders,
            content   : todo.text
          });
          stakeholders.forEach(user => {
            const msgKey = db.users.child(user).child('msg').push().key;
            message.id = msgKey;
            updates[`users/${user}/msg/${msgKey}`] = message;
          });
        }
        updates[`users/${uid}/todos/${todo.id}`] = null;
        // update
        _updateTodoAndUser (dispatch, updates);
      } else {
        dispatch(error.update(ECODE.NOT_AUTHEN, {message : 'user is not signed in'}));
      }
    }
  },

  complete(todo) {
    return dispatch => {
      const uid = auth.currentUser.uid;
      if (!uid) {
        dispatch(error.update(ECODE.NOT_AUTHEN, {message : 'user is not signed in'}));
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
        updates[`todos/${todoId}/share/${uid}`] = COLLABORATOR;
        updates[`users/${uid}/todos/${todoId}`] = {status : STATUS.LISTING, role : COLLABORATOR};
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
        _updateTodoAndUser (dispatch, updates);
      }
    }
  },

  edit( todo, {text = null, highlight = null, urgent = null}) {
    return dispatch => {

      const uid = auth.currentUser.uid;
      if (!uid) {
        dispatch(error.update(ECODE.NOT_AUTHEN, {message : 'user is not signed in'}));
        return null;
      }

      if (todo.id === null) {
        return null;
      }

      const updates = {};
      const stakeholders = [];
      for (let user in todo.share) {
        if (user !== uid) {
          stakeholders.push(user);
        }
      }

      if (text !== null) {
        updates[`todos/${todo.id}/text`] = text;
      }

      if (highlight !== null) {
        updates[`todos/${todo.id}/highlight`] = highlight;
      }

      if (urgent !== null) {
        updates[`todos/${todo.id}/urgent`] = urgent;
      }

      if (Object.keys(updates).length > 0) {
        // send message to stakeholders to notify change
        if (stakeholders.length > 0) {
          const message = messages.template(TEMPLATE.CHANGE_TODO).create({
            receivers : stakeholders,
            content   : todo.text
          });
          stakeholders.forEach(user => {
            const msgKey = db.users.child(user).child('msg').push().key;
            message.id = msgKey;
            updates[`users/${user}/msg/${msgKey}`] = message;
          });
        }
      }

      // update
      _updateTodoAndUser (dispatch, updates);

    }
  }

}

function _updateTodoAndUser (dispatch, updates) {
    dispatch(data.uploading(DNODE.TODOS));
    dispatch(data.uploading(DNODE.USER));
    db.root.update(updates).then( () => {
      dispatch(data.uploaded(DNODE.TODOS));
      dispatch(data.uploaded(DNODE.USER));
    });
}

function _validateMessage(uid, msg) {
  
  if (msg === null || msg === undefined) {
    throw ECODE.INVALID;
  }

  let checkUID = false;
  msg.to.forEach( usr => {
    if (usr === uid) {
      checkUID = true;
      return;
    }
  });
  if (!checkUID) {
    throw ECODE.PERMISSION_DENINED;
  }

  if (!msg.type || msg.type !== MESSAGES.TYPE.NOTIFICATION) {
    throw ECODE.INVALID;
  }

  if (!msg.subject || msg.subject !== MESSAGES.SUBJECT.SHARE_TODO) {
    throw ECODE.INVALID;
  }

  if (!msg.content) {
    throw ECODE.INVALID;
  }

  return true;

}