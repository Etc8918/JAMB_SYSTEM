import express from 'express';
import { getProveedores, createProveedor, updateProveedor, deleteProveedor,getProveedoresConSaldoPendiente  } from '../controllers/ProveedorController.js';

const router = express.Router();

router.get('/', getProveedores);
router.post('/', createProveedor);
router.put('/:id', updateProveedor);
router.delete('/:id', deleteProveedor);
router.get('/con_saldo_pendiente', getProveedoresConSaldoPendiente);


export default router;
