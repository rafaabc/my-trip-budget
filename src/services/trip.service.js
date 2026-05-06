const Trip = require('../models/trip.model');

function parseDate(value, fieldName) {
  const d = new Date(value);
  if (isNaN(d.getTime())) {
    const err = new Error(`${fieldName} is not a valid date`);
    err.status = 400;
    throw err;
  }
  return d;
}

async function createTrip({ title, departureDate, returnDate }, userId) {
  if (!title || !departureDate || !returnDate) {
    const err = new Error('title, departureDate, and returnDate are required');
    err.status = 400;
    throw err;
  }

  const departure = parseDate(departureDate, 'departureDate');
  const returnD = parseDate(returnDate, 'returnDate');

  if (returnD <= departure) {
    const err = new Error('returnDate must be after departureDate');
    err.status = 422;
    throw err;
  }

  const trip = await Trip.create({ userId, title, departureDate: departure, returnDate: returnD });
  return trip;
}

async function listTrips(userId) {
  const trips = await Trip.find({ userId }).sort({ departureDate: -1 });
  return trips;
}

module.exports = { createTrip, listTrips };
