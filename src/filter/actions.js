"use strict"

import { FILTER } from './constants'

/* action creater */
export const filter = {
  apply({hideCompletion = false}) {
    return {
      type    : FILTER.APPLY,
      payload : { hideCompletion }
    }
  }
}