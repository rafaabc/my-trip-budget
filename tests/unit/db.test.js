describe('connectDB', () => {
  beforeEach(() => {
    jest.resetModules();
    delete global._mongoConnection;
    process.env.MONGODB_URI = 'mongodb://localhost/testdb';
  });

  it('creates connection and caches it on first call', async () => {
    jest.mock('mongoose', () => ({
      connect: jest.fn().mockResolvedValue('mock-conn'),
    }));
    const connectDB = require('../../src/config/db');
    const mongoose = require('mongoose');

    const result = await connectDB();

    expect(mongoose.connect).toHaveBeenCalledWith('mongodb://localhost/testdb');
    expect(result).toBe('mock-conn');
  });

  it('returns cached conn without reconnecting on second call', async () => {
    jest.mock('mongoose', () => ({
      connect: jest.fn().mockResolvedValue('mock-conn'),
    }));
    const connectDB = require('../../src/config/db');
    const mongoose = require('mongoose');

    await connectDB();
    const result = await connectDB();

    expect(mongoose.connect).toHaveBeenCalledTimes(1);
    expect(result).toBe('mock-conn');
  });

  it('reuses pending promise for concurrent calls', async () => {
    let mockResolve;
    const mockPending = new Promise((r) => { mockResolve = r; });
    jest.mock('mongoose', () => ({
      connect: jest.fn().mockReturnValue(mockPending),
    }));
    const connectDB = require('../../src/config/db');
    const mongoose = require('mongoose');

    const p1 = connectDB();
    const p2 = connectDB();
    mockResolve('mock-conn');
    const [r1, r2] = await Promise.all([p1, p2]);

    expect(mongoose.connect).toHaveBeenCalledTimes(1);
    expect(r1).toBe('mock-conn');
    expect(r2).toBe('mock-conn');
  });

  it('picks up existing global connection cache without reconnecting', async () => {
    global._mongoConnection = { conn: 'existing-conn', promise: null };
    jest.mock('mongoose', () => ({
      connect: jest.fn(),
    }));
    const connectDB = require('../../src/config/db');
    const mongoose = require('mongoose');

    const result = await connectDB();

    expect(mongoose.connect).not.toHaveBeenCalled();
    expect(result).toBe('existing-conn');
  });
});
