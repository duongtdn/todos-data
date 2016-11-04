"use strict"

/* action types */
export const DATA = {
  REQUEST : 'data.request',
  RECEIVED : 'data.receive'
}

/* action creators */
export const data = {

  request(node) {
    return {
      type    : DATA.REQUEST,
      payload : {
        node        : node,
        isFetching  : true
      }
    }
  },

  received (node) {
    return {
      type    : DATA.RECEIVED,
      payload : {
        node        : node,
        isFetching  : false
      }
    }
  },

}
