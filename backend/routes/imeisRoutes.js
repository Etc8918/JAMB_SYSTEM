import express from 'express';
import { getCantidadYRegistrados,getImeisPorDetalle, guardarImeis  } from '../controllers/ImeisController.js';

const router = express.Router();

router.get('/:id_detalle/cantidad', getCantidadYRegistrados);
router.get('/:id_detalle', getImeisPorDetalle);
router.post("/:id", guardarImeis);

export default router;
