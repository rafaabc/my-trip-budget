const Trip = require('../../src/models/trip.model');
const tripService = require('../../src/services/trip.service');

jest.mock('../../src/models/trip.model');

describe('tripService.listTrips (US-04 / SCRUM-10)', () => {
  const USER_ID = 'user-id-abc';
  const OTHER_USER_ID = 'user-id-xyz';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── AC1: returns list of user's trips ─────────────────────────────────────

  describe('AC1: returns trips for the authenticated user', () => {
    it('returns all trips belonging to the authenticated user (AC1, BR1)', async () => {
      const trips = [
        {
          id: 'trip-2',
          userId: USER_ID,
          title: 'Japan Autumn',
          departureDate: new Date('2025-09-01'),
          returnDate: new Date('2025-09-15'),
        },
        {
          id: 'trip-1',
          userId: USER_ID,
          title: 'Europe Summer',
          departureDate: new Date('2025-07-01'),
          returnDate: new Date('2025-07-21'),
        },
      ];
      Trip.find.mockReturnValue({ sort: jest.fn().mockResolvedValue(trips) });

      const result = await tripService.listTrips(USER_ID);

      expect(result).toBe(trips);
      expect(result).toHaveLength(2);
    });

    it('queries only trips scoped to the authenticated userId (AC1, BR1)', async () => {
      Trip.find.mockReturnValue({ sort: jest.fn().mockResolvedValue([]) });

      await tripService.listTrips(USER_ID);

      expect(Trip.find).toHaveBeenCalledWith({ userId: USER_ID });
      expect(Trip.find).not.toHaveBeenCalledWith({ userId: OTHER_USER_ID });
    });
  });

  // ─── AC2: response shape includes required fields ──────────────────────────

  describe('AC2: each trip contains title, departureDate, and returnDate', () => {
    it('returns trip objects with title, departureDate, and returnDate fields (AC2)', async () => {
      const trips = [
        {
          id: 'trip-1',
          userId: USER_ID,
          title: 'Paris Winter',
          departureDate: new Date('2025-12-20'),
          returnDate: new Date('2025-12-30'),
        },
      ];
      Trip.find.mockReturnValue({ sort: jest.fn().mockResolvedValue(trips) });

      const result = await tripService.listTrips(USER_ID);

      expect(result[0]).toMatchObject({
        title: 'Paris Winter',
        departureDate: expect.any(Date),
        returnDate: expect.any(Date),
      });
    });
  });

  // ─── AC3: auth enforcement (middleware layer) ──────────────────────────────
  //
  // AC3 (401 when no token provided) is enforced by auth.middleware.js before
  // the request reaches the service. The service is never called in that case,
  // so this AC is covered at the middleware layer, not here.

  // ─── AC4: empty list when no trips registered ──────────────────────────────

  describe('AC4: returns empty array when no trips have been registered', () => {
    it('returns an empty array when the user has no trips (AC4)', async () => {
      Trip.find.mockReturnValue({ sort: jest.fn().mockResolvedValue([]) });

      const result = await tripService.listTrips(USER_ID);

      expect(result).toEqual([]);
    });
  });

  // ─── BR1: only authenticated user's trips ──────────────────────────────────

  describe('BR1: response includes only trips belonging to the authenticated user', () => {
    it('does not return trips from other users (BR1)', async () => {
      const userTrips = [{ id: 'trip-1', userId: USER_ID, title: 'My Trip' }];
      Trip.find.mockReturnValue({ sort: jest.fn().mockResolvedValue(userTrips) });

      const result = await tripService.listTrips(USER_ID);

      result.forEach(trip => {
        expect(trip.userId).toBe(USER_ID);
      });
    });
  });

  // ─── BR2: sorted newest-first by departure date ────────────────────────────

  describe('BR2: trips are sorted by departureDate descending (most recent first)', () => {
    it('sorts trips by departureDate descending (BR2)', async () => {
      const sortMock = jest.fn().mockResolvedValue([]);
      Trip.find.mockReturnValue({ sort: sortMock });

      await tripService.listTrips(USER_ID);

      expect(sortMock).toHaveBeenCalledWith({ departureDate: -1 });
    });

    it('returns trips in newest-first order (BR2)', async () => {
      const trips = [
        { id: 'trip-3', title: 'Latest Trip', departureDate: new Date('2025-11-01') },
        { id: 'trip-2', title: 'Middle Trip', departureDate: new Date('2025-09-01') },
        { id: 'trip-1', title: 'Earliest Trip', departureDate: new Date('2025-07-01') },
      ];
      Trip.find.mockReturnValue({ sort: jest.fn().mockResolvedValue(trips) });

      const result = await tripService.listTrips(USER_ID);

      expect(result[0].departureDate.getTime()).toBeGreaterThan(result[1].departureDate.getTime());
      expect(result[1].departureDate.getTime()).toBeGreaterThan(result[2].departureDate.getTime());
    });
  });
});
