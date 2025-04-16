import express from 'express';
import path from 'path';
import cors from 'cors';
import bodyParser from 'body-parser';
import errorHandler from './middleware/errorHandler.js';
import imeisRoutes from './routes/imeisRoutes.js';
import proveedorRoutes from './routes/proveedorRoutes.js';
import clienteRoutes from './routes/clienteRoutes.js';
import inventarioRoutes from './routes/inventarioRoutes.js';
import compraRoutes from './routes/compraRoutes.js';
import detallesCompraRoutes from './routes/detallesCompraRoutes.js'; // ✅ Importación corregida

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configuración para archivos estáticos en ES6
import { fileURLToPath } from 'url';
import { dirname } from 'path';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
app.use(express.static(path.join(__dirname, '../frontend')));
app.use(express.static(path.join(__dirname, '../frontend/views')));
console.log("🟡 Rutas cargadas correctamente");
// Rutas
app.use('/api/proveedores', proveedorRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/inventario', inventarioRoutes);
app.use('/api/compras', compraRoutes);
app.use('/api/detalles_compra', detallesCompraRoutes); // ✅ Asegurar que se está usando correctamente
app.use('/api/imeis', imeisRoutes);
app.use(errorHandler);
// Servidor
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${port}`);
});
