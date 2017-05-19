"use strict"

import { getTime } from '../util'
import db from '../data-services'
import auth from '../auth-services'
import { data } from '../data/actions'
import { DNODE } from '../data/constants'
import { error } from '../error/actions'
import { ECODE } from '../error/constants'
import messages, {TEMPLATE, MESSAGES} from '../messages'
import { TODOS, STATUS, OWNER, COLLABORATOR } from './constants'

/* action creators */

export const todos = {

  /* synchronous actions */

  update(data) {
    return {
      type    : TODOS.UPDATE,
      payload : {
        data
      }
    }
  },

  /* asynchronous actions */

  fetch() {

    return dispatch => {
        
        // First dispatch: the app state is updated to inform
        // that the API call is starting.
        dispatch(data.request(DNODE.TODOS));
        
        // The function called by the thunk middleware can return a value,
        // that is passed on as the return value of the dispatch method.
        return new Promise((resolve, reject) => {
          db.users.getTodosList( list => {
            db.todos.get(list, todosList => {
              dispatch(todos.update(todosList));
              dispatch(data.received(DNODE.TODOS));
              resolve(todosList);
            });
          });
        });
        

      };
  },

  add({text = '', share = {}, urgent = false, dueDate = '', group = null}) {

    return (dispatch, getState) => {
      if (auth.currentUser) {
        const uid = auth.currentUser.uid;
        const updates = {};
        const todoId = db.todos.push().key;
        const stakeholders = {};
        
        // prepare invitation messages
        // get group
        let taskGroup = '';
        if (group && group.updated && group.updated !== '_0_') {
          taskGroup = group.updated;
          updates[`groups/${taskGroup}/todos/${todoId}`] = true;
        }
        const list = taskGroup.length > 0? getState().taskGroup[taskGroup] : null;
        if (share.length > 0) {
          share.forEach(user => {
            if (user.id === uid) { return }
            /* send invitation messages 
                Issue:, if message is sent to user who are inviting to the 
                group, then user may decline the group but still accept the
                message, then can access to to-do -> cause bug
                Solution: only send message to accepted people
            */   
            if ((list === null) || 
                (list && list.members[user.id] && list.members[user.id].status === 'accepted')) {
              const message = messages.template(TEMPLATE.INVITE_TODO).create({
                receivers : [user.id],
                content   : text,
                todo      : todoId,
                taskGroup : taskGroup,
              });
              const msgKey = db.users.child(user.id).child('msg').push().key;
              message.id = msgKey;
              updates[`users/${user.id}/msg/${msgKey}`] = {...message};
              // user share info
              stakeholders[user.id] = {
                status : `invited.${msgKey}`,
                role : COLLABORATOR,
                name : user.name,
                id : user.id
              };  
            } else if(list && list.members[user.id] && /invited/.test(list.members[user.id].status)) {
              // user share info
              stakeholders[user.id] = {
                status : `invited`,
                role : COLLABORATOR,
                name : user.name,
                id : user.id
              }; 
            }
          });          
        }          
        // prepare todo
        stakeholders[uid] = {
          status : 'accepted',
          role : OWNER,
          name : auth.currentUser.email,
          id : uid
        };
        

        const timestamp = getTime();
        updates[`todos/${todoId}`] = {
          id          : todoId,
          text        : text,
          share       : stakeholders,
          createdAt   : timestamp,
          status      : STATUS.PENDING,
          completedBy : '',
          completedAt : '',
          urgent      : urgent,
          dueDate     : dueDate,
          group       : taskGroup
        }
        // prepare todo in user list
        updates[`users/${uid}/todos/${todoId}`] = {status : STATUS.LISTING, role : OWNER};
        // update
         _updateTodoAndUser (dispatch, updates);
        return todoId;
      } else {
        dispatch(error.update(ECODE.NOT_AUTHEN, {message : 'user is not signed in'}));
        return null;
      }
      
    }

  },

  delete(todo) {
    return dispatch => {
      if (auth.currentUser) {
        const updates = {};
        if (Object.prototype.toString.call(todo) === '[object Array]' ) {
          todo.forEach( t => this._delete(t, updates));
        } else {
          this._delete(todo,updates);
        }       
        // update
        _updateTodoAndUser (dispatch, updates);
      } else {
        dispatch(error.update(ECODE.NOT_AUTHEN, {message : 'user is not signed in'}));
      }
    }
  },

  /* change behavior in May 2017
     only owner can deleted message in db
     for collaborators, simply unshare them from the list, and remove from their
     own todo lists
  */
  _delete(todo, updates) {
    const uid = auth.currentUser.uid;

    if (todo.share[uid] === undefined || todo.share[uid] === null) {
      return;
    }

    if (todo.share[uid].role === 'owner') {
      const stakeholders = [];
      const receivers = [];
      // delete todo in todos at root and users, then recall all invited mesages
      // need a change in the way invited messages are sent, eg. invited.msgId

      // find all invited
      for (let id in todo.share) {
        if (id === uid) { continue; }
        const user = todo.share[id];
        if ((/invited/i).test(user.status)) {
          stakeholders.push(user);
        } else {
          receivers.push(user);
        }
      }
      // and then recall messages
      if (stakeholders.length > 0) {
        stakeholders.forEach(user => {
          const [status, msgId] = user.status.split('.');
          updates[`users/${user.id}/msg/${msgId}`] = null;
        });
      }
      // and notify accepted users
      if (todo.status !== 'completed') {
        receivers.forEach(user => {
          const message = messages.template(TEMPLATE.DELETE_TODO).create({
            receivers : [user.id],
            content   : todo.text,
            todo : todo.id
          });
          const msgKey = db.users.child(user.id).child('msg').push().key;
          message.id = msgKey;
          updates[`users/${user.id}/msg/${msgKey}`] = {...message};
        });
      }
      // delete in the root db
      updates[`todos/${todo.id}`] = null; 
      // and, remove todo in its group as well
      if (todo.group) {
        updates[`groups/${todo.group}/todos/${todo.id}`] = null;
      }
    } else {
      // for not owner, simply remove himself/herself from the share list
      updates[`todos/${todo.id}/share/${uid}`] = null;
      // also notify others if todo is not completed
      if (todo.status !== 'completed') {
        for (let id in todo.share) {
          if (id === uid) { continue; }
          const message = messages.template(TEMPLATE.LEFT).create({
            receivers : [id],
            content   : todo.text,
            todo : todo.id
          });
          const msgKey = db.users.child(id).child('msg').push().key;
          message.id = msgKey;
          updates[`users/${id}/msg/${msgKey}`] = {...message};
        }      
      }
    }
    
    // finally, remove todo from the own list
    updates[`users/${uid}/todos/${todo.id}`] = null;
  },

  complete(todo) {
    return dispatch => {
      const uid = auth.currentUser.uid;
      if (!uid) {
        dispatch(error.update(ECODE.NOT_AUTHEN, {message : 'user is not signed in'}));
        return null;
      }

      const updates = {};
      const stakeholders = [];
      for (let user in todo.share) {
        if (user !== uid) {
          stakeholders.push(user);
        }
      }
      // change status of todo as completed, then broadcast a message 
      // to all stakeholders if any
      updates[`todos/${todo.id}/status`] = STATUS.COMPLETED;
      updates[`todos/${todo.id}/completedBy`] = uid;
      updates[`todos/${todo.id}/completedAt`] = getTime();
      /*
      if (stakeholders.length > 0) {
        const message = messages.template(TEMPLATE.COMPLETE_TODO).create({
          receivers : stakeholders,
          content   : todo.id
        });
        stakeholders.forEach(user => {
          const msgKey = db.users.child(user).child('msg').push().key;
          message.id = msgKey;
          updates[`users/${user}/msg/${msgKey}`] = message;
        });
      }
      */
      // update
      _updateTodoAndUser (dispatch, updates);
    }
  },

  undoComplete(todo) {
    return dispatch => {
      const uid = auth.currentUser.uid;
      if (!uid) {
        dispatch(error.update(ECODE.NOT_AUTHEN, {message : 'user is not signed in'}));
        return null;
      }
      const updates = {};
      const stakeholders = [];
      for (let user in todo.share) {
        if (user !== uid) {
          stakeholders.push(user);
        }
      }
      // change status of todo as pending, then broadcast a message 
      // to all stakeholders if any
      updates[`todos/${todo.id}/status`] = STATUS.PENDING;
      updates[`todos/${todo.id}/completedBy`] = '';
      updates[`todos/${todo.id}/completedAt`] = '';
      /*
      if (stakeholders.length > 0) {
        const message = messages.template(TEMPLATE.UNDO_COMPLETED).create({
          receivers : stakeholders,
          content   : todo.id
        });
        stakeholders.forEach(user => {
          const msgKey = db.users.child(user).child('msg').push().key;
          message.id = msgKey;
          updates[`users/${user}/msg/${msgKey}`] = message;
        });
      }
      */
      // update
      _updateTodoAndUser (dispatch, updates);
    }
  },

  share({users = [], todo = {}}) {

    return dispatch => {

      const updates = {};
      // create an invitation message
      const message = messages.template(TEMPLATE.INVITE_TODO).create({
        receivers : users,
        content   : todo.text,
        todo      : todo.id
      });

      // prepare update
      users.forEach(user => {
        const msgKey = db.users.child(user).child('msg').push().key;
        message.id = msgKey;
        updates[`users/${user}/msg/${msgKey}`] = message;
        updates[`todos/${todo.id}/share/${user.id}`] = {
          status : 'invited',
          role : COLLABORATOR,
          name : user.name,
          id : user.id
        };
      });

      // update
     _updateTodoAndUser (dispatch, updates);
    }
    
  },

  accept(message) {
    return dispatch => {
      const uid = auth.currentUser.uid;
      _validateMessage(uid, message);
      const todoId = message.todo;
      const updates = {};
      if (todoId) {
        // update role in todo, add todo in user todo list, remove message
        updates[`todos/${todoId}/share/${uid}/status`] = 'accepted';
        updates[`users/${uid}/todos/${todoId}`] = {status : STATUS.LISTING, role : COLLABORATOR};
        updates[`users/${uid}/msg/${message.id}`] = null;
        // update
        _updateTodoAndUser (dispatch, updates);
      }  
    }
  },

  decline(message) {
    return dispatch => {
      const uid = auth.currentUser.uid;
      _validateMessage(uid, message);
      const todoId = message.todo;
      const updates = {};
      if (todoId) {
        // remove user in todo, remove message
        updates[`todos/${todoId}/share/${uid}`] = null;
        updates[`users/${uid}/msg/${message.id}`] = null;
        // update
        _updateTodoAndUser (dispatch, updates);
      }
    }
  },

  edit(todo) {
    return dispatch => {
      const uid = auth.currentUser.uid;
      if (!uid) {
        dispatch(error.update(ECODE.NOT_AUTHEN, {message : 'user is not signed in'}));
        return null;
      }

      if (todo.id === null) {
        return null;
      }
      const updates = {};
      const stakeholders = [];
      let group = ''; 
      if (todo.group) {
        if (todo.group.updated) {
          group = todo.group.updated !== '_0_' ? todo.group.updated  : '';
        } else if (todo.group.origin) {
          group = todo.group.origin !== '_0_' ? todo.group.origin  : '';
        }
      }   

      /* send notification messages & update share list
         change: if group (list) is used, only send invitation message to 
         accepted people so that auto accept will take place  */
      if (group.length === 0) {
        // no group
        for (let id in todo.share) {
          if (id === uid) { continue }
          const user = {...todo.share[id]};

          if (user && user.status === 'unshared') {
            if (user.id !== uid) {
              // send a info message to user whom removed from the list
              const message = messages.template(TEMPLATE.UNSHARE).create({
                receivers : [id],
                content   : todo.text,
                todo      : todo.id,
                taskGroup : group,
              });
              const msgKey = db.users.child(id).child('msg').push().key;
              message.id = msgKey;
              updates[`users/${id}/msg/${msgKey}`] = {...message};
            }
            // also, remove user in share list
            todo.share[id] = null;
          }

          if (user && /recall/i.test(user.status)) {          
            // and recall invited message if any
            const [status, msgId] = user.status.split('.');
            if (msgId) {
              updates[`users/${user.id}/msg/${msgId}`] = null;
              // also, remove user in share list
              todo.share[id] = null;
            }
          }
          
          if (user && user.status === 'invited') {
            // send invite message to whom invited
            const message = messages.template(TEMPLATE.INVITE_TODO).create({
              receivers : [user.id],
              content   : todo.text,
              todo      : todo.id,
              taskGroup : group,
            });
            const msgKey = db.users.child(user.id).child('msg').push().key;
            message.id = msgKey;
            todo.share[id].status = `invited.${msgKey}`;
            updates[`users/${user.id}/msg/${msgKey}`] = {...message};
          }
        }
 

      } else {
        // has a group
        for (let id in todo.share) {
          if (id === uid) { continue }
          const member = {...todo.share[id]};

          if (/unshared/.test(member.status)) {
            // send a info message to user whom removed from the list
            const message = messages.template(TEMPLATE.UNSHARE).create({
              receivers : [id],
              content   : todo.text,
              todo      : todo.id,
              taskGroup : group,
            });
            const msgKey = db.users.child(id).child('msg').push().key;
            message.id = msgKey;
            updates[`users/${id}/msg/${msgKey}`] = {...message};
            // also, remove user in share list if not invited
            if (!/invited/.test(member.status)) {
              todo.share[id] = null;
            }
          }

          if (/recall/.test(member.status)) {
            const [status, msgId] = member.status.split('.');
            if (msgId) {
              updates[`users/${member.id}/msg/${msgId}`] = null;
              // also, remove user in share list if only recall
              if (!/accepted/.test(member.status) || !/invited/.test(member.status)) {
                todo.share[id] = null;
              }  
            }
          }

          if (/accepted/.test(member.status)) {
            const message = messages.template(TEMPLATE.INVITE_TODO).create({
              receivers : [member.id],
              content   : todo.text,
              todo      : todo.id,
              taskGroup : group,
            });
            const msgKey = db.users.child(member.id).child('msg').push().key;
            message.id = msgKey;
            updates[`users/${member.id}/msg/${msgKey}`] = {...message};
            // user share info
            todo.share[id] = {
              status : `invited.${msgKey}`,
              role : COLLABORATOR,
              name : member.name,
              id : member.id
            };  
          }

          if (/invited/.test(member.status)) {
            // user share info
            todo.share[id] = {
              status : `invited`,
              role : COLLABORATOR,
              name : member.name,
              id : member.id
            };  
          }

        } 

      }
              
      // update group
      if (todo.group) {

        // update new group, if it is None we just simply set to null
        if (todo.group.updated) {
          // remove group of this todo, if it has origin group as we've changed it 
          // to new group or just has removed it
          if (todo.group.origin) {
            updates[`groups/${todo.group.origin}/todos/${todo.id}`] = null;
          }
        
          if (todo.group.updated === '_0_') {
            // then, simply remove this group
            updates[`todos/${todo.id}/group`] = null
          } else {
            // add this todo to the group as well
            updates[`groups/${todo.group.updated}/todos/${todo.id}`] = true;
            updates[`todos/${todo.id}/group`] = todo.group.updated;
          }
        }
      }


      for (let prop in todo) {
        if (prop !== 'id' && prop !== 'createdAt' && prop !== 'group') {
          updates[`todos/${todo.id}/${prop}`] = todo[prop];
        }        
      }  

      
/*
      if (Object.keys(updates).length > 0) {
        // send message to stakeholders to notify change
        if (stakeholders.length > 0) {
          const message = messages.template(TEMPLATE.CHANGE_TODO).create({
            receivers : stakeholders,
            content   : todo.text
          });
          stakeholders.forEach(user => {
            const msgKey = db.users.child(user).child('msg').push().key;
            message.id = msgKey;
            updates[`users/${user}/msg/${msgKey}`] = message;
          });
        }
      }
*/
      // update
      _updateTodoAndUser (dispatch, updates);

    }
  },

  cleanAll(todos) {
    return dispatch => {
      const uid = auth.currentUser.uid; 
      const updates = {};
      for (let id in todos) {
        if (todos[id].status === STATUS.COMPLETED) {
          updates[`users/${uid}/todos/${id}/status`] = STATUS.CLEANED;
        }
      }
      _updateUser(dispatch, updates);
    }
  },

  clean(todo) {
    return dispatch => {
      const uid = auth.currentUser.uid; 
      const updates = {};
      if (todos.status === STATUS.COMPLETED) {
        updates[`users/${uid}/todos/${todo.id}/status`] = STATUS.CLEANED;
      }
      _updateUser(dispatch, updates);
    }
  },

  uncleanAll(todos) {
    return dispatch => {
      const uid = auth.currentUser.uid; 
      const updates = {};
      for (let id in todos) {
          updates[`users/${uid}/todos/${id}/status`] = STATUS.LISTING;
      }
      _updateUser(dispatch, updates);
    }
  },

  unclean(todo) {
    return dispatch => {
      const uid = auth.currentUser.uid; 
      const updates = {};
      if (todos.status === STATUS.COMPLETED) {
        updates[`users/${uid}/todos/${todo.id}/status`] = STATUS.LISTING;
      }
      _updateUser(dispatch, updates);
    }
  }

}

function _updateTodoAndUser (dispatch, updates) {
    dispatch(data.uploading(DNODE.TODOS));
    dispatch(data.uploading(DNODE.USER));
    db.root.update(updates).then( () => {
      dispatch(data.uploaded(DNODE.TODOS));
      dispatch(data.uploaded(DNODE.USER));
    });
}

function _updateUser(dispatch, updates) {
    dispatch(data.uploading(DNODE.USER));
    db.root.update(updates).then( () => {
      dispatch(data.uploaded(DNODE.USER));
    });
}

function _validateMessage(uid, msg) {
  
  if (msg === null || msg === undefined) {
    throw ECODE.INVALID;
  }

  let checkUID = false;
  msg.to.forEach( usr => {
    if (usr === uid) {
      checkUID = true;
      return;
    }
  });
  if (!checkUID) {
    throw ECODE.PERMISSION_DENINED;
  }

  if (!msg.category || !msg.type || !msg.subject || !msg.content) {
    throw ECODE.INVALID;
  }

  return true;

}
