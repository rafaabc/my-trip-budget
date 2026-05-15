jest.mock('../../src/config/db');
jest.mock('../../src/services/user.service');

const request = require('supertest');
const connectDB = require('../../src/config/db');
const userService = require('../../src/services/user.service');
const app = require('../../src/app');

describe('app', () => {
  beforeEach(() => {
    connectDB.mockResolvedValue({});
  });

  describe('built-in routes', () => {
    it('GET / redirects to /api-docs', async () => {
      const res = await request(app).get('/');
      expect(res.status).toBe(302);
      expect(res.headers.location).toMatch('/api-docs');
    });

    it('GET /api-docs/swagger.json returns the swagger document', async () => {
      const res = await request(app).get('/api-docs/swagger.json');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('info');
    });

    it('GET /api-docs returns Swagger UI HTML', async () => {
      const res = await request(app).get('/api-docs');
      expect(res.status).toBe(200);
      expect(res.text).toContain('swagger-ui');
    });
  });

  describe('DB connection middleware', () => {
    it('calls next and processes request when DB connects', async () => {
      userService.register.mockResolvedValue({ id: '1', username: 'test' });

      const res = await request(app)
        .post('/api/users/register')
        .send({ username: 'test', password: 'pass', fullName: 'Test' });

      expect(connectDB).toHaveBeenCalled();
      expect(res.status).toBe(201);
    });

    it('propagates DB connection error as 500', async () => {
      connectDB.mockRejectedValueOnce(new Error('DB down'));

      const res = await request(app).post('/api/users/register').send({});

      expect(res.status).toBe(500);
    });
  });
});
