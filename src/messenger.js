"use strict"

import { getTime } from './util'
import auth from './auth-services';
import db from './data-services';
import { ERROR } from './constants'

import { STATUS, TYPE, SUBJECT, COLLABORATOR } from './constants'; 

export const TEMPLATE = {
  INVITE_TODO : 'inviteTodo'
};

export const MESSAGES = {
  STATUS : {
    UNREAD        : 'unread'
  },
  TYPE : {
    NOTIFICATION  : 'notification'
  },
  SUBJECT: {
    SHARE_TODO    : 'todo.share',
    TODO_CHANGED  : 'todo.changed',
    TOD_COMPLETED : 'todo.completed'
  }
};

export default {

  msgStruct : {
    id        : '',
    status    : '',
    from      : '',
    to        : [],
    createdAt : null,
    type      : '',
    subject   : '',
    content   : ''
  },
  
  template(name) {
    switch (name) {
      
      case TEMPLATE.INVITE_TODO :

        this.msgStruct.type = MESSAGES.TYPE.NOTIFICATION;
        this.msgStruct.subject = MESSAGES.SUBJECT.SHARE_TODO;

        return this;

      case TEMPLATE.COMPLETE_TODO :

        this.msgStruct.type = MESSAGES.TYPE.NOTIFICATION;
        this.msgStruct.subject = MESSAGES.SUBJECT.TOD_COMPLETED;

        return this;

      default :
        return this;
    }

  },


  create ({receivers = null, type = null, subject = null, content = null}) {
    
    const uid = auth.currentUser.uid;
    this.msgStruct.status = MESSAGES.STATUS.UNREAD;
    this.msgStruct.from = uid;
    this.msgStruct.createdAt = getTime();
    // need to validate to makesure receiver list is array 
    if (receivers) {
      this.msgStruct.to = receivers;
    }
    if (type) {
      this.msgStruct.type = type;
    }
    if (subject) {
      this.msgStruct.subject = subject;
    }
    if (content) {
      this.msgStruct.content = content;
    }
    return this.msgStruct;
  },

  
  acceptTodo (msgId, msg = null) {
    const user = auth.currentUser;
    // check permission, message type and subject
    checkPermission(user, msg);

    const todoId = msg.content; 
    if (todoId) {
      // update role in todo and add todo into user todos list
      db.todos.child(todoId).child('users').child(user.uid).set(COLLABORATOR);
      db.users.addTodo(todoId, {status : STATUS.ACTIVE, role : COLLABORATOR});
      // delete message
      db.users.child(user.uid).child('msg').child(msgId).set(null);
    }
  
  },  

  declineTodo(msgId, msg = null) {
    const user = auth.currentUser;
    // check permission, message type and subject
    checkPermission(user, msg);

    const todoId = msg.content; 
    if (todoId) {
      // remove user in todo 
      db.todos.child(todoId).child('users').child(user.uid).set(null);
      // delete message
      db.users.child(user.uid).child('msg').child(msgId).set(null);
    }
  },

  _clear() {
    this.msgStruct = {
      status    : '',
      from      : '',
      to        : [],
      createdAt : null,
      type      : '',
      subject   : '',
      content   : ''
    };
    return this;
  },

}

function checkPermission(user, msg) {
  if (msg === null || msg === undefined) {
    throw ERROR.INVALID;
  }
  if (!msg.to || msg.to !== user.uid) {
    throw ERROR.PERMISSION_DENINED;
  }    
  if (!msg.type || msg.type !== TYPE.NOTIFICATION) {
    throw ERROR.INVALID;
  }
  if (!msg.subject || msg.subject !== SUBJECT.SHARE_TODO) {
    throw ERROR.INVALID;
  } 
  if (!msg.content) {
    throw ERROR.INVALID;
  }
  return true;
}