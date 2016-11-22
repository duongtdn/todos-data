"use strict"

import { combineReducers } from 'redux'

import { todos } from './todos/reducers';
import { user } from './user/reducers';
import { data } from './data/reducers';
import { error } from './error/reducers';

export default combineReducers({
  todos : todos,
  user  : user,
  data  : data,
  error : error
})