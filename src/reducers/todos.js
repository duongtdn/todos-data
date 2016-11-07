"use strict"

import { TODOS } from '../actions';
import { STATUS } from '../constants';

let key = 1;

function autokey() {
  return key++;
} 

export function todos (state = {}, action) {
  
  const newState = {...state};

  switch (action.type) {

    case TODOS.COMPLETE :
      Object.keys(newState).forEach(id => {
        if (id === action.payload.id) {
          newState[id].status = STATUS.COMPLETED;
          newState[id].completedBy = action.payload.completedBy;
          newState[id].completedAt = action.payload.completedAt;
        }
      });
      return newState;

    case TODOS.CANCEL :
    // todo: change to asyn remove on firebase
      Object.keys(newState).forEach(id => {
        if (id === action.payload.id) {
          newState[id] = null;
        }
      });
      return newState;
    
    case TODOS.UPDATE :
      return action.payload.data;

    default :
      return state;
  
  } // end switch
}
