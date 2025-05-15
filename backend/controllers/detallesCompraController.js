import DetallesCompraModel from '../models/detallesCompraModel.js';
import { pool } from '../config/db.js';


// 📌 Obtener todos los detalles de compra
export const getDetallesCompra = (req, res) => {
  DetallesCompraModel.getAllDetalles((err, detalles) => {
    if (err) {
      res.status(500).send('Error al obtener los detalles de compra');
    } else {
      res.json(detalles);
    }
  });
};

// 📌 Obtener un detalle de compra por ID
export const getDetalleCompraById = (req, res) => {
  const id = req.params.id;
  DetallesCompraModel.getDetalleById(id, (err, detalle) => {
    if (err || !detalle) {
      res.status(404).send('Detalle de compra no encontrado');
    } else {
      res.json(detalle);
    }
  });
};

// 📌 Crear un nuevo detalle de compra
export const createDetalleCompra = (req, res) => {
  const detalleData = req.body;

  // ✅ Validación con campos normalizados
  if (
    !detalleData.id_compra ||
    !detalleData.id_tipo ||
    !detalleData.id_marca ||
    !detalleData.id_modelo ||
    !detalleData.id_capacidad ||
    !detalleData.id_color ||
    !detalleData.cantidad ||
    !detalleData.costo
  ) {
    return res.status(400).send('Todos los campos son obligatorios (usando IDs)');
  }

  DetallesCompraModel.createDetalle(detalleData, (err, insertId) => {
    if (err) {
      console.error("❌ Error al crear detalle de compra:", err);
      res.status(500).send('Error al crear el detalle de compra');
    } else {
      res.status(201).json({ message: 'Detalle de compra creado exitosamente', id: insertId });
    }
  });
};


// 📌 Actualizar un detalle de compra
export const updateDetalleCompra = (req, res) => {
  const id = req.params.id;
  const detalleData = req.body;

  DetallesCompraModel.updateDetalle(id, detalleData, (err) => {
    if (err) {
      res.status(500).send('Error al actualizar el detalle de compra');
    } else {
      res.json({ message: 'Detalle de compra actualizado exitosamente' });
    }
  });
};

// 📌 Eliminar un detalle de compra
export const deleteDetalleCompra = (req, res) => {
  const id = req.params.id;

  DetallesCompraModel.deleteDetalle(id, (err) => {
    if (err) {
      res.status(500).send('Error al eliminar el detalle de compra');
    } else {
      res.json({ message: 'Detalle de compra eliminado exitosamente' });
    }
  });
};

export const actualizarCosto = async (req, res) => {
  const idDetalle = req.params.id;
  const { costo } = req.body;

  try {
    // 1) Actualizar el costo del detalle
    await pool.query(
      "UPDATE detalles_compra SET costo = ? WHERE id_detalle = ?",
      [costo, idDetalle]
    );

    // 2) Obtener el ID de la compra a la que pertenece ese detalle
    const [rows] = await pool.query(
      "SELECT id_compra FROM detalles_compra WHERE id_detalle = ?",
      [idDetalle]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Detalle no encontrado." });
    }
    const idCompra = rows[0].id_compra;

    // 3) Recalcular el costo total sumando todos los detalles
    const [detalles] = await pool.query(
      "SELECT costo FROM detalles_compra WHERE id_compra = ?",
      [idCompra]
    );
    const costoTotal = detalles.reduce((sum, d) => sum + parseFloat(d.costo), 0);

    // 4) Actualizar la tabla compras
    await pool.query(
      'UPDATE compras SET costo_total = ? WHERE id_compra = ?',
      [costoTotal, idCompra]
    );

    // 5) Responder al cliente
    return res.status(200).json({
      message: "Costo actualizado correctamente",
      costo_total: costoTotal,
      saldo_pendiente: costoTotal
    });

  } catch (err) {
    console.error("❌ Error al actualizar costo y totales:", err);
    return res.status(500).json({
      message: "Error al actualizar el costo",
      error: err.message
    });
  }
};



