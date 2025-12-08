require('dotenv').config();

const authMiddleware = require('./middleware/abhaMiddleware');
const express = require('express');
const app = express();
const mongoose = require('./config/db');
app.use(express.json({limit:'2mb'}));
const fhirTranslateWrapper = require("./routes/fhirTranslateWrapper .js");
const fhirExpandWrapper = require("./routes/fhirExpandWrapper.js");
// Routes
app.use('/api', authMiddleware, require('./routes/bundleRoutes'));
app.use('/api/expand', authMiddleware, require('./routes/expand'));
app.use('/api/translate', authMiddleware, require('./routes/translate'));
app.use('/api/abha', require('./middleware/abhavalidator.js'));
app.use('/api/report', authMiddleware, require('./routes/report'));
app.use("/fhir", fhirTranslateWrapper);
app.use("/fhir", fhirExpandWrapper);
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
