// /routes/clienteRoutes.js

const express = require('express');
const router = express.Router();
const ClienteController = require('../controllers/ClienteController');

// Ruta para obtener todos los clientes
router.get('/clientes', ClienteController.getClientes);

// Ruta para crear un nuevo cliente
router.post('/clientes', ClienteController.createCliente);

// Ruta para actualizar un cliente
router.put('/clientes/:id', ClienteController.updateCliente);

// Ruta para eliminar un cliente
router.delete('/clientes/:id', ClienteController.deleteCliente);

// Ruta para obtener un cliente por ID
router.get('/clientes/:id', ClienteController.getClienteById); 

module.exports = router;
