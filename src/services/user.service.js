const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

async function register({ username, password, fullName }) {
  const trimmedUsername = typeof username === 'string' ? username.trim() : username;
  if (!trimmedUsername || !password || !fullName) {
    const err = new Error('username, password, and fullName are required');
    err.status = 400;
    throw err;
  }
  username = trimmedUsername;

  if (password.length < 8) {
    const err = new Error('Password must be at least 8 characters');
    err.status = 400;
    throw err;
  }

  const existing = await User.findOne({ username });
  if (existing) {
    const err = new Error('Username already taken');
    err.status = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ username, fullName, passwordHash });
  return user;
}

async function login({ username, password }) {
  if (!username || !password) {
    const err = new Error('username and password are required');
    err.status = 400;
    throw err;
  }

  const user = await User.findOne({ username });
  if (!user) {
    const err = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    const err = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }

  const token = jwt.sign(
    { sub: user._id.toString(), username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  );

  return { token };
}

module.exports = { register, login };
