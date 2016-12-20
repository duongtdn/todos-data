"use strict"

import { FILTER } from './constants'

export function filter (state = {}, action) {

  switch (action.type) {

    case FILTER.APPLY :
      return action.payload;

    default :
      return state;
  }
}