const request = require('supertest');
const { expect } = require('chai');
const jwt = require('jsonwebtoken');
const { getToken } = require('../hooks/auth');
const { createUser, loginUser } = require('../helpers/users');
const { trackUserId } = require('../hooks/cleanup');
const tripsFixture = require('../../fixtures/trips.json');

const BASE_URL = process.env.BASE_URL;

describe('US-04 — Trip List', () => {

  // TC-027: valid token → 200 + JSON array
  it('[TC-027] GET /api/trips with valid JWT returns HTTP 200 and a JSON array', async () => {
    const res = await request(BASE_URL)
      .get('/api/trips')
      .set('Authorization', `Bearer ${getToken()}`);

    expect(res.status).to.equal(200);
    expect(res.body).to.be.an('array');
    expect(res.headers['content-type']).to.include('application/json');
  });

  // TC-028: data isolation — User A and User B see only their own trips
  it('[TC-028] GET /api/trips returns only trips belonging to the authenticated user', async () => {
    const { res: regA, username: usernameA, password: passwordA } = await createUser({ suffix: 'isola' });
    expect(regA.status).to.equal(201);
    trackUserId(regA.body.id);

    const { res: regB, username: usernameB, password: passwordB } = await createUser({ suffix: 'isolb' });
    expect(regB.status).to.equal(201);
    trackUserId(regB.body.id);

    const loginA = await loginUser(usernameA, passwordA);
    const tokenA = loginA.body.token;
    const loginB = await loginUser(usernameB, passwordB);
    const tokenB = loginB.body.token;

    await request(BASE_URL)
      .post('/api/trips')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'A-Only Trip', departureDate: '2025-05-01', returnDate: '2025-05-10' });

    await request(BASE_URL)
      .post('/api/trips')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ title: 'B-Only Trip', departureDate: '2025-06-01', returnDate: '2025-06-10' });

    const resA = await request(BASE_URL).get('/api/trips').set('Authorization', `Bearer ${tokenA}`);
    expect(resA.status).to.equal(200);
    const titlesA = resA.body.map(t => t.title);
    expect(titlesA).to.include('A-Only Trip');
    expect(titlesA).to.not.include('B-Only Trip');

    const resB = await request(BASE_URL).get('/api/trips').set('Authorization', `Bearer ${tokenB}`);
    expect(resB.status).to.equal(200);
    const titlesB = resB.body.map(t => t.title);
    expect(titlesB).to.include('B-Only Trip');
    expect(titlesB).to.not.include('A-Only Trip');
  });

  // TC-029: every returned trip has title, departureDate, returnDate
  it('[TC-029] Every trip object in the response contains title, departureDate and returnDate', async () => {
    const { res: regRes, username, password } = await createUser({ suffix: 'fields' });
    expect(regRes.status).to.equal(201);
    trackUserId(regRes.body.id);

    const loginRes = await loginUser(username, password);
    const token = loginRes.body.token;

    for (const trip of [tripsFixture.validTrip, tripsFixture.tokyoTrip]) {
      await request(BASE_URL)
        .post('/api/trips')
        .set('Authorization', `Bearer ${token}`)
        .send(trip);
    }

    const res = await request(BASE_URL).get('/api/trips').set('Authorization', `Bearer ${token}`);
    expect(res.status).to.equal(200);
    expect(res.body).to.be.an('array').with.length.greaterThan(0);

    res.body.forEach(trip => {
      expect(trip).to.have.property('title').that.is.a('string').and.not.be.empty;
      expect(trip).to.have.property('departureDate').that.is.a('string');
      expect(trip).to.have.property('returnDate').that.is.a('string');
    });
  });

  // TC-030: auth guard — missing / invalid / expired token
  describe('[TC-030] GET /api/trips rejected without a valid auth token', () => {
    it('no Authorization header → 401', async () => {
      const res = await request(BASE_URL).get('/api/trips');
      expect(res.status).to.equal(401);
      expect(res.body).to.not.have.property('userId');
    });

    it('invalid Bearer token → 401 or 403', async () => {
      const res = await request(BASE_URL)
        .get('/api/trips')
        .set('Authorization', 'Bearer tampered.token.value');
      expect(res.status).to.be.oneOf([401, 403]);
      expect(res.body).to.not.have.property('userId');
    });

    it('expired JWT → 401 or 403', async () => {
      const expiredToken = jwt.sign(
        { sub: 'fakeid', username: 'fakeuser' },
        process.env.JWT_SECRET,
        { expiresIn: -1 }
      );
      const res = await request(BASE_URL)
        .get('/api/trips')
        .set('Authorization', `Bearer ${expiredToken}`);
      expect(res.status).to.be.oneOf([401, 403]);
      expect(res.body).to.not.have.property('userId');
    });
  });

  // TC-031: fresh user with no trips → empty array
  it('[TC-031] Authenticated user with no trips receives an empty array []', async () => {
    const { res: regRes, username, password } = await createUser({ suffix: 'empty' });
    expect(regRes.status).to.equal(201);
    trackUserId(regRes.body.id);

    const loginRes = await loginUser(username, password);
    const token = loginRes.body.token;

    const res = await request(BASE_URL)
      .get('/api/trips')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).to.equal(200);
    expect(res.body).to.be.an('array').that.is.empty;
  });

  // TC-032: trips sorted descending by departure date
  it('[TC-032] Trips are returned sorted by departureDate descending (most recent first)', async () => {
    const { res: regRes, username, password } = await createUser({ suffix: 'sort' });
    expect(regRes.status).to.equal(201);
    trackUserId(regRes.body.id);

    const loginRes = await loginUser(username, password);
    const token = loginRes.body.token;

    // Create 3 trips with mixed dates
    for (const trip of tripsFixture.sortingTrips) {
      const r = await request(BASE_URL)
        .post('/api/trips')
        .set('Authorization', `Bearer ${token}`)
        .send(trip);
      expect(r.status).to.equal(201);
    }

    const res = await request(BASE_URL).get('/api/trips').set('Authorization', `Bearer ${token}`);
    expect(res.status).to.equal(200);
    expect(res.body).to.be.an('array').with.lengthOf(3);

    const dates = res.body.map(t => new Date(t.departureDate).getTime());
    for (let i = 0; i < dates.length - 1; i++) {
      expect(dates[i]).to.be.greaterThanOrEqual(dates[i + 1],
        `Trip at index ${i} should have a departureDate >= trip at index ${i + 1}`);
    }
    expect(res.body[0].title).to.equal('Trip B'); // 2025-07-15 is latest of the 3

    // Add a later trip and verify it becomes first
    const lateR = await request(BASE_URL)
      .post('/api/trips')
      .set('Authorization', `Bearer ${token}`)
      .send(tripsFixture.sortingTripLate);
    expect(lateR.status).to.equal(201);

    const res2 = await request(BASE_URL).get('/api/trips').set('Authorization', `Bearer ${token}`);
    expect(res2.status).to.equal(200);
    expect(res2.body[0].title).to.equal(tripsFixture.sortingTripLate.title);
  });

  // TC-033: User X's trips not in User Y's response
  it("[TC-033] User Y's trip list does not contain User X's trips", async () => {
    const { res: regX, username: usernameX, password: passwordX } = await createUser({ suffix: 'usrx' });
    expect(regX.status).to.equal(201);
    trackUserId(regX.body.id);

    const { res: regY, username: usernameY, password: passwordY } = await createUser({ suffix: 'usry' });
    expect(regY.status).to.equal(201);
    trackUserId(regY.body.id);

    const tokenX = (await loginUser(usernameX, passwordX)).body.token;
    const tokenY = (await loginUser(usernameY, passwordY)).body.token;

    await request(BASE_URL).post('/api/trips')
      .set('Authorization', `Bearer ${tokenX}`)
      .send({ title: 'X-Trip-1', departureDate: '2025-04-01', returnDate: '2025-04-10' });

    await request(BASE_URL).post('/api/trips')
      .set('Authorization', `Bearer ${tokenX}`)
      .send({ title: 'X-Trip-2', departureDate: '2025-05-01', returnDate: '2025-05-10' });

    await request(BASE_URL).post('/api/trips')
      .set('Authorization', `Bearer ${tokenY}`)
      .send({ title: 'Y-Trip-1', departureDate: '2025-06-01', returnDate: '2025-06-10' });

    const resY = await request(BASE_URL).get('/api/trips').set('Authorization', `Bearer ${tokenY}`);
    expect(resY.status).to.equal(200);

    const titles = resY.body.map(t => t.title);
    expect(titles).to.include('Y-Trip-1');
    expect(titles).to.not.include('X-Trip-1');
    expect(titles).to.not.include('X-Trip-2');
    expect(resY.body).to.have.lengthOf(1);
  });

});
