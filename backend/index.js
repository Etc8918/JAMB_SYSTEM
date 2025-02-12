const express = require('express');
const path = require('path');
const cors = require('cors');  // Importar el paquete cors
const proveedorRoutes = require('./routes/proveedorRoutes'); // Importar las rutas de proveedores
const clienteRoutes = require('./routes/clienteRoutes');
const inventarioRoutes = require('./routes/inventarioRoutes');
const compraRoutes = require('./routes/compraRoutes');
const connection = require('./config/db');  // Configuración de la base de datos

// Crear una instancia de Express
const app = express();

// Habilitar CORS para todas las rutas
app.use(cors());  // Esto permite que tu frontend haga solicitudes al backend

// Servir los archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../frontend')));  // Sirve todo lo que esté en frontend/

// Middleware para manejar JSON en las solicitudes
app.use(express.json());


// Usar las rutas de proveedores antes de las de clientes
app.use(proveedorRoutes); // Usar las rutas de proveedores
app.use(clienteRoutes); //Usar las rutas de clientes
app.use(inventarioRoutes);
app.use(compraRoutes)
// Ruta básica de prueba
app.get('/', (req, res) => {
  res.send('¡Hola, mundo! El servidor está funcionando.');
});

// Iniciar el servidor
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
