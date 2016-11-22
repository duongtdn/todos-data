"user strict"

import { combineReducers } from 'redux'
import { USER } from './constants'


function auth (state = {}, action) {

  switch (action.type) {

    case USER.AUTH.UPDATE :
      return action.payload.user;
    
    default :
      return state;
  
  }
}

function messages (state = {}, action) {

  switch (action.type) {

    case USER.MESSAGES.UPDATE :
      return action.payload.messages;

    default :
      return state;

  }
}

function friends (state = {}, action) {
  switch (action.type) {

    case USER.FRIENDS.UPDATE :
      return action.payload.friends;

    default :
      return state;

  }  
}

function todos (state = {}, action) {

  switch (action.type) {

    case USER.TODOS.UPDATE :
      return action.payload.todos;

    default :
      return state;

  }
}

export const user = combineReducers({
  auth,
  messages,
  friends,
  todos,
});