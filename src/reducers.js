"use strict"

import { combineReducers } from 'redux'

import { todos } from './reducers/todos';
import { data } from './reducers/data';

export default combineReducers({
  todos : todos,
  data  : data
})