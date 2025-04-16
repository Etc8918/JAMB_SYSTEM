import express from 'express';
import { createCompra, getCompraById, updateCompra, deleteCompra, getCompraDetalles,getCapacidadesPorModelo,getColoresPorEquipo, getModelos, getIdInventario,getIdInventarioPorDetalles,getInventarioId,getComprasPorProveedor} from '../controllers/CompraController.js';
import { obtenerDetallesPorCompra } from "../controllers/CompraController.js";
const router = express.Router();

router.get('/modelos', getModelos);

// Obtener todas las compras
//router.get('/:id', getCompraById); // Obtener compra por ID
router.post('/', createCompra); // Crear nueva compra
router.put('/:id', updateCompra); // Actualizar compra
router.delete('/:id', deleteCompra); // Eliminar compra
router.get("/:id", getCompraDetalles);
router.get('/capacidades/:id_tipo/:id_marca/:id_modelo', getCapacidadesPorModelo);
router.get('/colores/:id_tipo/:id_marca/:id_modelo/:id_capacidad', getColoresPorEquipo);
router.get('/id/:id_tipo/:id_marca/:id_modelo/:id_capacidad/:id_color', getIdInventario);
router.get('/id/:id_tipo/:id_marca/:id_modelo/:id_capacidad/:id_color', getIdInventarioPorDetalles);
router.get('/inventario/id/:id_tipo/:id_marca/:id_modelo/:id_capacidad/:id_color', getInventarioId);
router.get('/compras_por_proveedor/:id', getComprasPorProveedor);
router.get('/detalles/:id_compra', obtenerDetallesPorCompra);





export default router;
