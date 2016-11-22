"use strict"

import { FILTER } from './constants'

export function filter (state = {}, action) {
  const newState = {...state};

  switch (action.type) {

    case FILTER.APPLY :
      newState.hideCompletion = action.payload.condition.hideCompletion;
      return newState;

    default :
      return state;
  }
}