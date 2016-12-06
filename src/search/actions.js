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
  apply(query) {
    return dispatch => {
      return new Promise((resolve, reject) => {
        _searchUserByEmail(query, data => {
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

function _searchUserByEmail (email, callback) {
  db.usersList.orderByChild('email').equalTo(email)
    .on('child_added', snap => {
      callback(snap.val());
    });
}