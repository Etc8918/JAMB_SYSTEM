import express from 'express';
import { getInventarios, getDetallesPorModelo, createInventario, actualizarStockColores, agregarColor, getCapacidadesPorModelo, getColoresPorCapacidad  } from '../controllers/InventarioController.js';

const router = express.Router();

router.get('/', getInventarios);
router.get('/detalles/:id_inventario', getDetallesPorModelo);
router.get('/capacidades/:id_modelo', getCapacidadesPorModelo);
router.get('/colores/:id_modelo/:capacidad', getColoresPorCapacidad); 
router.post('/', createInventario); // ✅ Se corrigió la importación
router.put('/actualizar-stock', actualizarStockColores);
router.post('/agregar-color', agregarColor);


export default router;
