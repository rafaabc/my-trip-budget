const request = require('supertest');
const { expect } = require('chai');
const jwt = require('jsonwebtoken');
const { uniqueUsername, createUser, loginUser } = require('../helpers/users');
const { trackUserId } = require('../hooks/cleanup');

const BASE_URL = process.env.BASE_URL;

describe('US-02 — User Login', () => {

  let loginUsername;
  let loginPassword;

  before(async () => {
    loginPassword = 'securepass';
    const { res, username } = await createUser({ suffix: 'login', password: loginPassword });
    expect(res.status).to.equal(201);
    loginUsername = username;
    trackUserId(res.body.id);
  });

  // TC-009: valid credentials → 200 with token
  it('[TC-009] Valid credentials return HTTP 200 and a non-empty response body', async () => {
    const res = await loginUser(loginUsername, loginPassword);

    expect(res.status).to.equal(200);
    expect(res.body).to.not.be.empty;
    expect(res.body).to.have.property('token');
  });

  // TC-010: JWT present and structurally valid, payload contains sub
  it('[TC-010] Successful login returns a valid JWT with sub in payload; token works on authenticated endpoints', async () => {
    const loginRes = await loginUser(loginUsername, loginPassword);
    expect(loginRes.status).to.equal(200);

    const token = loginRes.body.token;
    expect(token).to.be.a('string').and.not.be.empty;

    const decoded = jwt.decode(token);
    expect(decoded).to.have.property('sub');
    expect(decoded).to.have.property('username', loginUsername);

    const tripsRes = await request(BASE_URL)
      .get('/api/trips')
      .set('Authorization', `Bearer ${token}`);
    expect(tripsRes.status).to.equal(200);
  });

  // TC-011: invalid (unregistered) username → 401, generic message, no token
  it('[TC-011] Login with unregistered username returns HTTP 401 and generic error; no token returned', async () => {
    const res = await loginUser('ghost_user_never_exists_apitest', 'somepass1');

    expect(res.status).to.equal(401);
    expect(res.body).to.have.property('message', 'Invalid credentials');
    expect(res.body).to.not.have.property('token');
  });

  // TC-012: wrong password → 401, same generic message
  it('[TC-012] Login with wrong password returns HTTP 401 and the same generic error message', async () => {
    const res = await loginUser(loginUsername, 'wrongpassword99');

    expect(res.status).to.equal(401);
    expect(res.body).to.have.property('message', 'Invalid credentials');
    expect(res.body).to.not.have.property('token');
  });

  // TC-013: completely absent user — 401 with no side effects
  it('[TC-013] Login for user absent from DB returns 401; no user data or token in response', async () => {
    const dbGhostUsername = `apitest_db_ghost_${Date.now()}`;

    const res = await loginUser(dbGhostUsername, 'anypassword');

    expect(res.status).to.equal(401);
    expect(res.body).to.not.have.property('token');
    expect(res.body).to.not.have.property('id');
    expect(res.body).to.not.have.property('username');
  });

  // TC-014: missing username field → 400
  it('[TC-014] Login without username field returns HTTP 400', async () => {
    const res = await request(BASE_URL)
      .post('/api/users/login')
      .send({ password: 'somepass1' });

    expect(res.status).to.equal(400);
    expect(res.body).to.have.property('message');
    expect(res.body).to.not.have.property('token');
  });

  // TC-015: missing password field → 400
  it('[TC-015] Login without password field returns HTTP 400', async () => {
    const res = await request(BASE_URL)
      .post('/api/users/login')
      .send({ username: loginUsername });

    expect(res.status).to.equal(400);
    expect(res.body).to.have.property('message');
    expect(res.body).to.not.have.property('token');
  });

  // TC-016: token from login is accepted by authenticated endpoint; without token → 401
  it('[TC-016] JWT from login is accepted by GET /api/trips; request without token returns 401', async () => {
    const loginRes = await loginUser(loginUsername, loginPassword);
    expect(loginRes.status).to.equal(200);
    const token = loginRes.body.token;

    const withToken = await request(BASE_URL)
      .get('/api/trips')
      .set('Authorization', `Bearer ${token}`);
    expect(withToken.status).to.equal(200);

    const withoutToken = await request(BASE_URL).get('/api/trips');
    expect(withoutToken.status).to.equal(401);
  });

  // TC-017: login rejected before registration; works after
  it('[TC-017] Login rejected before registration; succeeds after registration', async () => {
    const inactiveUsername = uniqueUsername('inactive');
    const inactivePassword = 'anypass01';

    const preRegRes = await loginUser(inactiveUsername, inactivePassword);
    expect(preRegRes.status).to.equal(401);

    const regRes = await request(BASE_URL)
      .post('/api/users/register')
      .send({ username: inactiveUsername, password: inactivePassword, fullName: 'Inactive Test' });
    expect(regRes.status).to.equal(201);
    trackUserId(regRes.body.id);

    const postRegRes = await loginUser(inactiveUsername, inactivePassword);
    expect(postRegRes.status).to.equal(200);
    expect(postRegRes.body).to.have.property('token');
  });

});
