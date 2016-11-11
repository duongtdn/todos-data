"use strict"

import { createStore, applyMiddleware } from 'redux';
import thunkMiddleware from 'redux-thunk';

import auth from './auth-services';

import rootReducer from './reducers';
import * as action from './actions';

const Users = {
  'duong' : 'VgLf702x7bXZeus6Rwvohre208e2',
  'mai' : 'MrrsU8OMAFMre1bOdLgWTZdBqD62'
}

const store = createStore(
  rootReducer,
  applyMiddleware(
    thunkMiddleware
  )
);

auth.onAuthStateChanged( user => {
  if (user) {
    console.log ('\n# User is logged ----------------------------------------');
    store.dispatch(action.user.load()).then( user => {
      console.log ('\n# Fetching... ---------------------------------------');
      store.dispatch(action.todos.fetch()).then(todosList => {
        console.log ('\n# Fetched Todos List ------------------------------');
        console.log (store.getState());
        //store.dispatch(action.todos.add('Learn firebase plus redux'));
      });
    });
  } else {
    console.log ('\n# User is not logged ------------------------------------');
    store.dispatch(action.user.update(null)); 
  }    
});

console.log ('\n# Initial State ---------------------------------------------');
console.log (store.getState());


// const unsubscribe = store.subscribe( () => {
//   console.log('todos');
//   console.log(store.getState().todos)
//   if (store.getState().user && store.getState().user.todos) {
//     console.log('user todos');
//     console.log(store.getState().user.todos);
//   } 
// });

console.log ('\n# Login... --------------------------------------------------');
// attem to login with wrong pass
store.dispatch(action.user.signIn('mainth@stormgle.com','0123456'))
  .then( (dat) => {
    console.log ('\n# Logged Failed -----------------------------------------');
    // console.log(store.getState());
    console.log ('\n# Re-Login... -------------------------------------------');
    // re-login with right pass
    store.dispatch(action.user.signIn('mainth@stormgle.com','123456')).catch(err => console.log (err));
  }).catch(err => console.log (err));

// Stop listening to state updates
// unsubscribe();