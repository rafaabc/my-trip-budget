const tripService = require('../services/trip.service');

async function createTrip(req, res) {
  try {
    const trip = await tripService.createTrip(req.body, req.user.sub);
    return res.status(201).json(trip);
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
}

async function listTrips(req, res) {
  try {
    const trips = await tripService.listTrips(req.user.sub);
    return res.status(200).json(trips);
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
}

module.exports = { createTrip, listTrips };
