// controllers/ProveedorController.js

const connection = require('../config/db');

// Obtener proveedores con saldo pendiente total
exports.getProveedoresConSaldoPendiente = (req, res) => {
  const query = `
    SELECT 
      p.id_proveedor,
      p.nombre AS proveedor_nombre,
      v.saldo_pendiente_total
    FROM 
      vw_saldos_por_proveedor v
    JOIN 
      proveedores p ON v.id_proveedor = p.id_proveedor
    ORDER BY 
      p.nombre ASC;
  `;

  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener los proveedores con saldo pendiente:', err);
      res.status(500).json({ message: 'Error al obtener los proveedores con saldo pendiente' });
      return;
    }

    res.json(results);
  });
};


// Obtener todos los proveedores
exports.getProveedores = (req, res) => {
  let query = "SELECT * FROM proveedores";
  const params = [];

  if (req.query.nombre) {
      query += " WHERE nombre LIKE ?";
      params.push(`%${req.query.nombre}%`);
  }

  connection.query(query, params, (err, results) => {
      if (err) {
          console.error(err);
          return res.status(500).json({ message: "Error al obtener los proveedores" });
      }
      res.json(results);
  });
}
           

// Obtener proveedor por ID
exports.getProveedorById = (req, res) => {
  const { id } = req.params;
  const query = 'SELECT * FROM proveedores WHERE id_proveedor = ?';
  connection.query(query, [id], (err, result) => {
      if (err) {
          console.error(err);
          return res.status(500).json({ message: 'Error al obtener proveedor' });
      }
      if (result.length === 0) {
          return res.status(404).json({ message: 'Proveedor no encontrado' });
      }
      res.json(result[0]);
  });
};

// Crear un nuevo proveedor
exports.createProveedor = (req, res) => {
    const { nombre, contacto, telefono, direccion } = req.body;
    const query = "INSERT INTO proveedores (nombre, contacto, telefono, direccion) VALUES (?, ?, ?, ?)";
    connection.query(query, [nombre, contacto, telefono, direccion], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Error al crear el cliente" });
          }
          res.status(201).json({ message: "Proveedor creado exitosamente" });

    });
           
        };
 

// Actualizar proveedor
exports.updateProveedor = (req, res) => {
    const { id } = req.params;
    const { nombre, contacto, telefono, direccion } = req.body;
    const query = "UPDATE proveedores SET nombre = ?, contacto = ?, telefono = ?, direccion = ? WHERE id_proveedor = ?";
    connection.query(query, [nombre, contacto, telefono,direccion,id],(err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: "Error al actualizar el proveedor" });
        }
        if (result.affectedRows === 0) {
          return res.status(404).json({ message: "Proveedor no encontrado" });
        }
        res.json({ message: "Proveedor actualizado exitosamente" });
      });
};

// Eliminar proveedor
exports.deleteProveedor = (req, res) => {
    const { id } = req.params;
    const query ="DELETE FROM proveedores WHERE id_proveedor = ?";
    connection.query(query, [id], (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: "Error al eliminar el Proveedor" });
        }
        if (result.affectedRows === 0) {
          return res.status(404).json({ message: "Proveedor no encontrado" });
        }
        res.json({ message: "Proveedor eliminado exitosamente" });
      });
    
    };

