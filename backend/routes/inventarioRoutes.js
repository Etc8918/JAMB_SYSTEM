const express = require('express');
const router = express.Router();
const InventarioController = require('../controllers/InventarioController');

// Ruta para obtener todos los inventarios
router.get('/inventarios', InventarioController.getInventarios);

// Ruta para crear un nuevo inventario
router.post('/inventarios', InventarioController.createInventario);

// Ruta para actualizar un inventario
router.put('/inventarios/:id', InventarioController.updateInventario);

// Ruta para eliminar un inventario
router.delete('/inventarios/:id', InventarioController.deleteInventario);

// Ruta para obtener un inventario por ID
router.get('/inventarios/:id', InventarioController.getInventarioById);

// Ruta para actualizar la cantidad de un color específico de un inventario
router.put('/inventarios/:id/color/:color', InventarioController.updateInventarioColor);

module.exports = router;
