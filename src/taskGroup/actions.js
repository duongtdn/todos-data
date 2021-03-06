"use strict"

import { getTime } from '../util'
import auth from '../auth-services'
import db from '../data-services'

import messages, {TEMPLATE, MESSAGES} from '../messages'

import { TASKGROUP } from './constants'

const COLLABORATOR = 'collaborator';
const STATUS = {
  PENDING   : 'pending',
  COMPLETED : 'completed',
  CANCELLED : 'cancelled',
  CLEANED   : 'cleaned',
  LISTING   : 'listing'
}

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
          // I need to load the list from server
          db.root.child(`groups/${taskGroupId}`).once('value').then( snap => {
            if (snap.exists()) {
              const group = snap.val();
              // accept list and clean up message
              updates[`groups/${taskGroupId}/members/${uid}/status`] = 'accepted';
              updates[`users/${uid}/groups/${taskGroupId}`] = {color, role : 'member'};
              updates[`users/${uid}/msg/${message.id}`] = null;
              // also update for todos under group
              for (let todoId in group.todos) {
                updates[`todos/${todoId}/share/${uid}/status`] = 'accepted';
                updates[`users/${uid}/todos/${todoId}`] = {status : STATUS.LISTING, role : COLLABORATOR};
              }
              // update
              return db.root.update(updates).then(() => {
                resolve();
              }).catch(err => reject(err));
            } else {
              reject('cannot load to-do list')
            }
          });                  
        }     
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
          db.root.child(`groups/${taskGroupId}`).once('value').then( snap => {
            if (snap.exists()) {
              const group = snap.val();
              updates[`groups/${taskGroupId}/members/${uid}`] = null;
              updates[`users/${uid}/msg/${message.id}`] = null;
              // also self-remove from the share list
              for (let todoId in group.todos) {
                updates[`todos/${todoId}/share/${uid}`] = null;
              }
              // update
              return db.root.update(updates).then(() => {
                resolve();
              }).catch(err => reject(err));
            } else {
              reject('cannot load to-do list')
            }
          });
        }        
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
        let owner = null;
        for (let id in members) {
          const usr = members[id];
          if (usr.role === 'owner') {
            owner = usr.id;
          }
        }
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
            // also invite for all todos from the list
            for (let todoId in group.todos) {
              updates[`todos/${todoId}/share/${id}`] = {
                status : `invited`,
                role : COLLABORATOR,
                name : member.name,
                id : member.id
              };
            }

          } else if (member && member.status === 'unshared') {
            if (id !== uid) {
              // send an info message to user whom removed from the list
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
              const message = messages.template(TEMPLATE.LEFT).create({
                receivers : [owner],
                content   : group.name,
                taskGroup : group.id
              });
              const msgKey = db.users.child(owner).child('msg').push().key;
              message.id = msgKey;
              updates[`users/${owner}/msg/${msgKey}`] = {...message};
            }
            // also, remove user in share list
            members[id] = null;
            // and remove in share list of each todo under this list
            for (let todoId in group.todos) {
              updates[`todos/${todoId}/share/${id}`] = null;
            }
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
        const receivers = [];
        // get a list of invited user, then recall all invited mesages
        for (let id in group.members) {
          if (id === uid) { continue; }
          const user = group.members[id];
          if ((/invited/i).test(user.status)) {
            stakeholders.push(user);
          } else {
            receivers.push(user);
          }
        }

        if (stakeholders.length > 0) {
          stakeholders.forEach(user => {
            const [status, msgId] = user.status.split('.');
            updates[`users/${user.id}/msg/${msgId}`] = null;
          });
        }

        if (receivers.length > 0) {
          receivers.forEach(user => {
            const message = messages.template(TEMPLATE.DELETE_GROUP).create({
              receivers : [user.id],
              content   : group.name,
              taskGroup : group.id,
            });
            const msgKey = db.users.child(user.id).child('msg').push().key;
            message.id = msgKey;
            updates[`users/${user.id}/msg/${msgKey}`] = {...message};
          });
        }

        // delete group in db and user list
        updates[`groups/${group.id}`] = null;
        updates[`users/${uid}/groups/${group.id}`] = null;

        // changed: delete all todos under this group
        if (group.todos) {
          for (let id in group.todos) {
            updates[`todos/${id}`] = null;
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