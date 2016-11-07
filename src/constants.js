"use strict"

export const STATUS = {
  ACTIVE    : 'active',
  COMPLETED : 'completed',
  CANCELLED : 'cancelled'
}

export const ERROR = {
  SIGNIN      : 'error.signIn',
  SIGNOUT     : 'error.signOut',
  NOT_AUTHEN  : 'error.notAuthen'
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

export const OWNER = 'owner';

export const NODE_TODOS = 'listTodos';
export const NODE_USER  = 'userDATA';