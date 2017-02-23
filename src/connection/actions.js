"use strict"

import { CONNECTION } from './constants'

import db from '../data-services'

export const connection = {
  
  /* synchronous action */
  update(data) {
    return {
      type    : CONNECTION.UPDATE,
      payload : { data }
    }
  },

  /* asynchronous action */
  check() {
    return dispatch => {
      return new Promise((resolve, reject) => {
        const connectedRef = db.ref(".info/connected");
        connectedRef.on("value", function(snap) {
          if (snap.val() === true) {
            resolve();
          } else {
            reject()
          }
        });
      });
    }
  },


}
