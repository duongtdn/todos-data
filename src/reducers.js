"use strict"

import { combineReducers } from 'redux'

import { todos } from './reducers/todos';
import { user } from './reducers/user';
import { data } from './reducers/data';
import { error } from './reducers/error';

export default combineReducers({
  todos : todos,
  user  : user,
  data  : data,
  error : error
})