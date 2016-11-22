"use strict"

import { FILTER } from './constants'

export function filter (state = {}, action) {
  const newState = {...state};

  switch (action.type) {

    case FILTER.APPLY :
      return action.payload;

    default :
      return state;
  }
}