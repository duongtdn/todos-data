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

  create({name = '', members = {}, color = ''}) {

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
          id: uid,
          role: 'owner',
          name: auth.currentUser.email,
          status: 'accepted'
        };

        if (Object.keys(members).length > 0) {
          for (let userId in members) {
            if (userId === uid) { continue }
            const member = members[userId];
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
              name : members[userId].name,
              role : 'member',
              status : `invited.${msgKey}`
            };
          }
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
            } else {
              // send a message notifying the onwer that you has left group

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
  },

  delete(group) {
    return dispatch => {
      return new Promise((resolve, reject) => {
        /* validate some requirement */
        if (!auth.currentUser) {
          reject('User is not signed in');
        }
        if (!group || !group.id || group.id === '_0_') {
          reject('No Task Group');
        }

        const uid = auth.currentUser.uid;
        const updates = {};
        const stakeholders = [];

        // get a list of invited user, then recall all invited mesages
        for (let id in group.members) {
          const user = group.members[id];
          if ((/invited/i).test(user.status)) {
            stakeholders.push(user);
          }
        }

        if (stakeholders.length > 0) {
          stakeholders.forEach(user => {
            const [status, msgId] = user.status.split('.');
            updates[`users/${user.id}/msg/${msgId}`] = null;
          });
        }

        // delete group in db and user list
        updates[`groups/${group.id}`] = null;
        updates[`users/${uid}/groups/${group.id}`] = null;

        // set all todos under this group as no group
        if (group.todos) {
          for (let id in group.todos) {
            updates[`todos/${id}/group`] = null;
          }
        }
        
        // update
        return db.root.update(updates).then(() => {
          resolve();
        }).catch(err => reject(err));

      });
    }
  }

}