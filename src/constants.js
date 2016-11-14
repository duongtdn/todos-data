"use strict"

export const STATUS = {
  ACTIVE    : 'active',
  COMPLETED : 'completed',
  CANCELLED : 'cancelled',
  UNREAD    : 'unread'
}

export const ERROR = {
  SIGNIN              : 'error.signIn',
  SIGNOUT             : 'error.signOut',
  NOT_AUTHEN          : 'error.notAuthen',
  PERMISSION_DENINED  : 'error.denied',
  INVALID             : 'error.invalid'
}

export const SHOW = {
  ALL       : 'all',
  ACTIVE    : 'active',
  COMPLETED : 'completed'
}

export const FETCH = {
  FETCHING  : 'fetching',
  SUCCESS   : 'success',
  FAILURE   : 'failure'
}

export const TYPE = {
  NOTIFICATION : 'notification'
}

export const SUBJECT = {
  SHARE_TODO   : 'todo.share'
}

export const OWNER = 'owner';
export const COLLABORATOR = 'collaborator';

export const NODE_TODOS = 'listTodos';
export const NODE_USER  = 'userDATA';