"use strict"

import { getTime } from './util'
import auth from './auth-services'
import db from './data-services'

export const TEMPLATE = {
  INVITE_TODO   : 'inviteTodo',
  COMPLETE_TODO : 'completeTodo',
  DELETE_TODO   : 'deleteTodo',
  CHANGE_TODO   : 'changeTodo'
};

export const MESSAGES = {
  STATUS : {
    UNREAD        : 'unread'
  },
  TYPE : {
    NOTIFICATION  : 'notification'
  },
  SUBJECT: {
    SHARE_TODO      : 'todo.share',
    TODO_CHANGED    : 'todo.changed',
    TODO_COMPLETED  : 'todo.completed',
    TODO_DELETED    : 'todo.deleted'
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
        this.msgStruct.subject = MESSAGES.SUBJECT.TODO_COMPLETED;

        return this;

       case TEMPLATE.DELETE_TODO :

        this.msgStruct.type = MESSAGES.TYPE.NOTIFICATION;
        this.msgStruct.subject = MESSAGES.SUBJECT.TODO_DELETED;

        return this;

      case TEMPLATE.CHANGE_TODO :

        this.msgStruct.type = MESSAGES.TYPE.NOTIFICATION;
        this.msgStruct.subject = MESSAGES.SUBJECT.TODO_CHANGED;

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