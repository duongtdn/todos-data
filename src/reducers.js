"use strict"

import { combineReducers } from 'redux'

import { todos } from './todos/reducers'
import { user } from './user/reducers'
import { data } from './data/reducers'
import { error } from './error/reducers'
import { filter } from './filter/reducers'
import { search } from './search/reducers'

export default combineReducers({
  todos  : todos,
  user   : user,
  data   : data,
  error  : error,
  filter : filter,
  search : search
})