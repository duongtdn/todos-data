"use strict"

import { DATA } from '../actions';

export function data (state = {}, action) {
  
  const newState = {...state};

  switch (action.type) {

    case DATA.REQUEST :
    case DATA.RECEIVED :
      if (!newState[action.payload.node]) {
        newState[action.payload.node] = {};
      }
      newState[action.payload.node].isFetching = action.payload.isFetching;
      return newState;


    default :
      return state;
  }

}