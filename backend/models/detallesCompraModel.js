import { pool } from '../config/db.js'; // ✅ Conexión a la base de datos

const DetallesCompraModel = {
  // 📌 Obtener todos los detalles de compra
  getAllDetalles: (callback) => {
    pool.query("SELECT * FROM detalles_compra", (err, results) => {
      if (err) {
        console.error("❌ Error al obtener los detalles de compra:", err);
        callback(err, null);
      } else {
        callback(null, results);
      }
    });
  },

  // 📌 Obtener un detalle de compra por ID
  getDetalleById: (id, callback) => {
    pool.query("SELECT * FROM detalles_compra WHERE id_detalle = ?", [id], (err, results) => {
      if (err) {
        console.error("❌ Error al obtener el detalle de compra:", err);
        callback(err, null);
      } else {
        callback(null, results[0]);
      }
    });
  },

  // 📌 Crear un nuevo detalle de compra
  createDetalle: (detalleData, callback) => {
    const {
      id_compra,
      id_tipo,
      id_marca,
      id_modelo,
      id_capacidad,
      id_color,
      cantidad,
      costo
    } = detalleData;
  
    pool.query(
      `INSERT INTO detalles_compra 
      (id_compra, id_tipo, id_marca, id_modelo, id_capacidad, id_color, cantidad, costo_unitario) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id_compra, id_tipo, id_marca, id_modelo, id_capacidad, id_color, cantidad, costo],
      (err, result) => {
        if (err) {
          console.error("❌ Error al insertar detalle de compra:", err);
          callback(err, null);
        } else {
          callback(null, result.insertId);
        }
      }
    );
  },
  

  // 📌 Actualizar un detalle de compra
  updateDetalle: (id, detalleData, callback) => {
    const { modelo, capacidad, color, cantidad, costo, tipo, marca } = detalleData;
    pool.query(
      "UPDATE detalles_compra SET modelo = ?, capacidad = ?, color = ?, cantidad = ?, costo = ?, tipo = ?, marca = ? WHERE id_detalle = ?",
      [modelo, capacidad, color, cantidad, costo, tipo, marca, id],
      (err, result) => {
        if (err) {
          console.error("❌ Error al actualizar detalle de compra:", err);
          callback(err);
        } else {
          callback(null);
        }
      }
    );
  },

  // 📌 Eliminar un detalle de compra
  deleteDetalle: (id, callback) => {
    pool.query("DELETE FROM detalles_compra WHERE id_detalle = ?", [id], (err, result) => {
      if (err) {
        console.error("❌ Error al eliminar detalle de compra:", err);
        callback(err);
      } else {
        callback(null);
      }
    });
  }
};

// ✅ Exportar correctamente el modelo para ES6
export default DetallesCompraModel;
