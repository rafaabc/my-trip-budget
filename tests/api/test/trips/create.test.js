const request = require('supertest');
const { expect } = require('chai');
const jwt = require('jsonwebtoken');
const { getToken } = require('../hooks/auth');
const { createUser, loginUser } = require('../helpers/users');
const { trackUserId } = require('../hooks/cleanup');
const tripsFixture = require('../../fixtures/trips.json');

const BASE_URL = process.env.BASE_URL;

describe('US-03 — Trip Registration', () => {

  // TC-018: valid trip → 201 + body has all fields + DB has record
  it('[TC-018] POST /api/trips with valid data returns 201 and creates a trip in DB', async () => {
    const mongoose = require('mongoose');
    const res = await request(BASE_URL)
      .post('/api/trips')
      .set('Authorization', `Bearer ${getToken()}`)
      .send(tripsFixture.validTrip);

    expect(res.status).to.equal(201);
    expect(res.body).to.have.property('title', tripsFixture.validTrip.title);
    expect(res.body).to.have.property('departureDate');
    expect(res.body).to.have.property('returnDate');
    expect(res.body).to.have.property('userId');

    const trip = await mongoose.connection.db
      .collection('trips')
      .findOne({ title: tripsFixture.validTrip.title });
    expect(trip).to.not.be.null;
  });

  // TC-019: response body has all required fields matching request values
  it('[TC-019] Response body contains title, departureDate and returnDate matching the request', async () => {
    const { title, departureDate, returnDate } = tripsFixture.tokyoTrip;
    const res = await request(BASE_URL)
      .post('/api/trips')
      .set('Authorization', `Bearer ${getToken()}`)
      .send(tripsFixture.tokyoTrip);

    expect(res.status).to.equal(201);
    expect(res.body).to.have.property('title', title);
    expect(new Date(res.body.departureDate).toISOString().startsWith(departureDate)).to.be.true;
    expect(new Date(res.body.returnDate).toISOString().startsWith(returnDate)).to.be.true;
  });

  // TC-020..TC-022: missing required fields (data-driven)
  tripsFixture.missingFieldCases.forEach(({ tc, description, payload, expectedStatus }) => {
    it(`[${tc}] Missing field — ${description} → HTTP ${expectedStatus}`, async () => {
      const res = await request(BASE_URL)
        .post('/api/trips')
        .set('Authorization', `Bearer ${getToken()}`)
        .send(payload);

      expect(res.status).to.equal(expectedStatus);
      expect(res.body).to.have.property('message');
    });
  });

  // TC-023..TC-024: date boundary (data-driven)
  tripsFixture.dateBoundaryCases.forEach(({ tc, description, payload, expectedStatus }) => {
    it(`[${tc}] Date boundary — ${description} → HTTP ${expectedStatus}`, async () => {
      const res = await request(BASE_URL)
        .post('/api/trips')
        .set('Authorization', `Bearer ${getToken()}`)
        .send(payload);

      expect(res.status).to.equal(expectedStatus);
      if (expectedStatus !== 201) {
        expect(res.body).to.have.property('message');
      }
    });
  });

  // TC-025: auth guard — missing / invalid / expired token
  describe('[TC-025] Trip creation rejected without a valid auth token', () => {
    it('no Authorization header → 401', async () => {
      const res = await request(BASE_URL)
        .post('/api/trips')
        .send(tripsFixture.validTrip);

      expect(res.status).to.equal(401);
    });

    it('invalid Bearer token → 401 or 403', async () => {
      // middleware: 401 = missing, 403 = invalid/expired — test-cases.md updated to accept both
      const res = await request(BASE_URL)
        .post('/api/trips')
        .set('Authorization', 'Bearer invalid.token.value')
        .send(tripsFixture.validTrip);

      expect(res.status).to.be.oneOf([401, 403]);
    });

    it('expired JWT → 401 or 403', async () => {
      const expiredToken = jwt.sign(
        { sub: 'fakeid', username: 'fakeuser' },
        process.env.JWT_SECRET,
        { expiresIn: -1 }
      );
      const res = await request(BASE_URL)
        .post('/api/trips')
        .set('Authorization', `Bearer ${expiredToken}`)
        .send(tripsFixture.validTrip);

      expect(res.status).to.be.oneOf([401, 403]);
    });
  });

  // TC-026: multiple trips for same user
  it('[TC-026] Same authenticated user can create multiple independent trips', async () => {
    const mongoose = require('mongoose');
    const { res: regRes, username, password } = await createUser({ suffix: 'multi' });
    expect(regRes.status).to.equal(201);
    const userId = regRes.body.id;
    trackUserId(userId);

    const loginRes = await loginUser(username, password);
    expect(loginRes.status).to.equal(200);
    const token = loginRes.body.token;

    for (const trip of tripsFixture.multipleTrips) {
      const r = await request(BASE_URL)
        .post('/api/trips')
        .set('Authorization', `Bearer ${token}`)
        .send(trip);
      expect(r.status).to.equal(201);
    }

    const { ObjectId } = require('mongoose').Types;
    const count = await mongoose.connection.db
      .collection('trips')
      .countDocuments({ userId: new ObjectId(userId) });
    expect(count).to.equal(tripsFixture.multipleTrips.length);
  });

});
