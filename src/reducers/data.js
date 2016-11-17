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

    case DATA.UPLOADING :
    case DATA.UPLOADED  :
      if (!newState[action.payload.node]) {
        newState[action.payload.node] = {};
      }
      newState[action.payload.node].isUploading = action.payload.isUploading;
      return newState;

    default :
      return state;
  }

}