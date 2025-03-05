import mysql from 'mysql2/promise';

// 📌 Crear la conexión a la base de datos
export const pool = mysql.createPool({
    host: 'localhost',  // Cambiar si la BD está en otro servidor
    user: 'root',       // Usuario de la BD
    password: 'root',       // Contraseña de la BD
    database: 'bd_jamb', // Nombre de la BD
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

console.log("✅ Conexión a la base de datos establecida correctamente.");
