import express from 'express';
import { getDetallesCompra, getDetalleCompraById, createDetalleCompra, updateDetalleCompra, deleteDetalleCompra } from '../controllers/detallesCompraController.js';

const router = express.Router();

router.get('/', getDetallesCompra);
router.get('/:id', getDetalleCompraById);
router.post('/', createDetalleCompra);
router.put('/:id', updateDetalleCompra);
router.delete('/:id', deleteDetalleCompra);

export default router; // ✅ Asegurar que exportamos `router` correctamente
