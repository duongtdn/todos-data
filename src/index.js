"use strict"

import { createStore, applyMiddleware } from 'redux';
import thunkMiddleware from 'redux-thunk';

import auth from './auth-services';
import rootReducer from './reducers';
import * as action from './actions';
import messenger from './messenger';

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
let msgId;
auth.onAuthStateChanged( usr => {
  if (usr) {    
    console.log ('\n# User is logged ----------------------------------------');
    store.dispatch(action.user.load()).then( user => {
      console.log ('\n# Fetching... ---------------------------------------');
      store.dispatch(action.todos.fetch()).then(todosList => {
        console.log ('\n# Fetched Todos List ------------------------------');
        displayStore();
        // mai
        if (usr.uid === Users.mai) {
          console.log ('\n# Adding new todo ------------------------------');
          const todoId = store.dispatch(action.todos.add('Implement message system'));
          msgId = messenger.inviteTodo({
            collaborator : Users.duong,
            todoId : todoId
          });
          displayStore();
          store.dispatch(action.user.signOut()).then(() => {
            console.log ('\n# Logged out');   
            console.log ('\n# Re-Login as Duong... -----------------------------------------');
            store.dispatch(action.user.signIn('duongtdn@stormgle.com','123456')).catch(err => console.log (err));
          });
        }
        // duong
        if (usr.uid === Users.duong) {
          // accpet todo                    
          const msg = store.getState().user.messages[msgId];          
          if (msg) {
            console.log('\n#Accept invited todo');
            messenger.acceptTodo(msgId, msg);
            displayStore();
          } else {
            console.log ('\n#No message found');           
          }
          

        }
      });
    });
  } else {
    console.log ('\n# User is not logged ------------------------------------');
    store.dispatch(action.user.update(null,null,null)); 
  }    
});

console.log ('\n# Initial State ---------------------------------------------');
console.log (store.getState());

function displayStore() {
  console.log ('Todos :');
  console.log (store.getState().todos);
  console.log('User.messages');
  console.log (store.getState().user.messages);
  console.log('User.todos');
  console.log (store.getState().user.todos);
}

console.log ('\n# Login... --------------------------------------------------');
// attem to login with wrong pass
store.dispatch(action.user.signIn('mainth@stormgle.com','0123456'))
  .then( (dat) => {
    console.log ('\n# Logged Failed -----------------------------------------');
    // console.log(store.getState());
    console.log ('\n# Re-Login as Mai... -----------------------------------------');
    // re-login with right pass
    store.dispatch(action.user.signIn('mainth@stormgle.com','123456')).catch(err => console.log (err));
  }).catch(err => console.log (err));

// Stop listening to state updates
// unsubscribe();