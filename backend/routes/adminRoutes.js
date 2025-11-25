const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Middleware de autenticação simples (você pode melhorar isso)
const authMiddleware = (req, res, next) => {
  const adminKey = req.headers['x-admin-key'];
  
  if (!adminKey || adminKey !== process.env.ADMIN_SECRET_KEY) {
    return res.status(401).json({ error: 'Acesso não autorizado' });
  }
  
  next();
};

// Rotas protegidas por autenticação
router.use(authMiddleware);

// Gerenciamento de eleitores
router.post('/eleitor', adminController.adicionarEleitor);
router.get('/eleitores', adminController.listarEleitores);

// Gerenciamento de candidatos
router.post('/candidato', adminController.adicionarCandidato);

// Controle da votação
router.post('/iniciar-votacao', adminController.iniciarVotacao);
router.post('/encerrar-votacao', adminController.encerrarVotacao);

// Status e resultados
router.get('/status', adminController.obterStatus);

module.exports = router;