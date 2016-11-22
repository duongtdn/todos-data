"use strict"

import { FILTER } from './constants'

/* action creater */
export const filter = {
  apply(condition) {
    return {
      type    : FILTER.APPLY,
      payload : { condition }
    }
  }
}