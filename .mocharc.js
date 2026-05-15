module.exports = {
  spec: 'tests/api/test/**/*.test.js',
  timeout: 30000,
  require: ['dotenv/config', 'tests/api/test/hooks/cleanup.js', 'tests/api/test/hooks/auth.js'],
};
