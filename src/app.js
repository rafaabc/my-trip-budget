const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('../resources/swagger.json');
const connectDB = require('./config/db');

const userRoutes = require('./routes/user.routes');
const tripRoutes = require('./routes/trip.routes');

const app = express();

app.use(express.json());

app.get('/', (req, res) => res.redirect('/api-docs'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use((req, res, next) => {
  connectDB().then(() => next()).catch(next);
});

app.use('/api/users', userRoutes);
app.use('/api/trips', tripRoutes);

module.exports = app;
