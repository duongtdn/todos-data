"use strict"

import { getTime } from './util'
import auth from './auth-services';
import db from './data-services';

import { STATUS, TYPE, SUBJECT } from './constants'; 

export default {
  
  send ({to = '', type = '', subject = 'none', content = ''}) {
    const user = auth.currentUser;
    const msgRef = db.users.child(to).child('messages').push();
    msgRef.set({
      status    : STATUS.UNREAD,
      from      : user.uid,
      to        : to,
      createdAt : getTime(),
      type      : type,
      subject   : subject,
      content   : content 
    });
    return msgRef;
  },

  inviteTodo ({collaborator = '', todoId = ''}) {
    /* send invitation message
       need to check whether collaborator is already invited 
    */
    const msgRef = this.send({
      to      : collaborator,
      type    : TYPE.NOTIFICATION,
      subject : SUBJECT.SHARE_TODO,
      content : todoId
    });
    /* update collaborator in todo as invited */
    db.todos.child(todoId).child('users').child(collaborator)
      .set(`invited.${msgRef.key}`);
  }
}