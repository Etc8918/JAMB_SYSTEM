// routes/detallesCompraRoutes.js

const express = require('express');
const router = express.Router();
const detallesCompraController = require('../controllers/detallesCompraController');

// GET /api/detalles_compra/
router.get('/', detallesCompraController.listar);

// GET /api/detalles_compra/:id
router.get('/:id', detallesCompraController.obtenerPorId);

// POST /api/detalles_compra/
router.post('/', detallesCompraController.crear);

// PUT /api/detalles_compra/:id
router.put('/:id', detallesCompraController.actualizar);

// DELETE /api/detalles_compra/:id
router.delete('/:id', detallesCompraController.eliminar);

module.exports = router;
