import express from 'express';
import { registrarImeis, getCantidadYRegistrados,getImeisPorDetalle  } from '../controllers/ImeisController.js';

const router = express.Router();

router.post('/:id_detalle', registrarImeis);
router.get('/:id_detalle/cantidad', getCantidadYRegistrados);
router.get('/:id_detalle', getImeisPorDetalle);

export default router;
