// /controllers/InventarioController.js

const connection = require('../config/db');

// Obtener todos los inventarios
exports.getInventarios = (req, res) => {
  let query = "SELECT * FROM inventario";
  const params = [];

  if (req.query.modelo) {
      query += " WHERE modelo LIKE ?";
      params.push(`%${req.query.modelo}%`);
  }

  connection.query(query, params, (err, results) => {
      if (err) {
          console.error(err);
          return res.status(500).json({ message: "Error al obtener los inventarios" });
      }
      res.json(results);
  });
};

// Obtener inventario por ID
exports.getInventarioById = (req, res) => {
  const { id } = req.params;
  const query = 'SELECT * FROM inventario WHERE id_inventario = ?';
  connection.query(query, [id], (err, result) => {
      if (err) {
          console.error(err);
          return res.status(500).json({ message: 'Error al obtener inventario' });
      }
      if (result.length === 0) {
          return res.status(404).json({ message: 'Inventario no encontrado' });
      }
      res.json(result[0]);
  });
};

// Crear un nuevo inventario
exports.createInventario = (req, res) => {
    const { tipo, marca, modelo, capacidad, color, stock } = req.body;
    const query = "INSERT INTO inventario (tipo, marca, modelo, capacidad, color, stock) VALUES (?, ?, ?, ?, ?, ?)";
    connection.query(query, [tipo, marca, modelo, capacidad, color, stock], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Error al crear el inventario" });
        }
        res.status(201).json({ message: "Inventario creado exitosamente" });
    });
};

// Actualizar inventario
exports.updateInventario = (req, res) => {
    const { id } = req.params;
    const { tipo, marca, modelo, capacidad, color, stock } = req.body;
    const query = "UPDATE inventario SET tipo = ?, marca = ?, modelo = ?, capacidad = ?, color = ?, stock = ? WHERE id_inventario = ?";
    connection.query(query, [tipo, marca, modelo, capacidad, color, stock, id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Error al actualizar el inventario" });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Inventario no encontrado" });
        }
        res.json({ message: "Inventario actualizado exitosamente" });
    });
};

// Eliminar inventario
exports.deleteInventario = (req, res) => {
    const { id } = req.params;
    const query = "DELETE FROM inventario WHERE id_inventario = ?";
    connection.query(query, [id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Error al eliminar el inventario" });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Inventario no encontrado" });
        }
        res.json({ message: "Inventario eliminado exitosamente" });
    });
};
