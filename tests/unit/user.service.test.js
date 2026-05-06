const bcrypt = require('bcryptjs');
const User = require('../../src/models/user.model');
const userService = require('../../src/services/user.service');

jest.mock('../../src/models/user.model');
jest.mock('bcryptjs');

describe('userService.register (US-01 / SCRUM-5)', () => {
  const validPayload = {
    username: 'john_doe',
    password: 'secret123',
    fullName: 'John Doe',
  };

  beforeEach(() => {
    bcrypt.hash.mockResolvedValue('hashed-password');
  });

  describe('AC1: valid registration creates the user', () => {
    it('persists user with hashed password and returns it (AC1)', async () => {
      User.findOne.mockResolvedValue(null);
      const created = { _id: 'abc', username: 'john_doe', fullName: 'John Doe' };
      User.create.mockResolvedValue(created);

      const result = await userService.register(validPayload);

      expect(User.findOne).toHaveBeenCalledWith({ username: 'john_doe' });
      expect(User.create).toHaveBeenCalledWith({
        username: 'john_doe',
        fullName: 'John Doe',
        passwordHash: 'hashed-password',
      });
      expect(User.create).toHaveBeenCalledTimes(1);
      expect(result).toBe(created);
    });

    it('hashes password with bcrypt using 10 salt rounds (AC1)', async () => {
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue({});

      await userService.register(validPayload);

      expect(bcrypt.hash).toHaveBeenCalledWith('secret123', 10);
    });

    it('does not store the plaintext password (AC1)', async () => {
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue({});

      await userService.register(validPayload);

      const createArg = User.create.mock.calls[0][0];
      expect(createArg).not.toHaveProperty('password');
      expect(createArg.passwordHash).toBe('hashed-password');
    });
  });

  describe('AC2 / BR1: duplicate username is rejected', () => {
    it('throws 409 when username already exists (AC2)', async () => {
      User.findOne.mockResolvedValue({ _id: 'existing', username: 'john_doe' });

      await expect(userService.register(validPayload)).rejects.toMatchObject({
        status: 409,
        message: 'Username already taken',
      });

      expect(User.create).not.toHaveBeenCalled();
    });
  });

  describe('AC3 / BR2: password length policy', () => {
    it('throws 400 when password has fewer than 8 characters (AC3)', async () => {
      User.findOne.mockResolvedValue(null);

      await expect(
        userService.register({ ...validPayload, password: 'abc' })
      ).rejects.toMatchObject({
        status: 400,
        message: 'Password must be at least 8 characters',
      });

      expect(User.create).not.toHaveBeenCalled();
    });

    it('accepts password with exactly 8 characters (AC3 boundary)', async () => {
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue({ _id: 'ok' });

      await expect(
        userService.register({ ...validPayload, password: 'abcdefgh' })
      ).resolves.toBeDefined();

      expect(User.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('Base validation: required fields', () => {
    it.each([
      ['username', { password: 'secret123', fullName: 'John Doe' }],
      ['password', { username: 'john_doe', fullName: 'John Doe' }],
      ['fullName', { username: 'john_doe', password: 'secret123' }],
    ])('throws 400 when %s is missing', async (_field, payload) => {
      await expect(userService.register(payload)).rejects.toMatchObject({
        status: 400,
        message: 'username, password, and fullName are required',
      });

      expect(User.findOne).not.toHaveBeenCalled();
      expect(User.create).not.toHaveBeenCalled();
    });
  });
});
