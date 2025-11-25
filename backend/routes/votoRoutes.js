const express = require('express');
const router = express.Router();
const votoController = require('../controllers/votoController');

router.post('/votar', votoController.votar);
router.get('/resultados', votoController.obterResultados);
router.get('/status', votoController.obterStatus);

module.exports = router;