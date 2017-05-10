"use strict"

import { getTime } from './util'
import auth from './auth-services'
import db from './data-services'

export const TEMPLATE = {
  INVITE_TODO    : 'inviteTodo',
  COMPLETE_TODO  : 'completeTodo',
  DELETE_TODO    : 'deleteTodo',
  CHANGE_TODO    : 'changeTodo',
  UNDO_COMPLETED : 'undoCompleted',
  UNSHARE        : 'unshareTodo',
  INVITE_GROUP   : 'inviteGroup'
};

export const MESSAGES = {
  STATUS : {
    UNREAD          : 'unread'
  },
  TYPE : {
    ALERT           : 'alert',
    CONFIRM         : 'confirm'
  },
  SUBJECT: {
    SHARE_TODO          : 'todo.share',
    TODO_CHANGED        : 'todo.changed',
    TODO_COMPLETED      : 'todo.completed',
    TODO_DELETED        : 'todo.deleted',
    TODO_UNDO_COMPLETED : 'todo.undoCompleted',
    UNSHARE             : 'todo.unshare',
    INVITE_GROUP        : 'taskGroup.invite'
  },
  CATEGORY  : {
    SYSTEM          : 'system',
    NOTIFICATION    : 'notification'
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
    category  : '',
    subject   : '',
    content   : '',
    todo      : '',
    taskGroup : ''
  },
  
  template(name) {
    /* clean message struct before create new */
    this._clear();
    
    switch (name) {
      
      case TEMPLATE.INVITE_TODO :

        this.msgStruct.type = MESSAGES.TYPE.CONFIRM;
        this.msgStruct.category = MESSAGES.CATEGORY.NOTIFICATION;
        this.msgStruct.subject = MESSAGES.SUBJECT.SHARE_TODO;

        return this;

      case TEMPLATE.COMPLETE_TODO :

        this.msgStruct.type = MESSAGES.TYPE.ALERT;
        this.msgStruct.category = MESSAGES.CATEGORY.NOTIFICATION;
        this.msgStruct.subject = MESSAGES.SUBJECT.TODO_COMPLETED;

        return this;

       case TEMPLATE.DELETE_TODO :

        this.msgStruct.type = MESSAGES.TYPE.ALERT;
        this.msgStruct.category = MESSAGES.CATEGORY.NOTIFICATION;
        this.msgStruct.subject = MESSAGES.SUBJECT.TODO_DELETED;

        return this;

      case TEMPLATE.CHANGE_TODO :

        this.msgStruct.type = MESSAGES.TYPE.ALERT;
        this.msgStruct.category = MESSAGES.CATEGORY.NOTIFICATION;
        this.msgStruct.subject = MESSAGES.SUBJECT.TODO_CHANGED;

        return this;
      
      case TEMPLATE.UNDO_COMPLETED :

        this.msgStruct.type = MESSAGES.TYPE.ALERT;
        this.msgStruct.category = MESSAGES.CATEGORY.NOTIFICATION;
        this.msgStruct.subject = MESSAGES.SUBJECT.TODO_UNDO_COMPLETED;

        return this;

      case TEMPLATE.UNSHARE :

        this.msgStruct.type = MESSAGES.TYPE.ALERT;
        this.msgStruct.category = MESSAGES.CATEGORY.NOTIFICATION;
        this.msgStruct.subject = MESSAGES.SUBJECT.UNSHARE;

        return this;

      case TEMPLATE.INVITE_GROUP :
        this.msgStruct.type = MESSAGES.TYPE.CONFIRM;
        this.msgStruct.category = MESSAGES.CATEGORY.NOTIFICATION;
        this.msgStruct.subject = MESSAGES.SUBJECT.INVITE_GROUP;
        return this;



      default :
        return this;
    }

  },


  create ({receivers = null, type = null, subject = null, content = null, todo = null, taskGroup = null}) {
    
    const uid = auth.currentUser.uid;
    this.msgStruct.status = MESSAGES.STATUS.UNREAD;
    this.msgStruct.from = {id: uid, name: auth.currentUser.displayName, email: auth.currentUser.email.toLowerCase()};
    this.msgStruct.createdAt = getTime();
    // need to validate to makesure receiver list is array 
    if (receivers) {
      this.msgStruct.to = [...receivers];
    }
    if (type !== null) {
      this.msgStruct.type = type;
    }
    if (subject !== null) {
      this.msgStruct.subject = subject;
    }
    if (content !== null) {
      this.msgStruct.content = content;
    }
    if (todo !== null) {
      this.msgStruct.todo = todo;
    }
    if (taskGroup !== null) {
      this.msgStruct.taskGroup = taskGroup;
    }

    return this.msgStruct;
  },


  _clear() {
    this.msgStruct = {
      id        : '',
      status    : '',
      from      : '',
      to        : [],
      createdAt : null,
      type      : '',
      category  : '',
      subject   : '',
      content   : '',
      todo      : '',
      taskGroup : ''
    };
    return this;
  },

}
