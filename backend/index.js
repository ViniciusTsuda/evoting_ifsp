const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Rotas
const eleitorRoutes = require('./routes/eleitorRoutes');
const votoRoutes = require('./routes/votoRoutes');
const adminRoutes = require('./routes/adminRoutes');

app.use('/api/eleitor', eleitorRoutes);
app.use('/api/voto', votoRoutes);
app.use('/api/admin', adminRoutes);

// Rota de status
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`✅ Backend rodando na porta ${PORT}`);
});