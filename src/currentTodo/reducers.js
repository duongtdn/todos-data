"use strict"

import { CURRENT_TODO } from './constants'

export function currentTodo (state = {}, action) {

  switch (action.type) {

    case CURRENT_TODO.UPDATE :
      return action.payload;

    default :
      return state;
  }
}