// /controllers/ClienteController.js

const connection = require('../config/db');

// Obtener todos los clientes
exports.getClientes = (req, res) => {
  let query = "SELECT * FROM clientes";
  const params = [];

  if (req.query.nombre) {
      query += " WHERE nombre LIKE ?";
      params.push(`%${req.query.nombre}%`);
  }

  connection.query(query, params, (err, results) => {
      if (err) {
          console.error(err);
          return res.status(500).json({ message: "Error al obtener los clientes" });
      }
      res.json(results);
  });
};

// Obtener cliente por ID
exports.getClienteById = (req, res) => {
  const { id } = req.params;
  const query = 'SELECT * FROM clientes WHERE id_cliente = ?';
  connection.query(query, [id], (err, result) => {
      if (err) {
          console.error(err);
          return res.status(500).json({ message: 'Error al obtener cliente' });
      }
      if (result.length === 0) {
          return res.status(404).json({ message: 'Cliente no encontrado' });
      }
      res.json(result[0]);
  });
};

// Crear un nuevo cliente
exports.createCliente = (req, res) => {
    const { nombre, telefono } = req.body;
    const query = "INSERT INTO clientes (nombre, telefono) VALUES (?, ?)";
    connection.query(query, [nombre, telefono], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Error al crear el cliente" });
        }
        res.status(201).json({ message: "Cliente creado exitosamente" });
    });
};

// Actualizar cliente
exports.updateCliente = (req, res) => {
    const { id } = req.params;
    const { nombre, telefono } = req.body;
    const query = "UPDATE clientes SET nombre = ?, telefono = ? WHERE id_cliente = ?";
    connection.query(query, [nombre, telefono, id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Error al actualizar el cliente" });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Cliente no encontrado" });
        }
        res.json({ message: "Cliente actualizado exitosamente" });
    });
};

// Eliminar cliente
exports.deleteCliente = (req, res) => {
    const { id } = req.params;
    const query ="DELETE FROM clientes WHERE id_cliente = ?";
    connection.query(query, [id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Error al eliminar el cliente" });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Cliente no encontrado" });
        }
        res.json({ message: "Cliente eliminado exitosamente" });
    });
};
