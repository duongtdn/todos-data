"use strict"

/* action types */
export const ERROR = {
  /* synchronous actions */
  UPDATE        : 'error.update',
  CLEAR         : 'error.clear'
}

/* Other constants */
export const ECODE = {
  SIGNIN              : 'error.signIn',
  SIGNOUT             : 'error.signOut',
  NOT_AUTHEN          : 'error.notAuthen',
  PERMISSION_DENINED  : 'error.denied',
  INVALID             : 'error.invalid',
  INVALID_EMAIL       : 'error.invalidEmail',
  INVALID_PASSWORD    : 'error.invalidPassword'
}