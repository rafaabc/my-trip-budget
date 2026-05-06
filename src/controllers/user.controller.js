const userService = require('../services/user.service');

async function register(req, res) {
  try {
    const user = await userService.register(req.body);
    return res.status(201).json(user);
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
}

async function login(req, res) {
  try {
    const result = await userService.login(req.body);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
}

module.exports = { register, login };
