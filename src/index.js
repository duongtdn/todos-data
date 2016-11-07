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

console.log ('# Login...');
// attem to login with wrong pass
store.dispatch(action.user.signIn('mainth@stormgle.com','0123456'))
  .then( (dat) => {
    console.log (' Logged Failed');
    console.log(store.getState());
    console.log ('# Re-Login...');
    // re-login with right pass
    store.dispatch(action.user.signIn('mainth@stormgle.com','123456'))
      .then( (dat) => {
        console.log (' User is logged and data is loaded');
        console.log(store.getState());
        store.dispatch(action.user.signOut()).then( () => {
          console.log (' User signed out');
          console.log(store.getState());
        });
      })
      .catch(err => console.log (err));
  })  
  .catch(err => console.log (err));

console.log ('# Fetching...');
store.dispatch(action.todos.fetch())
  .then( () => {
    console.log (' Todos are loaded');
    console.log(store.getState())
  });

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