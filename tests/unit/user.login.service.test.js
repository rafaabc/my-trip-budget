const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../src/models/user.model');
const userService = require('../../src/services/user.service');

jest.mock('../../src/models/user.model');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('userService.login (US-02 / SCRUM-6)', () => {
  const validPayload = { username: 'john_doe', password: 'secret123' };
  const storedUser = {
    _id: { toString: () => 'user-id-abc' },
    username: 'john_doe',
    passwordHash: 'hashed-password',
  };

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_EXPIRES_IN = '1h';
  });

  describe('AC1: valid credentials return 200 and auth token', () => {
    it('returns a token when credentials are correct (AC1)', async () => {
      User.findOne.mockResolvedValue(storedUser);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('signed-token');

      const result = await userService.login(validPayload);

      expect(result).toEqual({ token: 'signed-token' });
    });

    it('calls bcrypt.compare with provided password and stored hash (AC1)', async () => {
      User.findOne.mockResolvedValue(storedUser);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('signed-token');

      await userService.login(validPayload);

      expect(bcrypt.compare).toHaveBeenCalledWith('secret123', 'hashed-password');
    });
  });

  describe('AC4: returned token encodes correct payload', () => {
    it('signs JWT with sub (userId string) and username (AC4)', async () => {
      User.findOne.mockResolvedValue(storedUser);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('signed-token');

      await userService.login(validPayload);

      expect(jwt.sign).toHaveBeenCalledWith(
        { sub: 'user-id-abc', username: 'john_doe' },
        'test-secret',
        { expiresIn: '1h' }
      );
    });
  });

  describe('AC2 / BR1: invalid credentials return 401', () => {
    it('throws 401 when username does not exist (AC2, BR1)', async () => {
      User.findOne.mockResolvedValue(null);

      await expect(userService.login(validPayload)).rejects.toMatchObject({
        status: 401,
        message: 'Invalid credentials',
      });

      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(jwt.sign).not.toHaveBeenCalled();
    });

    it('throws 401 when password is wrong (AC2)', async () => {
      User.findOne.mockResolvedValue(storedUser);
      bcrypt.compare.mockResolvedValue(false);

      await expect(userService.login(validPayload)).rejects.toMatchObject({
        status: 401,
        message: 'Invalid credentials',
      });

      expect(jwt.sign).not.toHaveBeenCalled();
    });
  });

  describe('AC3: missing required fields return 400', () => {
    it.each([
      ['username', { password: 'secret123' }],
      ['password', { username: 'john_doe' }],
    ])('throws 400 when %s is missing (AC3)', async (_field, payload) => {
      await expect(userService.login(payload)).rejects.toMatchObject({
        status: 400,
        message: 'username and password are required',
      });

      expect(User.findOne).not.toHaveBeenCalled();
      expect(jwt.sign).not.toHaveBeenCalled();
    });
  });
});
