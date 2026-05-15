const request = require('supertest');
const { expect } = require('chai');
const { uniqueUsername } = require('../helpers/users');
const { trackUserId } = require('../hooks/cleanup');
const missingFieldCases = require('../../fixtures/users.json').missingFieldCases;
const blankFieldCases = require('../../fixtures/users.json').blankFieldCases;

const BASE_URL = process.env.BASE_URL;

describe('US-01 — User Registration', () => {

  // TC-001: valid data creates user
  it('[TC-001] POST /api/users/register with valid data returns 201 and user object', async () => {
    const username = uniqueUsername('tc001');
    const res = await request(BASE_URL)
      .post('/api/users/register')
      .send({ username, password: 'securepass', fullName: 'Traveler One' });

    expect(res.status).to.equal(201);
    expect(res.body).to.have.property('username', username);
    trackUserId(res.body.id);
  });

  // TC-002: 201 + application/json
  it('[TC-002] Successful registration returns HTTP 201 and Content-Type application/json', async () => {
    const username = uniqueUsername('tc002');
    const res = await request(BASE_URL)
      .post('/api/users/register')
      .send({ username, password: 'securepass', fullName: 'TC002 User' });

    expect(res.status).to.equal(201);
    expect(res.headers['content-type']).to.include('application/json');
    trackUserId(res.body.id);
  });

  // TC-003: duplicate username → 409
  it('[TC-003] Duplicate username returns HTTP 409 with error message', async () => {
    const username = uniqueUsername('tc003dup');

    const first = await request(BASE_URL)
      .post('/api/users/register')
      .send({ username, password: 'password1', fullName: 'Existing User' });
    expect(first.status).to.equal(201);
    trackUserId(first.body.id);

    const second = await request(BASE_URL)
      .post('/api/users/register')
      .send({ username, password: 'password2', fullName: 'Duplicate User' });

    expect(second.status).to.equal(409);
    expect(second.body).to.have.property('message');
    expect(second.body.message.toLowerCase()).to.include('username');
  });

  // TC-004: DB uniqueness — only one record persisted
  it('[TC-004] Second registration with same username is rejected; only one record exists in DB', async () => {
    const username = uniqueUsername('tc004alpha');
    const mongoose = require('mongoose');

    const first = await request(BASE_URL)
      .post('/api/users/register')
      .send({ username, password: 'pass12345', fullName: 'Alpha User' });
    expect(first.status).to.equal(201);
    trackUserId(first.body.id);

    const second = await request(BASE_URL)
      .post('/api/users/register')
      .send({ username, password: 'different1', fullName: 'Alpha User 2' });
    expect([409, 400]).to.include(second.status);

    const count = await mongoose.connection.db
      .collection('users')
      .countDocuments({ username });
    expect(count).to.equal(1);
  });

  // TC-005: password shorter than 8 chars → 400
  it('[TC-005] Password with fewer than 8 characters returns HTTP 400', async () => {
    const username = uniqueUsername('tc005');
    const res = await request(BASE_URL)
      .post('/api/users/register')
      .send({ username, password: 'abc123', fullName: 'Short Pass' });

    expect(res.status).to.equal(400);
    expect(res.body.message.toLowerCase()).to.include('password');
  });

  // TC-006: boundary — 7-char rejected, 8-char accepted
  it('[TC-006] Password of 7 chars is rejected (400); password of 8 chars is accepted (201)', async () => {
    const u7 = uniqueUsername('tc006b7');
    const u8 = uniqueUsername('tc006b8');

    const res7 = await request(BASE_URL)
      .post('/api/users/register')
      .send({ username: u7, password: 'abcdefg', fullName: 'Boundary Seven' });
    expect(res7.status).to.equal(400);

    const res8 = await request(BASE_URL)
      .post('/api/users/register')
      .send({ username: u8, password: 'abcdefgh', fullName: 'Boundary Eight' });
    expect(res8.status).to.equal(201);
    trackUserId(res8.body.id);
  });

  // TC-007: missing required fields (data-driven)
  missingFieldCases.forEach(({ tc, description, payload, expectedStatus }) => {
    it(`[${tc}] Missing required field — ${description} → HTTP ${expectedStatus}`, async () => {
      const res = await request(BASE_URL)
        .post('/api/users/register')
        .send(payload);

      expect(res.status).to.equal(expectedStatus);
      expect(res.body).to.have.property('message');
    });
  });

  // TC-008: blank fields (data-driven)
  blankFieldCases.forEach(({ tc, description, payload, expectedStatus }) => {
    it(`[${tc}] Blank field — ${description} → HTTP ${expectedStatus}`, async () => {
      const res = await request(BASE_URL)
        .post('/api/users/register')
        .send(payload);

      expect(res.status).to.equal(expectedStatus);
      expect(res.body).to.have.property('message');
    });
  });

});
