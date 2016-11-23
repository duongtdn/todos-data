"use strict"

import { SEARCH } from './constants'

export function search(state = {}, action) {
  const newState = {...state};

  switch (action.type) {

    case SEARCH.UPDATE : 
      return action.payload.data;
      
    default :
      return state;

  }
} 