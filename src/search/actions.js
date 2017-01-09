"use strict"

import { SEARCH } from './constants'

import db from '../data-services'

export const search = {
  
  /* synchronous action */
  update(data) {
    return {
      type    : SEARCH.UPDATE,
      payload : { data }
    }
  },

  /* asynchronous action */
  apply(key, value) {
    return dispatch => {
      return new Promise((resolve, reject) => {
        _searchUser(key, value, data => {
          dispatch(this.update(data));
          resolve(data);
        })
      });
    }
  },

  clear() {
    return dispatch => {
      dispatch(this.update(null));
    }
  }

}

function _searchUser (key, value, callback) {
  db.usersList.orderByChild(key).equalTo(value)
    .on('child_added', snap => {
      callback(snap.val());
    });
}