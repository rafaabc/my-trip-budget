const tripService = require('../../src/services/trip.service');
const { createTrip, listTrips } = require('../../src/controllers/trip.controller');

jest.mock('../../src/services/trip.service');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('tripController.createTrip', () => {
  it('returns 201 with trip on success', async () => {
    const req = { body: { title: 'Paris' }, user: { sub: 'user-id' } };
    const res = mockRes();
    const trip = { id: 't1', title: 'Paris' };
    tripService.createTrip.mockResolvedValue(trip);

    await createTrip(req, res);

    expect(tripService.createTrip).toHaveBeenCalledWith({ title: 'Paris' }, 'user-id');
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(trip);
  });

  it('returns err.status when service throws with status', async () => {
    const req = { body: {}, user: { sub: 'user-id' } };
    const res = mockRes();
    const err = Object.assign(new Error('Bad Request'), { status: 400 });
    tripService.createTrip.mockRejectedValue(err);

    await createTrip(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Bad Request' });
  });

  it('returns 500 when error has no status', async () => {
    const req = { body: {}, user: { sub: 'user-id' } };
    const res = mockRes();
    tripService.createTrip.mockRejectedValue(new Error('unexpected'));

    await createTrip(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('tripController.listTrips', () => {
  it('returns 200 with trips array on success', async () => {
    const req = { user: { sub: 'user-id' } };
    const res = mockRes();
    const trips = [{ id: 't1' }, { id: 't2' }];
    tripService.listTrips.mockResolvedValue(trips);

    await listTrips(req, res);

    expect(tripService.listTrips).toHaveBeenCalledWith('user-id');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(trips);
  });

  it('returns err.status when service throws with status', async () => {
    const req = { user: { sub: 'user-id' } };
    const res = mockRes();
    const err = Object.assign(new Error('Not Found'), { status: 404 });
    tripService.listTrips.mockRejectedValue(err);

    await listTrips(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 500 when error has no status', async () => {
    const req = { user: { sub: 'user-id' } };
    const res = mockRes();
    tripService.listTrips.mockRejectedValue(new Error('unexpected'));

    await listTrips(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
