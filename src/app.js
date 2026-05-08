const express = require('express');
const swaggerDocument = require('../resources/swagger.json');
const connectDB = require('./config/db');

const userRoutes = require('./routes/user.routes');
const tripRoutes = require('./routes/trip.routes');

const app = express();

app.use(express.json());

app.get('/', (req, res) => res.redirect('/api-docs'));

app.get('/api-docs/swagger.json', (req, res) => res.json(swaggerDocument));

app.get('/api-docs', (req, res) => {
  res.send(`<!DOCTYPE html>
<html>
<head>
  <title>My Trip Budget API</title>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist/swagger-ui.css">
</head>
<body>
<div id="swagger-ui"></div>
<script src="https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js"></script>
<script>
  SwaggerUIBundle({
    url: '/api-docs/swagger.json',
    dom_id: '#swagger-ui',
    presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
    layout: 'BaseLayout'
  });
</script>
</body>
</html>`);
});

app.use((req, res, next) => {
  connectDB().then(() => next()).catch(next);
});

app.use('/api/users', userRoutes);
app.use('/api/trips', tripRoutes);

module.exports = app;
