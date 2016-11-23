"use strict"

import { createStore, applyMiddleware } from 'redux';
import thunkMiddleware from 'redux-thunk';

import auth from './auth-services';
import rootReducer from './reducers';
import * as action from './actions';
import messages, { TEMPLATE } from './messages';

import db from './data-services';

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


auth.onAuthStateChanged( usr => {
  if (usr) {    
    
    console.log ('\n# User is logged ----------------------------------------');
    // store.dispatch(action.user.friends.add([{id : Users.mai, name : 'Mai Nguyen', relationship : 'wife'}]));
    // store.dispatch(action.user.friends.remove(Users.mai));
    // store.dispatch(action.user.friends.edit(Users.mai, {name : 'Mai Nguyen', relationship : 'spouse'}));
    store.dispatch(action.user.load()).then( user => {
     
      console.log ('\n# Fetching... ---------------------------------------');
      store.dispatch(action.todos.fetch()).then(todosList => {
        
        console.log ('\n# Fetched Todos List ------------------------------');
        displayStore();
        
        // mai
        if (usr.uid === Users.mai) {
          console.log('Logged as Mai');
          console.log ('\n# Adding new todo ------------------------------');
          const todoId = store.dispatch(action.todos.add({
            text : 'Finishing todo completion function',
            urgent : true,
            share : [Users.duong]
          }));
          // console.log ('\n# Share new added todo ------------------------------');
          // store.dispatch(action.todos.share({
          //   users : [Users.duong],
          //   id : todoId
          // }));

          console.log('Delette message');
          const msgId = ['-KX8qjJIk4DVeNXeFJOA', '-KX8r5HsH6wrmKY8Z1BJ', '-KX8rV_7MJTnuA0iW2Yq'];
          store.dispatch(action.user.messages.delete(msgId));

          displayStore();
          
          store.dispatch(action.user.signOut()).then(() => {
            console.log ('\n# Logged out');   
            // console.log ('\n# Re-Login as Duong... -----------------------------------------');
            // store.dispatch(action.user.signIn('duongtdn@stormgle.com','123456')).catch(err => console.log (err));
          });
        }

        // duong
        if (usr.uid === Users.duong) {
          console.log('Logged as Duong');


          // add friends
          // store.dispatch(action.user.friends.add([{id : Users.mai, name : 'Mai Nguyen', relationship : 'wife'}]));

          const todoId = '-KX8v6BCdh0sSLRoHPnU';
          const todo = store.getState().todos[todoId];

          // // accept todo   
          // const msgId = '-KX8vWruZDgACJPGs5h9';                 
          // const msg = store.getState().user.messages[msgId];  
          // // const msg = false;        
          // if (msg) {
          //   console.log('\n#Accept invited todo');
          //   store.dispatch(action.todos.accept(msg));
          //   // console.log('\n#Decline invited todo');
          //   // store.dispatch(action.todos.decline(msg));
          //   displayStore();
          // } else {
          //   console.log ('\n#No message found');         
          // }

          // // complete a todo
          // // const todo = {
          // //   id : '-KX2kmS-UuByIMOKuA5G',
          // //   share : {
          // //     MrrsU8OMAFMre1bOdLgWTZdBqD62: 'owner',
          // //     VgLf702x7bXZeus6Rwvohre208e2: 'invited'
          // //   }
          // // };
          // if (todo) {
          //   // complete a todo
          //   store.dispatch(action.todos.complete(todo));
          //   displayStore();
          // }

          // // delete a todo
          // if (todo) {
          //   // complete a todo
          //   store.dispatch(action.todos.delete(todo));
          //   displayStore();
          // }

          // // edit a todo
          // if (todo) {
          //   store.dispatch(action.todos.edit(todo, {
          //     text : 'todo edit function',
          //     highlight : true,
          //     urgent : true
          //   }));
          // }

          // console.log ('\n# Adding new todo ------------------------------'); 
          // const todoId = store.dispatch(action.todos.add(' with security system')); 

          // this action should Failed
          // db.ref(`todos/-KWoP_T9TjNrH9G-asqS/share/${usr.uid}`).set('collaborator');

          //search for user
          console.log('\nSearch user by email\n');
          store.dispatch(action.search.apply('admin@stormgle.com')).then(() => {
            console.log(store.getState().search);
            store.dispatch(action.search.clear());
            console.log(store.getState().search);
          });
          
          // db.usersList.orderByChild('email').equalTo('mainth@stormgle.com').on('child_added', snap => console.log(snap.val()));
          // db.usersList.orderByChild('name').equalTo('Admin Stormgle').on('child_added', snap => console.log(snap.val()));
        }
      });
    });
  } else {
    console.log ('\n# User is not logged ------------------------------------');
    store.dispatch(action.user.update(null,null,null,null)); 
  }    
});

console.log ('\n# Initial State ---------------------------------------------');
console.log (store.getState());

function displayStore() {
  console.log('\n# Store ---------------------------------');
  console.log ('# - Todos :');
  console.log (store.getState().todos);
  console.log('# - User.messages');
  console.log (store.getState().user.messages);
  console.log('# - User.todos');
  console.log (store.getState().user.todos);
  console.log('# - User.friends');
  console.log (store.getState().user.friends);
  console.log('#----------------------------------------');
}

console.log ('\n# Login... --------------------------------------------------');

// store.dispatch(action.user.signIn('mainth@stormgle.com','123456'))
// .then( usr => console.log(usr) )
// .catch(err => console.log(err) );
store.dispatch(action.user.signIn('duongtdn@stormgle.com','123456'))

// store.dispatch(action.user.signUp('admin@stormgle.com','123456','Admin Stormgle'));

// // Stop listening to state updates
// // unsubscribe();

// store.dispatch(action.filter.apply({hideCompletion : true}));
// console.log (store.getState());