const mysql = require('mysql2');

// Crear una nueva conexión a la base de datos
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'bd_jamb'
});

// Función para reconectar
const handleDisconnect = () => {

// Conectar a la base de datos
connection.connect(err => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err);
    return;
  }
  console.log('Conexión exitosa a la base de datos');
});

connection.on('error', err => {
  console.error('Error en la conexión a la base de datos:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    handleDisconnect(); // Reconectar si la conexión se pierde
  } else {
    throw err;
  }
});
};

handleDisconnect();
// Exportar la conexión para usarla en otros archivos
module.exports = connection;
