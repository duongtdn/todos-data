"use strict"

import { createStore, applyMiddleware } from 'redux';
import thunkMiddleware from 'redux-thunk';

import rootReducer from './reducers';

export { default as auth } from './auth-services';
export * from './actions';
export { default as db } from './data-services';

export const store = createStore(
  rootReducer,
  applyMiddleware( thunkMiddleware )
);