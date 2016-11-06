"user strict"

import { USER } from '../actions'

export function user (state = {}, action) {
  
  const newState = {...state};

  switch (action.type) {

    case USER.UPDATE : 
      return action.payload.user;

    default :
      return state;

  }

}