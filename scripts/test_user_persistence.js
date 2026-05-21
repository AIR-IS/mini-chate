const { loadUsers, saveUsers, usersFile } = require('../api/utils');
console.log('usersFile=', usersFile);
let users = loadUsers();
console.log('loaded', users);
users.push({ username: 'test', password: '1234' });
saveUsers(users);
console.log('saved', loadUsers());
