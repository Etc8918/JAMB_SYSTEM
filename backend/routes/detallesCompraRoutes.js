import express from 'express';
import { getDetallesCompra, getDetalleCompraById, createDetalleCompra, updateDetalleCompra, deleteDetalleCompra} from '../controllers/detallesCompraController.js';
import { getCantidadYRegistrados } from "../controllers/ImeisController.js";
const router = express.Router();

router.get('/', getDetallesCompra);
router.get('/:id', getDetalleCompraById);
router.post('/', createDetalleCompra);
router.put('/:id', updateDetalleCompra);
router.delete('/:id', deleteDetalleCompra);
router.get("/:id_detalle/cantidad", getCantidadYRegistrados);


export default router; // ✅ Asegurar que exportamos `router` correctamente
