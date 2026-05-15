const request = require('supertest');
const { expect } = require('chai');
const { uniqueUsername } = require('../helpers/users');
const { trackUserId } = require('./cleanup');

const BASE_URL = process.env.BASE_URL;

let authToken;

exports.mochaHooks = {
  async beforeAll() {
    const username = uniqueUsername('default');
    const password = 'DefaultPass1';

    const regRes = await request(BASE_URL)
      .post('/api/users/register')
      .send({ username, password, fullName: 'Default Tester' });

    expect(regRes.status).to.equal(201, `Auth hook: register failed — ${JSON.stringify(regRes.body)}`);
    trackUserId(regRes.body.id);

    const loginRes = await request(BASE_URL)
      .post('/api/users/login')
      .send({ username, password });

    expect(loginRes.status).to.equal(200, `Auth hook: login failed — ${JSON.stringify(loginRes.body)}`);
    authToken = loginRes.body.token;
  },
};

exports.getToken = () => authToken;
