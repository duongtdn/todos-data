"use strict"

/* action types */
export const ERROR = {
  /* synchronous actions */
  UPDATE        : 'error.update',
  CLEAR         : 'error.clear'
}

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
