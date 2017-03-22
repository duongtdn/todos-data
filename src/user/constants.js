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
  FRIENDS       : {
    UPDATE      : 'user.friends.update'
  },
  ACCOUNT       : {
    UPDATE      : 'user.account.update'
  },
  GROUPS       : {
    UPDATE      : 'user.groups.update'
  },
  
  /* asynchronous actions */
  SIGNUP        : 'user.signup',
  SIGNIN        : 'user.signin',
  SIGNOUT       : 'user.signout',
  LOAD          : 'user.load',
  UPDATE        : 'user.update',
}