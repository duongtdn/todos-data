"use strict"

import { createStore, applyMiddleware } from 'redux';
import thunkMiddleware from 'redux-thunk';

import rootReducer from './reducers';
import * as action from './actions';

const store = createStore(
  rootReducer,
  applyMiddleware(
    thunkMiddleware
  )
);

console.log ('# Initial State');
console.log (store.getState());

const unsubscribe = store.subscribe( () => console.log(store.getState()) );

console.log ('# Fetching...');
//store.dispatch(action.todos.update({td1 : 'todo item 1'}));
store.dispatch(action.todos.fetch()).then( () => console.log(store.getState()));

/*

// Dispatch some action
console.log ('# Add new todo');
store.dispatch(action.todos.add('Learn about redux action', ['duong']));
store.dispatch(action.todos.add('Learn about redux reducer', ['duong']));

console.log ('# Complete a todo');
store.dispatch(action.todos.complete('todo-002', 'duong'));

console.log ('# Cancel a todo');
store.dispatch(action.todos.cancel('todo-001', 'duong'));

*/

// Stop listening to state updates
unsubscribe();