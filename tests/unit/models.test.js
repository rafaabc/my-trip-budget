const User = require('../../src/models/user.model');
const Trip = require('../../src/models/trip.model');

describe('User model toJSON transform', () => {
  const transform = User.schema.options.toJSON.transform;

  it('maps _id to id and removes __v and passwordHash', () => {
    const ret = {
      _id: 'abc123',
      __v: 0,
      passwordHash: 'hashed',
      username: 'john',
      fullName: 'John Doe',
    };

    transform({}, ret);

    expect(ret.id).toBe('abc123');
    expect(ret._id).toBeUndefined();
    expect(ret.__v).toBeUndefined();
    expect(ret.passwordHash).toBeUndefined();
    expect(ret.username).toBe('john');
    expect(ret.fullName).toBe('John Doe');
  });
});

describe('Trip model toJSON transform', () => {
  const transform = Trip.schema.options.toJSON.transform;

  it('maps _id to id and removes __v', () => {
    const ret = {
      _id: 'trip-id',
      __v: 0,
      title: 'Paris',
      userId: 'user-id',
    };

    transform({}, ret);

    expect(ret.id).toBe('trip-id');
    expect(ret._id).toBeUndefined();
    expect(ret.__v).toBeUndefined();
    expect(ret.title).toBe('Paris');
    expect(ret.userId).toBe('user-id');
  });
});
