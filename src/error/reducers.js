"use strict"

import { ERROR } from './constants'

export function error (state = {}, action) {
  
  const newState = {...state};

  switch (action.type) {

    case ERROR.UPDATE : 
      newState[action.payload.code] = action.payload.err;
      return newState;

    case ERROR.CLEAR :
      newState[action.payload.code] = null;
      return newState;
      
    default :
      return state;

  }

}