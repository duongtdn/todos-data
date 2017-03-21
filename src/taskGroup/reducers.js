"use strict"

import { TASKGROUP } from './constants'

export function taskGroup (state = {}, action) {

  const newState = {...state};

  switch (action.type) {

    case TASKGROUP.UPDATE :
      return action.payload.data;

    default :
      return state;

  } // end switch
}