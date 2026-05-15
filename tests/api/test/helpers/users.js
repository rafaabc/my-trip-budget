const request = require('supertest');

const BASE_URL = process.env.BASE_URL;
const TS = Date.now();
let counter = 0;

function uniqueUsername(label) {
  return `apitest_${TS}_${++counter}_${label}`;
}

async function createUser({ suffix = 'u', password = 'TestPass1!', fullName = 'Test User' } = {}) {
  const username = uniqueUsername(suffix);
  const res = await request(BASE_URL)
    .post('/api/users/register')
    .send({ username, password, fullName });
  return { res, username, password };
}

async function loginUser(username, password) {
  return request(BASE_URL)
    .post('/api/users/login')
    .send({ username, password });
}

module.exports = { uniqueUsername, createUser, loginUser };
