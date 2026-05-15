const mongoose = require('mongoose');

const trackedUserIds = [];

function trackUserId(id) {
  if (id) trackedUserIds.push(id);
}

let db;

exports.mochaHooks = {
  async beforeAll() {
    await mongoose.connect(process.env.MONGODB_URI);
    db = mongoose.connection.db;
  },

  async afterAll() {
    if (!db) return;

    await db.collection('users').deleteMany({ username: /^apitest_/ });

    if (trackedUserIds.length > 0) {
      const objectIds = trackedUserIds.map(id =>
        typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id
      );
      await db.collection('trips').deleteMany({ userId: { $in: objectIds } });
    }

    await mongoose.disconnect();
  },
};

exports.trackUserId = trackUserId;
