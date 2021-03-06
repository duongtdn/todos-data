"use strict"

/* action types */
export const TODOS = {
  /* synchronous actions */
  UPDATE    : 'todos.update',
  /* asynchronous actions */
  FETCH     : 'todos.fetch',
  ADD       : 'todos.add',
  DELETE    : 'todos.delete',
  COMPLETE  : 'todos.complete',
  SHARE     : 'todos.share',
  ACCEPT    : 'todos.accept',
  DECLINE   : 'todos.decline',
  EDIT      : 'todos.edit',
  UNDO_COMPLETE : 'todo.undoComplete'
}

/* Other constants */
export const STATUS = {
  PENDING   : 'pending',
  COMPLETED : 'completed',
  CANCELLED : 'cancelled',
  CLEANED   : 'cleaned',
  LISTING   : 'listing'
}

export const OWNER = 'owner';
export const COLLABORATOR = 'collaborator';
