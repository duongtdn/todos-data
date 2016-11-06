"use strict"

import { fb } from './firebase-services'; 
        
const db = fb.database();

db.tasks = db.ref('tasks');
db.users = db.ref('users');

export default db;

console.log (' Firebase Init Success');
