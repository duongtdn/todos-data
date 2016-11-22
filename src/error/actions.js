"use strict"

import { ERROR } from './constants'

/* action creators */
export const error = {

  update(code, err) {
    return {
      type    : ERROR.UPDATE,
      payload : { code, err }
    }
  },

  clear(code) {
    return {
      type    : ERROR.CLEAR,
      payload : { code }
    }
  }

}
