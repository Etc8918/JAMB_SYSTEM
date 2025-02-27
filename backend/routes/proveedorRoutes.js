// /routes/proveedorRoutes.js
const express = require('express');
const router = express.Router();
const ProveedorController = require('../controllers/ProveedorController');



// Ruta para obtener todos los proveedores
router.get('/proveedores', ProveedorController.getProveedores);

// Ruta para crear un nuevo proveedor
router.post('/proveedores', ProveedorController.createProveedor);

// Ruta para actualizar un proveedor
router.put('/proveedores/:id', ProveedorController.updateProveedor);

// Ruta para eliminar un proveedor
router.delete('/proveedores/:id', ProveedorController.deleteProveedor);

// Ruta para obtener un proveedor por ID
router.get('/proveedores/:id', ProveedorController.getProveedorById); // Revisa que esté bien definida

// Ruta para obtener proveedores con saldo pendiente
router.get('/con_saldo_pendiente', ProveedorController.getProveedoresConSaldoPendiente);

module.exports = router;