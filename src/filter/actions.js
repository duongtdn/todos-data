"use strict"

import { FILTER } from './constants'

/* action creater */
export const filter = {
  apply(group) {
    return {
      type    : FILTER.APPLY,
      payload : group
    }
  }
}