require('dotenv').config();

const authMiddleware = require('./middleware/abhaMiddleware');
const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require('./config/db');
app.use(express.json());

// Routes

app.use(cors());
app.use('/api/bundle', authMiddleware, require('./routes/bundleRoutes'));
app.use('/api/expand', authMiddleware, require('./routes/expand'));
app.use('/api/translate', authMiddleware, require('./routes/translate'));
app.use('/api/abha', require('./middleware/abhavalidator.js'));
app.use('/api/report', authMiddleware, require('./routes/report'));
app.use('/fhir',require('./routes/fhirExpandWrapper'));
app.use('/fhir',require('./routes/fhirTranslateWrapper '));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
