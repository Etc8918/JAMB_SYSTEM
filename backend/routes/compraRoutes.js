// /routes/compraRoutes.js

const express = require('express');
const router = express.Router();
const CompraController = require('../controllers/CompraController');

// Ruta para obtener todos los proveedores
router.get('/proveedores', CompraController.getProveedores);

// Ruta para obtener todos los inventarios
router.get('/inventarios', CompraController.getInventarios);

// Ruta para obtener capacidades y colores según el modelo
router.get('/modelos_capacidades', CompraController.getCapacidadesColores);

// Ruta para crear una nueva compra
router.post('/compras', CompraController.createCompra);

// Ruta para crear un nuevo detalle de compra
router.post('/detalles_compra', CompraController.createDetalleCompra);

// Ruta para crear un nuevo inventario
router.post('/inventarios', CompraController.createInventario);

router.get('/capacidades_colores', CompraController.getCapacidadesColores);

// Ruta para obtener todas las compras con sus detalles y proveedor
router.get('/compras_con_detalles', CompraController.getComprasConDetalles)

// Ruta para obtener compras y detalles por proveedor
router.get('/compras_por_proveedor/:proveedorId', CompraController.getComprasPorProveedor);


module.exports = router;
