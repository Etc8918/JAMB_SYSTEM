// /models/Proveedor.js
const connection = require('../config/db');

// Definir el modelo Proveedor
const Proveedor = {
  // Método para obtener todos los proveedores
  getAll: (callback) => {
    connection.query('SELECT * FROM proveedores', (err, results) => {
      if (err) {
        return callback(err);
      }
      callback(null, results);
    });
  },

  // Método para obtener un proveedor por su ID
  getById: (id, callback) => {
    connection.query('SELECT * FROM proveedores WHERE id_proveedor = ?', [id], (err, results) => {
      if (err) {
        return callback(err);
      }
      callback(null, results);
    });
  },

  // Método para crear un nuevo proveedor
  create: (proveedor, callback) => {
    connection.query('INSERT INTO proveedores (nombre, contacto, telefono, direccion) VALUES (?, ?, ?, ?)', 
    [proveedor.nombre, proveedor.contacto, proveedor.telefono, proveedor.direccion], (err, results) => {
      if (err) {
        return callback(err);
      }
      callback(null, results);
    });
  },

  // Método para actualizar un proveedor
  update: (id, proveedor, callback) => {
    connection.query('UPDATE proveedores SET nombre = ?, contacto = ?, telefono = ?, direccion = ? WHERE id_proveedor = ?',
    [proveedor.nombre, proveedor.contacto, proveedor.telefono, proveedor.direccion, id], (err, results) => {
      if (err) {
        return callback(err);
      }
      callback(null, results);
    });
  },

  // Método para eliminar un proveedor
  delete: (id, callback) => {
    connection.query('DELETE FROM proveedores WHERE id_proveedor = ?', [id], (err, results) => {
      if (err) {
        return callback(err);
      }
      callback(null, results);
    });
  },

  // Método para buscar proveedores por nombre
  searchByName: (nombre, callback) => {
    const query = 'SELECT * FROM proveedores WHERE nombre LIKE ?';
    connection.query(query, [`%${nombre}%`], (err, results) => {
      if (err) {
        return callback(err);
      }
      callback(null, results); // Devolver los resultados de la búsqueda
    });
  },
};

module.exports = Proveedor;
