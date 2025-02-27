// index.js

const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');

// Importar las rutas
const proveedorRoutes = require('./routes/proveedorRoutes');
const clienteRoutes = require('./routes/clienteRoutes');
const inventarioRoutes = require('./routes/inventarioRoutes');
const compraRoutes = require('./routes/compraRoutes');
const detallesCompraRoutes = require('./routes/detallesCompraRoutes');

// Crear una instancia de Express
const app = express();

// Habilitar CORS para todas las rutas
app.use(cors());

// Middleware para manejar JSON en las solicitudes
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true })); // Para parsear solicitudes application/x-www-form-urlencoded

// Servir los archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Usar las rutas con los prefijos correspondientes
app.use('/api/proveedores', proveedorRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/inventarios', inventarioRoutes);
app.use('/api/compras', compraRoutes);
app.use('/api/detalles_compra', detallesCompraRoutes);

// Ruta básica de prueba
app.get('/', (req, res) => {
  res.send('¡Hola, mundo! El servidor está funcionando.');
});

// Manejo de rutas no encontradas (404)
app.use((req, res, next) => {
  res.status(404).send('Página no encontrada');
});

// Manejo de errores del servidor
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Error en el servidor');
});

// Iniciar el servidor
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
