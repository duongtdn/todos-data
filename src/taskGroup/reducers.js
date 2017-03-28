"use strict"

import { TASKGROUP } from './constants'

export function taskGroup (state = {}, action) {

  const newState = {...state};

  switch (action.type) {

    case TASKGROUP.UPDATE :
      return {...action.payload.data}; // because the taskGroups object is in 
                                       // data-services db.taskGroup.get function
                                       // is mutated, I need return new object
                                       // to get mapStateToProps executed
    default :
      return state;

  } // end switch
}