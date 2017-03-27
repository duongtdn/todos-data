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
        const stakeholders = {};

        stakeholders[uid] = {
          id : uid,
          role : 'owner',
          status : 'accepted'
        };

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
            stakeholders[userId] = {
              id : userId,
              role : 'member',
              status : `invited.${msgKey}`
            };
          });
        }

        const timestamp = getTime();
        updates[`groups/${taskGroupId}`] = {
          id : taskGroupId,
          name : name,
          members : stakeholders,
          color : color,
          createdAt : timestamp
        }

        // also add to user task group list
        updates[`users/${uid}/groups/${taskGroupId}`] = {color : color, role : 'owner'};
        // update
        return db.root.update(updates).then(() => {
          resolve();
        }).catch(err => reject(err));
          
      });

    }

  },

  accept(color, message) {
    return dispatch => {
      return new Promise((resolve, reject) => {
        const uid = auth.currentUser.uid;
        const taskGroupId = message.taskGroup;
        const updates = {};
        if (taskGroupId) {
          updates[`groups/${taskGroupId}/members/${uid}/status`] = 'accepted';
          updates[`users/${uid}/groups/${taskGroupId}`] = {color, role : 'member'};
          updates[`users/${uid}/msg/${message.id}`] = null;
        }
        // update
        return db.root.update(updates).then(() => {
          resolve();
        }).catch(err => reject(err));
      });
    }
  },

  decline(message) {
    return dispatch => {
      return new Promise((resolve, reject) => {
        const uid = auth.currentUser.uid;
        const taskGroupId = message.taskGroup;
        const updates = {};
        if (taskGroupId) {
          updates[`groups/${taskGroupId}/members/${uid}`] = null;
          updates[`users/${uid}/msg/${message.id}`] = null;
        }
        // update
        return db.root.update(updates).then(() => {
          resolve();
        }).catch(err => reject(err));
      })
    }
  },

  fetch() {
    return dispatch => {
      return new Promise((resolve, reject) => {
        db.users.getTaskGroupList(list => {
          db.taskGroup.get(list, groups => {
            if (groups) {
              dispatch(taskGroup.update(groups));
              resolve(groups);
            } else {
              reject();
            }
          });
        });
      });
    }
  },

  edit(group) {
    return dispatch => {
      return new Promise((resolve, reject) => {
        /* validate some requirement */
        if (!auth.currentUser) {
          reject('User is not signed in');
        }

        if (!group.id || group.id.length === 0) {
          reject('This Task group does not exist');
        }

        if (group.name.length === 0) {
          reject('Name is missing');
        }

        if (group.members.length === 0) {
          reject('No members for this Task group');
        }

        const uid = auth.currentUser.uid;
        const updates = {};
        // send invite message for inviting member
        const members = {...group.members};
        console.log(members)
        for (let id in members) {
          const member = members[id];
          if (member && member.status === 'invited') {
            const message = messages.template(TEMPLATE.INVITE_GROUP).create({
              receivers : [id],
              content   : group.name,
              taskGroup : group.id
            });
            const msgKey = db.users.child(id).child('msg').push().key;
            message.id = msgKey;
            updates[`users/${id}/msg/${msgKey}`] = {...message};
            member.status =  `invited.${msgKey}`;
          } else if (member && member.status === 'unshared') {
            if (id !== uid) {
              // send a info message to user whom removed from the list
              const message = messages.template(TEMPLATE.UNSHARE).create({
                receivers : [id],
                content   : group.name,
                taskGroup : group.id
              });
              const msgKey = db.users.child(id).child('msg').push().key;
              message.id = msgKey;
              updates[`users/${id}/msg/${msgKey}`] = {...message};
            }
            // also, remove user in share list
            members[id] = null;
          } else if (member && /recall/i.test(member.status)) {
            // and recall invited message if any
            const [status, msgId] = member.status.split('.');
            if (msgId) {
              updates[`users/${id}/msg/${msgId}`] = null;
              // also, remove user in share list
              members[id] = null;
            }
          }
          // we don't need to store member name
          if (members[id]) { 
            members[id].name = null;
          }
        }

        for (let key in group) {
          if (key === 'members') { continue }
          updates[`groups/${group.id}/${key}`] = group[key];
        }

        updates[`groups/${group.id}/members`] = members;

        // update
        return db.root.update(updates).then(() => {
          resolve();
        }).catch(err => reject(err));

      });
    }
  }

}