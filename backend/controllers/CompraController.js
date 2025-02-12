// /controllers/CompraController.js

const connection = require('../config/db');

// Obtener todos los proveedores
exports.getProveedores = (req, res) => {
  const query = "SELECT * FROM proveedores";
  connection.query(query, (err, results) => {
      if (err) {
          console.error(err);
          return res.status(500).json({ message: "Error al obtener los proveedores" });
      }
      res.json(results);
  });
};

// Obtener todos los inventarios
exports.getInventarios = (req, res) => {
  const query = "SELECT * FROM inventario";
  connection.query(query, (err, results) => {
      if (err) {
          console.error(err);
          return res.status(500).json({ message: "Error al obtener los inventarios" });
      }
      res.json(results);
  });
};

// Obtener capacidades y colores según el modelo
exports.getCapacidadesColores = (req, res) => {
  const { modelo } = req.query;
  const query = "SELECT capacidad, color FROM inventario WHERE modelo = ?";
  connection.query(query, [modelo], (err, results) => {
      if (err) {
          console.error(err);
          return res.status(500).json({ message: "Error al obtener las capacidades y colores" });
      }
      res.json(results);
  });
};

// Crear una nueva compra
exports.createCompra = (req, res) => {
  const { proveedor_id, costo_total, saldo_favor, saldo_pendiente, detalles } = req.body;
  const fecha = new Date().toISOString().slice(0, 10); // Obtener fecha actual

  const query = "INSERT INTO compras (fecha, proveedor_id, estado, costo_total, saldo_favor, saldo_pendiente) VALUES (?, ?, 'pendiente', ?, ?, ?)";
  connection.query(query, [fecha, proveedor_id, costo_total, saldo_favor, saldo_pendiente], (err, result) => {
    if (err) {
      console.error('Error en la base de datos:', err);
      return res.status(500).json({ message: "Error al crear la compra", error: err });
    }

    const id_compra = result.insertId;

    // Insertar detalles de compra
    detalles.forEach(detalle => {
      // Asegurar que el valor de tipo no exceda la longitud permitida
      const tipo = detalle.tipo ? detalle.tipo.substring(0, 255) : 'default_tipo';
      const marca = detalle.marca || 'default_marca';
      const detalleQuery = "INSERT INTO detalles_compra (id_compra, modelo, capacidad, color, cantidad, costo, tipo, marca) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
      connection.query(detalleQuery, [id_compra, detalle.modelo, detalle.capacidad, detalle.color, detalle.cantidad, detalle.costo, tipo, marca], (detalleErr) => {
        if (detalleErr) {
          console.error('Error al insertar detalle de compra:', detalleErr);
        }
      });
    });

    res.status(201).json({ message: "Compra creada exitosamente", id_compra: id_compra });
  });
};




// Crear un nuevo detalle de compra
exports.createDetalleCompra = (req, res) => {
  const { id_compra, modelo, capacidad, color, cantidad, costo, tipo, marca } = req.body;
  const query = "INSERT INTO detalles_compra (id_compra, modelo, capacidad, color, cantidad, costo, tipo, marca) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
  connection.query(query, [id_compra, modelo, capacidad, color, cantidad, costo, tipo, marca], (err, result) => {
      if (err) {
          console.error(err);
          return res.status(500).json({ message: "Error al crear el detalle de compra" });
      }
      res.status(201).json({ message: "Detalle de compra creado exitosamente" });
  });
};

// Crear un nuevo inventario
exports.createInventario = (req, res) => {
  const { tipo, marca, modelo, capacidad, color} = req.body;
  let { stock } = req.body

  ;

  ;

  // Si stock es undefined o null, asignar el valor predeterminado 0
  stock = stock !== undefined && stock !== null ? stock : 0;

  // Verificar que todos los campos estén presentes
  if (!tipo || !marca || !modelo || !capacidad || !color) {
    return res.status(400).json({ message: "Todos los campos son obligatorios" });
  }

  const query = "INSERT INTO inventario (tipo, marca, modelo, capacidad, color, stock) VALUES (?, ?, ?, ?, ?, ?)";
  connection.query(query, [tipo, marca, modelo, capacidad, color, stock], (err, result) => {
    if (err) {
      console.error('Error en la base de datos:', err);  // Log del error del servidor
      return res.status(500).json({ message: "Error al crear el inventario", error: err });
    }
    res.status(201).json({ message: "Inventario creado exitosamente" });
  });
};