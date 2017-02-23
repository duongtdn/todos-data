"use strict"

import { CONNECTION } from './constants'

export function connection(state = {}, action) {
  const newState = {...state};

  switch (action.type) {

    case CONNECTION.UPDATE : 
      return action.payload.data;
      
    default :
      return state;

  }
} 