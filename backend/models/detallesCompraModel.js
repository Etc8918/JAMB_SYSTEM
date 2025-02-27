// models/detallesCompraModel.js

const db = require('../config/db');

// Obtener todos los detalles de compra
exports.getAllDetalles = (callback) => {
  const query = 'SELECT * FROM detalles_compra';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener los detalles de compra:', err);
      callback(err, null);
    } else {
      callback(null, results);
    }
  });
};

// Obtener un detalle de compra por ID
exports.getDetalleById = (id, callback) => {
  const query = 'SELECT * FROM detalles_compra WHERE id_detalle = ?';
  db.query(query, [id], (err, results) => {
    if (err) {
      console.error('Error al obtener el detalle de compra:', err);
      callback(err, null);
    } else {
      callback(null, results[0]);
    }
  });
};

// Crear un nuevo detalle de compra
exports.createDetalle = (detalleData, callback) => {
  const query = 'INSERT INTO detalles_compra SET ?';
  db.query(query, detalleData, (err, results) => {
    if (err) {
      console.error('Error al crear el detalle de compra:', err);
      callback(err, null);
    } else {
      callback(null, results.insertId);
    }
  });
};

// Actualizar un detalle de compra
exports.updateDetalle = (id, detalleData, callback) => {
  const query = 'UPDATE detalles_compra SET ? WHERE id_detalle = ?';
  db.query(query, [detalleData, id], (err, results) => {
    if (err) {
      console.error('Error al actualizar el detalle de compra:', err);
      callback(err, null);
    } else {
      callback(null, results);
    }
  });
};

// Eliminar un detalle de compra
exports.deleteDetalle = (id, callback) => {
  const query = 'DELETE FROM detalles_compra WHERE id_detalle = ?';
  db.query(query, [id], (err, results) => {
    if (err) {
      console.error('Error al eliminar el detalle de compra:', err);
      callback(err, null);
    } else {
      callback(null, results);
    }
  });
};
