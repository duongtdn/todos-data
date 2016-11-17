"use strict"

/* action types */
export const DATA = {
  REQUEST     : 'data.request',
  RECEIVED    : 'data.receive',
  UPLOADING   : 'data.uploading',
  UPLOADED    : 'data.uploaded',
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

  uploading(node) {
    return {
      type    : DATA.UPLOADING,
      payload : {
        node        : node,
        isUploading : true
      }
    }
  },

  uploaded(node) {
    return {
      type    : DATA.UPLOADED,
      payload : {
        node        : node,
        isUploading : false
      }
    }
  },

}
