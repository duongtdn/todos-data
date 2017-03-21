"use strict"

import { getTime } from '../util'
import auth from '../auth-services'
import db from '../data-services'

import messages, {TEMPLATE, MESSAGES} from '../messages'

import { TASKGROUP } from './constants'

/* action creators */
export const taskGroup = {

  /* synchronous actions */

  update(data) {
    return {
      type    : TASKGROUP.UPDATE,
      payload : {
        data
      }
    }
  },


  /* asynchronous actions */

  create({name = '', members = [], color = ''}) {

    return dispatch => {

      return new Promise((resolve, reject) => {
        /* validate some requirement */
        if (!auth.currentUser) {
          reject('User is not signed in');
        }

        if (name.length === 0) {
          reject('Name is missing');
        }

         /* add new group into db and send invitation message */
        const uid = auth.currentUser.uid;
        const updates = {};
        const taskGroupId = db.taskGroup.push().key;
        const stakeholders = [];

        stakeholders.push({
          id : uid,
          role : 'owner',
        });

        if (members.length > 0) {
          members.forEach( userId => {
            const message = messages.template(TEMPLATE.INVITE_GROUP).create({
              receivers : [userId],
              content   : name,
              taskGroup : taskGroupId
            });
            const msgKey = db.users.child(userId).child('msg').push().key;
            message.id = msgKey;
            updates[`users/${userId}/msg/${msgKey}`] = {...message};
            stakeholders.push({
              id : userId,
              role : 'member',
            });
          });
        }

        const timestamp = getTime();
        updates[`group/${taskGroupId}`] = {
          id : taskGroupId,
          name : name,
          members : stakeholders,
          color : color,
          createdAt : timestamp
        }

        // update
        return db.root.update(updates).then(() => {
          resolve();
        }).catch(err => reject(err));
          
      });

    }

  }

}