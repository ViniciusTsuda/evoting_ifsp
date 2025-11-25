const express = require('express');
const router = express.Router();
const eleitorController = require('../controllers/eleitorController');

router.post('/login', eleitorController.login);

module.exports = router;