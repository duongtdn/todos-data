"use strict"

import { getTime } from './util'
import auth from './auth-services';
import db from './data-services';

import { STATUS, TYPE, SUBJECT, COLLABORATOR } from './constants'; 

export default {
  
  send ({to = '', type = '', subject = 'none', content = ''}) {
    const user = auth.currentUser;
    const msgRef = db.users.child(to).child('msg').push();
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
       need to check whether collaborator is already invited before invoke this 
       function
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
    return msgRef.key;
  },

  acceptTodo (msgId, msg = null) {
    const user = auth.currentUser;
    // check permission, message type and subject
    if (!msg.to || msg.to !== user.uid) {
      throw 'Permission denied';
    }    
    if (!msg.type || msg.type !== TYPE.NOTIFICATION) {
      throw 'Invalid message';
    }
    if (!msg.subject || msg.subject !== SUBJECT.SHARE_TODO) {
      throw 'Invalid message';
    } 
    const todoId = msg.content; 
    if (todoId) {
      // update role in todo and add todo into user todos list
      db.todos.child(todoId).child('users').child(user.uid).set(COLLABORATOR);
      db.users.addTodo(todoId, {status : STATUS.ACTIVE, role : COLLABORATOR});
      // delete message
      db.users.child(user.uid).child('msg').child(msgId).set(null);
    }
  
  },  

}