// routes/inventarioRoutes.js

const express = require('express');
const router = express.Router();
const InventarioController = require('../controllers/InventarioController');

// Ruta para obtener todos los inventarios
router.get('/', InventarioController.getInventarios);

// Ruta para crear un nuevo inventario
router.post('/', InventarioController.createInventario);

// Ruta para obtener un inventario por ID
router.get('/:id', InventarioController.getInventarioById);

// Ruta para actualizar un inventario
router.put('/:id', InventarioController.updateInventario);

// Ruta para eliminar un inventario
router.delete('/:id', InventarioController.deleteInventario);

// Ruta para actualizar la cantidad de un color específico de un inventario
router.put('/:id/color/:color', InventarioController.updateInventarioColor);

module.exports = router;
