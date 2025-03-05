import express from 'express';
import { getCompras, createCompra, getCompraById, updateCompra, deleteCompra, getCompraDetalles} from '../controllers/CompraController.js';

const router = express.Router();

router.get('/', getCompras); // Obtener todas las compras
router.get('/:id', getCompraById); // Obtener compra por ID
router.post('/', createCompra); // Crear nueva compra
router.put('/:id', updateCompra); // Actualizar compra
router.delete('/:id', deleteCompra); // Eliminar compra
router.get("/:id", getCompraDetalles);


export default router;
