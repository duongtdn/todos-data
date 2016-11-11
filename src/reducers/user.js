"user strict"

import { combineReducers } from 'redux'
import { USER } from '../actions'


function auth (state = {}, action) {

  switch (action.type) {

    case USER.UPDATE.AUTH :
      return action.payload.user;
    
    default :
      return state;
  
  }
}

function messages (state = {}, action) {

  switch (action.type) {

    case USER.UPDATE.MESSAGE :
      return action.payload.messages;

    default :
      return state;

  }
}

function todos (state = {}, action) {

  switch (action.type) {

    case USER.UPDATE.TODOS :
      return action.payload.todos;

    default :
      return state;

  }
}

export const user = combineReducers({
  auth,
  messages,
  todos
});