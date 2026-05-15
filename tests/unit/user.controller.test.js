const userService = require('../../src/services/user.service');
const { register, login } = require('../../src/controllers/user.controller');

jest.mock('../../src/services/user.service');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('userController.register', () => {
  it('returns 201 with user on success', async () => {
    const req = { body: { username: 'john', password: 'pass', fullName: 'John' } };
    const res = mockRes();
    userService.register.mockResolvedValue({ id: '1', username: 'john' });

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: '1', username: 'john' });
  });

  it('returns err.status when service throws with status', async () => {
    const req = { body: {} };
    const res = mockRes();
    const err = Object.assign(new Error('Conflict'), { status: 409 });
    userService.register.mockRejectedValue(err);

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ message: 'Conflict' });
  });

  it('returns 500 when error has no status', async () => {
    const req = { body: {} };
    const res = mockRes();
    userService.register.mockRejectedValue(new Error('unexpected'));

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('userController.login', () => {
  it('returns 200 with token on success', async () => {
    const req = { body: { username: 'john', password: 'pass' } };
    const res = mockRes();
    userService.login.mockResolvedValue({ token: 'jwt-token' });

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ token: 'jwt-token' });
  });

  it('returns err.status when service throws with status', async () => {
    const req = { body: {} };
    const res = mockRes();
    const err = Object.assign(new Error('Invalid credentials'), { status: 401 });
    userService.login.mockRejectedValue(err);

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid credentials' });
  });

  it('returns 500 when error has no status', async () => {
    const req = { body: {} };
    const res = mockRes();
    userService.login.mockRejectedValue(new Error('unexpected'));

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
