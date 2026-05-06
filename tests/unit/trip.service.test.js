const Trip = require('../../src/models/trip.model');
const tripService = require('../../src/services/trip.service');

jest.mock('../../src/models/trip.model');

describe('tripService (US-03 / SCRUM-9)', () => {
  const USER_ID = 'user-id-abc';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── createTrip ────────────────────────────────────────────────────────────

  describe('createTrip — AC1 / BR3: valid payload creates trip associated with user', () => {
    it('calls Trip.create with userId and parsed dates, returns the new trip (AC1)', async () => {
      const created = {
        id: 'trip-1',
        userId: USER_ID,
        title: 'Europe Summer',
        departureDate: new Date('2025-07-01'),
        returnDate: new Date('2025-07-21'),
      };
      Trip.create.mockResolvedValue(created);

      const result = await tripService.createTrip(
        { title: 'Europe Summer', departureDate: '2025-07-01', returnDate: '2025-07-21' },
        USER_ID
      );

      expect(Trip.create).toHaveBeenCalledTimes(1);
      expect(Trip.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: USER_ID,
          title: 'Europe Summer',
          departureDate: expect.any(Date),
          returnDate: expect.any(Date),
        })
      );
      expect(result).toBe(created);
    });

    it('stores parsed Date objects, not raw strings (AC1)', async () => {
      Trip.create.mockResolvedValue({});

      await tripService.createTrip(
        { title: 'Japan', departureDate: '2025-09-01', returnDate: '2025-09-15' },
        USER_ID
      );

      const arg = Trip.create.mock.calls[0][0];
      expect(arg.departureDate).toBeInstanceOf(Date);
      expect(arg.returnDate).toBeInstanceOf(Date);
    });
  });

  describe('createTrip — AC2 / BR1: missing required fields return 400', () => {
    it.each([
      ['title', { departureDate: '2025-07-01', returnDate: '2025-07-21' }],
      ['departureDate', { title: 'Europe Summer', returnDate: '2025-07-21' }],
      ['returnDate', { title: 'Europe Summer', departureDate: '2025-07-01' }],
    ])('throws 400 when %s is missing (AC2, BR1)', async (_field, payload) => {
      await expect(tripService.createTrip(payload, USER_ID)).rejects.toMatchObject({
        status: 400,
        message: 'title, departureDate, and returnDate are required',
      });

      expect(Trip.create).not.toHaveBeenCalled();
    });
  });

  describe('createTrip — AC2: invalid date format returns 400', () => {
    it('throws 400 for a non-parseable departureDate (AC2)', async () => {
      await expect(
        tripService.createTrip(
          { title: 'Bad Date Trip', departureDate: 'not-a-date', returnDate: '2025-07-21' },
          USER_ID
        )
      ).rejects.toMatchObject({
        status: 400,
        message: 'departureDate is not a valid date',
      });

      expect(Trip.create).not.toHaveBeenCalled();
    });

    it('throws 400 for a non-parseable returnDate (AC2)', async () => {
      await expect(
        tripService.createTrip(
          { title: 'Bad Date Trip', departureDate: '2025-07-01', returnDate: 'not-a-date' },
          USER_ID
        )
      ).rejects.toMatchObject({
        status: 400,
        message: 'returnDate is not a valid date',
      });

      expect(Trip.create).not.toHaveBeenCalled();
    });
  });

  describe('createTrip — AC3 / BR2: returnDate must be after departureDate', () => {
    it('throws 422 when returnDate equals departureDate (AC3)', async () => {
      await expect(
        tripService.createTrip(
          { title: 'Same Day', departureDate: '2025-07-01', returnDate: '2025-07-01' },
          USER_ID
        )
      ).rejects.toMatchObject({
        status: 422,
        message: 'returnDate must be after departureDate',
      });

      expect(Trip.create).not.toHaveBeenCalled();
    });

    it('throws 422 when returnDate is before departureDate (AC3)', async () => {
      await expect(
        tripService.createTrip(
          { title: 'Backwards Trip', departureDate: '2025-07-21', returnDate: '2025-07-01' },
          USER_ID
        )
      ).rejects.toMatchObject({
        status: 422,
        message: 'returnDate must be after departureDate',
      });

      expect(Trip.create).not.toHaveBeenCalled();
    });

    it('accepts returnDate one day after departureDate (AC3 boundary)', async () => {
      Trip.create.mockResolvedValue({ id: 'trip-ok' });

      await expect(
        tripService.createTrip(
          { title: 'One Night', departureDate: '2025-07-01', returnDate: '2025-07-02' },
          USER_ID
        )
      ).resolves.toBeDefined();

      expect(Trip.create).toHaveBeenCalledTimes(1);
    });
  });

  // ─── listTrips ─────────────────────────────────────────────────────────────

  describe('listTrips — AC4 / BR3 / BR4: returns user-scoped trips sorted by departure date', () => {
    it('queries only trips belonging to the authenticated user (AC4, BR3)', async () => {
      Trip.find.mockReturnValue({ sort: jest.fn().mockResolvedValue([]) });

      await tripService.listTrips(USER_ID);

      expect(Trip.find).toHaveBeenCalledWith({ userId: USER_ID });
    });

    it('sorts trips by departureDate descending (AC4)', async () => {
      const sortMock = jest.fn().mockResolvedValue([]);
      Trip.find.mockReturnValue({ sort: sortMock });

      await tripService.listTrips(USER_ID);

      expect(sortMock).toHaveBeenCalledWith({ departureDate: -1 });
    });

    it('returns all trips for the user including multiple entries (AC4, BR4)', async () => {
      const trips = [
        { id: 'trip-2', title: 'Japan', departureDate: new Date('2025-09-01') },
        { id: 'trip-1', title: 'Europe', departureDate: new Date('2025-07-01') },
      ];
      Trip.find.mockReturnValue({ sort: jest.fn().mockResolvedValue(trips) });

      const result = await tripService.listTrips(USER_ID);

      expect(result).toHaveLength(2);
      expect(result).toBe(trips);
    });

    it('returns an empty array when the user has no trips (AC4)', async () => {
      Trip.find.mockReturnValue({ sort: jest.fn().mockResolvedValue([]) });

      const result = await tripService.listTrips(USER_ID);

      expect(result).toEqual([]);
    });
  });
});
