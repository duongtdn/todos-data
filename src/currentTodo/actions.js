"use strict"

import { CURRENT_TODO } from './constants'

/* action creater */
export const currentTodo = {
  update(todo) {
    return {
      type    : CURRENT_TODO.UPDATE,
      payload : todo
    }
  }
}