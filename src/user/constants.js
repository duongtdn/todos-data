"use strict"

/* action types */
export const USER = {

  AUTH          : {
    /* synchronous actions */
    UPDATE      : 'user.auth.update'
  },
  MESSAGES     : {
    /* synchronous actions */
    UPDATE      : 'user.messages.update'
  },
  TODOS         : {
    /* synchronous actions */
    UPDATE      : 'user.todos.update'
  },
  
  /* asynchronous actions */
  SIGNIN        : 'user.signin',
  SIGNOUT       : 'user.signout',
  LOAD          : 'user.load',
  UPDATE        : 'user.update',
}