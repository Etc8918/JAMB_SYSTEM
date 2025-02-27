const connection = require('../config/db');

// Función para manejar errores
const handleError = (err, res, message) => {
  console.error(err);
  return res.status(500).json({ message });
};

// Obtener todos los proveedores
exports.getProveedores = (req, res) => {
  const query = "SELECT * FROM proveedores";
  connection.query(query, (err, results) => {
    if (err) return handleError(err, res, "Error al obtener los proveedores");
    res.json(results);
  });
};

// Obtener todos los inventarios
exports.getInventarios = (req, res) => {
  const query = "SELECT * FROM inventario";
  connection.query(query, (err, results) => {
    if (err) return handleError(err, res, "Error al obtener los inventarios");
    res.json(results);
  });
};

// Obtener capacidades y colores según el modelo y la marca
exports.getCapacidadesColores = (req, res) => {
  const { modelo, marca } = req.query;
  const query = "SELECT capacidad, color FROM inventario WHERE modelo = ? AND marca = ?";
  connection.query(query, [modelo, marca], (err, results) => {
    if (err) return handleError(err, res, "Error al obtener las capacidades y colores");
    res.json(results);
  });
};



// Crear una nueva compra
exports.createCompra = (req, res) => {
  console.log('Solicitud recibida en el servidor:', req.body); // Verificar los datos recibidos

  const { proveedor_id, costo_total, saldo_favor, saldo_pendiente, detalles } = req.body;
  const fecha = new Date().toISOString().slice(0, 10);

  connection.beginTransaction(err => {
    if (err) return handleError(err, res, "Error al iniciar la transacción");

    const query = "INSERT INTO compras (fecha, proveedor_id, estado, costo_total, saldo_favor, saldo_pendiente) VALUES (?, ?, 'pendiente', ?, ?, ?)";
    connection.query(query, [fecha, proveedor_id, costo_total, saldo_favor, saldo_pendiente], (err, result) => {
      if (err) {
        connection.rollback(() => handleError(err, res, "Error al crear la compra"));
        return;
      }

      const id_compra = result.insertId;
      console.log('Compra creada con ID:', id_compra); // Verificar ID de compra

      // Insertar detalles de compra
      const detallePromises = detalles.map(detalle => {
        const tipo = detalle.tipo ? detalle.tipo.substring(0, 255) : 'default_tipo';
        const marca = detalle.marca || 'default_marca';
        const detalleQuery = "INSERT INTO detalles_compra (id_compra, modelo, capacidad, color, cantidad, costo, tipo, marca) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        return new Promise((resolve, reject) => {
          connection.query(detalleQuery, [id_compra, detalle.modelo, detalle.capacidad, detalle.color, detalle.cantidad, detalle.costo, tipo, marca], (detalleErr) => {
            if (detalleErr) reject(detalleErr);
            else resolve();
          });
        });
      });

      Promise.all(detallePromises)
        .then(() => {
          connection.commit(commitErr => {
            if (commitErr) {
              connection.rollback(() => handleError(commitErr, res, "Error al confirmar la transacción"));
              return;
            }
            res.status(201).json({ message: "Compra creada exitosamente", id_compra });
          });
        })
        .catch((detalleErr) => {
          connection.rollback(() => handleError(detalleErr, res, "Error al insertar detalle de compra"));
        });
    });
  });
};



// Crear un nuevo detalle de compra
exports.createDetalleCompra = (req, res) => {
  const { id_compra, modelo, capacidad, color, cantidad, costo, tipo, marca } = req.body;
  const query = "INSERT INTO detalles_compra (id_compra, modelo, capacidad, color, cantidad, costo, tipo, marca) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
  connection.query(query, [id_compra, modelo, capacidad, color, cantidad, costo, tipo, marca], (err, result) => {
    if (err) return handleError(err, res, "Error al crear el detalle de compra");
    res.status(201).json({ message: "Detalle de compra creado exitosamente" });
  });
};

// Crear un nuevo inventario
exports.createInventario = (req, res) => {
  const { tipo, marca, modelo, capacidad, color, stock = 0 } = req.body;

  if (!tipo || !marca || !modelo || !capacidad || !color) {
    return res.status(400).json({ message: "Todos los campos son obligatorios" });
  }

  const query = "INSERT INTO inventario (tipo, marca, modelo, capacidad, color, stock) VALUES (?, ?, ?, ?, ?, ?)";
  connection.query(query, [tipo, marca, modelo, capacidad, color, stock], (err, result) => {
    if (err) return handleError(err, res, "Error al crear el inventario");
    res.status(201).json({ message: "Inventario creado exitosamente" });
  });
};


// Obtener todas las compras con sus detalles y proveedor
exports.getComprasConDetalles = (req, res) => {
  const query = `
    SELECT 
      c.id_compra, 
      c.fecha, 
      c.estado, 
      c.costo_total, 
      c.saldo_favor, 
      c.saldo_pendiente,
      p.nombre AS proveedor_nombre,
      dc.id_detalle,
      dc.modelo,
      dc.capacidad,
      dc.color,
      dc.cantidad,
      dc.costo,
      dc.tipo,
      dc.marca
    FROM 
      compras c
    JOIN 
      proveedores p ON c.proveedor_id = p.id_proveedor
    LEFT JOIN 
      detalles_compra dc ON c.id_compra = dc.id_compra
    ORDER BY 
      c.id_compra DESC, dc.id_detalle ASC
  `;
  
  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener las compras con detalles:', err);
      res.status(500).json({ message: 'Error al obtener las compras con detalles' });
      return;
    }

    // Procesar los resultados para estructurarlos por proveedor y compra
    const comprasMap = new Map();

    results.forEach(row => {
      const compraId = row.id_compra;

      if (!comprasMap.has(compraId)) {
        comprasMap.set(compraId, {
          id_compra: row.id_compra,
          fecha: row.fecha,
          estado: row.estado,
          costo_total: row.costo_total,
          saldo_favor: row.saldo_favor,
          saldo_pendiente: row.saldo_pendiente,
          proveedor_nombre: row.proveedor_nombre,
          detalles: []
        });
      }

      if (row.id_detalle) {
        comprasMap.get(compraId).detalles.push({
          id_detalle: row.id_detalle,
          modelo: row.modelo,
          capacidad: row.capacidad,
          color: row.color,
          cantidad: row.cantidad,
          costo: row.costo,
          tipo: row.tipo,
          marca: row.marca
        });
      }
    });

    const compras = Array.from(comprasMap.values());

    res.json(compras);
  });
};


// Actualizar solo el costo de un detalle de compra
exports.actualizarCosto = (req, res) => {
  const id = req.params.id;
  const { costo } = req.body;

  if (!costo || isNaN(costo) || costo <= 0) {
    return res.status(400).json({ message: 'Costo inválido' });
  }

  const query = 'UPDATE detalles_compra SET costo = ? WHERE id_detalle = ?';
  connection.query(query, [costo, id], (err, result) => {
    if (err) {
      console.error('Error al actualizar el costo del detalle de compra:', err);
      res.status(500).json({ message: 'Error al actualizar el costo' });
    } else {
      res.json({ message: 'Costo actualizado exitosamente' });
    }
  });
};



// Obtener compras y detalles por proveedor
exports.getComprasPorProveedor = (req, res) => {
  const proveedorId = req.params.proveedorId;

  const query = `
    SELECT 
      c.id_compra,
      DATE_FORMAT(c.fecha, '%d-%m-%Y') AS fecha_formateada,
      c.estado,
      c.costo_total,
      c.saldo_pendiente,
      dc.id_detalle,
      dc.modelo,
      dc.capacidad,
      dc.color,
      dc.cantidad,
      dc.costo,
      dc.tipo,
      dc.marca
    FROM 
      compras c
    LEFT JOIN 
      detalles_compra dc ON c.id_compra = dc.id_compra
    WHERE 
      c.proveedor_id = ?
    ORDER BY 
      c.fecha DESC, c.id_compra DESC, dc.id_detalle ASC;
  `;

  connection.query(query, [proveedorId], (err, results) => {
    if (err) {
      console.error('Error al obtener las compras y detalles por proveedor:', err);
      res.status(500).json({ message: 'Error al obtener las compras y detalles' });
      return;
    }

    // Procesar los resultados para estructurarlos por fecha de compra
    const comprasMap = new Map();

    results.forEach(row => {
      const compraId = row.id_compra;

      if (!comprasMap.has(compraId)) {
        comprasMap.set(compraId, {
          id_compra: row.id_compra,
          fecha: row.fecha_formateada,
          estado: row.estado,
          costo_total: row.costo_total,
          saldo_pendiente: row.saldo_pendiente,
          detalles: []
        });
      }

      if (row.id_detalle) {
        comprasMap.get(compraId).detalles.push({
          id_detalle: row.id_detalle,
          modelo: row.modelo,
          capacidad: row.capacidad,
          color: row.color,
          cantidad: row.cantidad,
          costo: row.costo,
          tipo: row.tipo,
          marca: row.marca
        });
      }
    });

    const compras = Array.from(comprasMap.values());

    res.json(compras);
  });
};
