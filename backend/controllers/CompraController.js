import { pool } from '../config/db.js';

// Obtener todas las compras
// Obtener todas las compras con totales recalculados
export const getCompras = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        c.id_compra,
        c.fecha,
        IFNULL(SUM(d.cantidad * d.costo), 0)       AS costo_total,
        IFNULL(SUM(d.cantidad * d.costo), 0)       AS saldo_pendiente
      FROM compras c
      LEFT JOIN detalles_compra d ON d.id_compra = c.id_compra
      GROUP BY c.id_compra, c.fecha
      ORDER BY c.fecha DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error("❌ Error al obtener compras recalculadas:", err);
    res.status(500).json({ message: "Error al obtener compras recalculadas." });
  }
};


// Obtener compra por ID
export const getCompraById = async (req, res) => {
  const { id } = req.params;

  try {
    // 1) Verificamos que exista la compra
    const [rowsCompra] = await pool.query(
      "SELECT id_compra FROM compras WHERE id_compra = ?",
      [id]
    );
    if (rowsCompra.length === 0) {
      return res.status(404).json({ message: "Compra no encontrada." });
    }

    // 2) Sumamos todos los costos de sus detalles
    const [detalles] = await pool.query(
  "SELECT cantidad, costo FROM detalles_compra WHERE id_compra = ?",
  [idCompra]
);
const costoTotal = detalles.reduce((sum, d) => 
  sum + (parseFloat(d.costo) * Number(d.cantidad)), 
  0
);

    // 3) Por ahora, el saldo pendiente es igual al costo total
    const saldoPendiente = costoTotal;

    // 4) Devolvemos el JSON con los valores recalculados
    return res.json({
      id_compra: id,
      costo_total: costoTotal,
      saldo_pendiente: saldoPendiente
    });

  } catch (err) {
    console.error('❌ Error en getCompraById:', err);
    return res.status(500).json({
      message: 'Error obteniendo la compra',
      error: err.message
    });
  }
};

// ✅ Crear una compra con detalles
export const createCompra = async (req, res) => {
    const { fecha, proveedor_id, detalles } = req.body;

    if (!fecha || !proveedor_id || !detalles || detalles.length === 0) {
        return res.status(400).json({ message: "Todos los campos son obligatorios y debe incluir al menos un detalle." });
    }

    try {
        // ✅ Insertar la compra en la tabla compras
        const [compraResult] = await pool.query(
            "INSERT INTO compras (fecha, proveedor_id) VALUES (?, ?)",
            [fecha, proveedor_id]
        );

        const compraId = compraResult.insertId;

        // ✅ Insertar los detalles en la tabla detalles_compra
        for (const detalle of detalles) {
            const [inventarioRows] = await pool.query(
                "SELECT id_tipo, id_marca, id_modelo, id_capacidad, id_color FROM inventario WHERE id_inventario = ?",
                [detalle.id_inventario]
            );
        
            if (inventarioRows.length === 0) {
                throw new Error("Inventario no encontrado para el detalle.");
            }
        
            const inventario = inventarioRows[0];
        
            await pool.query(
                `INSERT INTO detalles_compra 
                (id_compra, id_tipo, id_marca, id_modelo, id_capacidad, id_color, cantidad, costo)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    compraId,
                    inventario.id_tipo,
                    inventario.id_marca,
                    inventario.id_modelo,
                    inventario.id_capacidad,
                    inventario.id_color,
                    detalle.cantidad,
                    detalle.costo
                ]
            );
        }
        

        res.status(201).json({ message: "Compra registrada correctamente", id_compra: compraId });

    } catch (error) {
        console.error("❌ Error al registrar compra:", error);
        res.status(500).json({ message: "Error al registrar compra en la base de datos." });
    }
};

// Actualizar una compra
export const updateCompra = async (req, res) => {
    const { id } = req.params;
    const { fecha, id_proveedor } = req.body;

    try {
        const [result] = await pool.query("UPDATE compras SET fecha = ?, id_proveedor = ? WHERE id_compra = ?", [fecha, id_proveedor, id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Compra no encontrada." });
        }
        res.json({ message: "Compra actualizada correctamente" });
    } catch (error) {
        console.error("❌ Error al actualizar compra:", error);
        res.status(500).json({ message: "Error al actualizar compra." });
    }
};

// Eliminar una compra
export const deleteCompra = async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await pool.query("DELETE FROM compras WHERE id_compra = ?", [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Compra no encontrada." });
        }
        res.json({ message: "Compra eliminada correctamente" });
    } catch (error) {
        console.error("❌ Error al eliminar compra:", error);
        res.status(500).json({ message: "Error al eliminar compra." });
    }
};

// ✅ Obtener detalles de una compra por ID
export const getCompraDetalles = async (req, res) => {
    const { id_compra } = req.params;

    try {
        const [rows] = await pool.query(
          `
          SELECT 
            dc.id_detalle,
            t.nombre_tipo AS tipo,
            m.nombre AS marca,
            mo.nombre_modelo AS modelo,
            cap.capacidad,
            c.nombre_color AS color,
            dc.cantidad,
            dc.costo AS costo
          FROM detalles_compra dc
          JOIN inventario i ON dc.id_tipo = i.id_tipo 
            AND dc.id_marca = i.id_marca 
            AND dc.id_modelo = i.id_modelo 
            AND dc.id_capacidad = i.id_capacidad 
            AND dc.id_color = i.id_color
          JOIN tipo t ON dc.id_tipo = t.id_tipo
          JOIN marca m ON dc.id_marca = m.id_marca
          JOIN modelos mo ON dc.id_modelo = mo.id_modelo
          JOIN capacidades cap ON dc.id_capacidad = cap.id_capacidad
          JOIN colores c ON dc.id_color = c.id_color
          WHERE dc.id_compra = ?
          `,
          [id_compra]
        );
      
        res.status(200).json(rows);
      } catch (error) {
        console.error("Error al obtener detalles de compra:", error);
        res.status(500).json({ message: "Error al obtener detalles de compra" });
      }
      

};


// ✅ Obtener capacidades por ID de modelo
export const getCapacidadesPorModelo = async (req, res) => {
    const { id_tipo, id_marca, id_modelo } = req.params;

    if (!id_tipo || !id_marca || !id_modelo) {
        return res.status(400).json({ message: "Parámetros inválidos." });
    }

    try {
        const [capacidades] = await pool.query(`
            SELECT DISTINCT i.id_capacidad, c.capacidad 
            FROM inventario i
            JOIN capacidades c ON i.id_capacidad = c.id_capacidad
            WHERE i.id_tipo = ? AND i.id_marca = ? AND i.id_modelo = ?
            ORDER BY c.capacidad ASC
        `, [id_tipo, id_marca, id_modelo]);

        res.json(capacidades);
    } catch (error) {
        console.error("❌ Error al obtener capacidades:", error);
        res.status(500).json({ message: "Error al obtener capacidades." });
    }
};


// ✅ Obtener colores por ID de modelo e ID de capacidad
export const getColoresPorEquipo = async (req, res) => {
    const { id_tipo, id_marca, id_modelo, id_capacidad } = req.params;

    if (!id_tipo || !id_marca || !id_modelo || !id_capacidad) {
        return res.status(400).json({ message: "Parámetros incompletos." });
    }

    try {
        const query = `
            SELECT DISTINCT c.id_color, c.nombre_color
            FROM inventario i
            JOIN colores c ON i.id_color = c.id_color
            WHERE i.id_tipo = ? AND i.id_marca = ? AND i.id_modelo = ? AND i.id_capacidad = ?
        `;

        const [colores] = await pool.query(query, [id_tipo, id_marca, id_modelo, id_capacidad]);

        if (colores.length === 0) {
            return res.status(404).json({ message: "No se encontraron colores para este equipo." });
        }

        res.json(colores);
    } catch (error) {
        console.error("❌ Error al obtener colores:", error);
        res.status(500).json({ message: "Error al obtener los colores." });
    }
};


// Obtener Modelos basados en la nueva estructura
export const getModelos = async (req, res) => {
    try {
        const [modelos] = await pool.query(`
            SELECT 
                i.id_modelo,
                mo.nombre_modelo AS nombre_modelo,
                ma.nombre AS nombre_marca,
                i.id_marca,
                i.id_tipo
            FROM inventario i
            JOIN modelos mo ON i.id_modelo = mo.id_modelo
            JOIN marca ma ON i.id_marca = ma.id_marca
            GROUP BY i.id_modelo, mo.nombre_modelo, ma.nombre, i.id_marca, i.id_tipo
        
        `);
        res.json(modelos);
    } catch (error) {
        console.error("❌ Error al obtener modelos:", error);
        res.status(500).json({ message: "Error al obtener los modelos." });
    }
};

export const getIdInventario = async (req, res) => {
    const { id_tipo, id_marca, id_modelo, id_capacidad, id_color } = req.params;

    try {
        const query = `
            SELECT id_inventario FROM inventario 
            WHERE id_tipo = ? AND id_marca = ? AND id_modelo = ? 
            AND id_capacidad = ? AND id_color = ? LIMIT 1
        `;
        const [rows] = await pool.query(query, [id_tipo, id_marca, id_modelo, id_capacidad, id_color]);
        if (rows.length === 0) {
            return res.status(404).json({ message: "Inventario no encontrado" });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error("❌ Error al buscar id_inventario:", error);
        res.status(500).json({ message: "Error interno" });
    }
};


export const getIdInventarioPorDetalles = async (req, res) => {
    const { id_tipo, id_marca, id_modelo, id_capacidad, id_color } = req.params;
  
    if (!id_tipo || !id_marca || !id_modelo || !id_capacidad || !id_color) {
      return res.status(400).json({ message: "Parámetros incompletos." });
    }
  
    try {
      const query = `
        SELECT id_inventario FROM inventario
        WHERE id_tipo = ? AND id_marca = ? AND id_modelo = ? AND id_capacidad = ? AND id_color = ?
        LIMIT 1
      `;
      const [rows] = await pool.query(query, [id_tipo, id_marca, id_modelo, id_capacidad, id_color]);
  
      if (rows.length === 0) {
        return res.status(404).json({ message: "No se encontró el inventario con los parámetros dados." });
      }
  
      res.json(rows[0]);
    } catch (error) {
      console.error("❌ Error al obtener el id_inventario:", error);
      res.status(500).json({ message: "Error al obtener el id_inventario." });
    }
  };
  
  //Función para obtener el ID del inventario:
  export const getInventarioId = async (req, res) => {
    const { id_tipo, id_marca, id_modelo, id_capacidad, id_color } = req.params;
  
    if (!id_tipo || !id_marca || !id_modelo || !id_capacidad || !id_color) {
      return res.status(400).json({ message: "Parámetros incompletos" });
    }
  
    try {
      const [rows] = await pool.query(
        `SELECT id_inventario FROM inventario 
         WHERE id_tipo = ? AND id_marca = ? AND id_modelo = ? AND id_capacidad = ? AND id_color = ?
         LIMIT 1`,
        [id_tipo, id_marca, id_modelo, id_capacidad, id_color]
      );
  
      if (rows.length === 0) {
        return res.status(404).json({ message: "Inventario no encontrado" });
      }
  
      res.json(rows[0]); // Devuelve el id_inventario
    } catch (error) {
      console.error("❌ Error al buscar id_inventario:", error);
      res.status(500).json({ message: "Error en el servidor" });
    }
  };
  
  export const getComprasPorProveedor = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(`
      SELECT
        c.id_compra,
        c.fecha,
        IFNULL(SUM(d.cantidad * d.costo), 0)       AS costo_total,
        IFNULL(SUM(d.cantidad * d.costo), 0)       AS saldo_pendiente
      FROM compras c
      LEFT JOIN detalles_compra d ON d.id_compra = c.id_compra
      WHERE c.proveedor_id = ?
      GROUP BY c.id_compra, c.fecha
      ORDER BY c.fecha DESC
    `, [id]);
    return res.json(rows);
  } catch (err) {
    console.error("❌ Error en getComprasPorProveedor recalculadas:", err);
    return res.status(500).json({ message: "Error al obtener compras del proveedor." });
  }
};



  

  export const obtenerDetallesPorCompra = async (req, res) => {
    const { id_compra } = req.params;
  
    try {
      const [detalles] = await pool.query(
        `SELECT 
          d.id_detalle,
          t.nombre_tipo AS tipo,
          mar.nombre AS marca,
          mo.nombre_modelo AS modelo,
          cap.capacidad,
          col.nombre_color AS color,
          d.cantidad,
          d.costo AS costo,
          (
            SELECT COUNT(*) 
            FROM imeis i 
            WHERE i.id_detalle = d.id_detalle
          ) AS imeis_registrados
        FROM detalles_compra d
        JOIN tipo t ON d.id_tipo = t.id_tipo
        JOIN marca mar ON d.id_marca = mar.id_marca
        JOIN modelos mo ON d.id_modelo = mo.id_modelo
        JOIN capacidades cap ON d.id_capacidad = cap.id_capacidad
        JOIN colores col ON d.id_color = col.id_color
        WHERE d.id_compra = ?`,
        [id_compra]
      );
  
      res.json(detalles);
    } catch (error) {
      console.error("❌ Error al obtener detalles por compra:", error);
      res.status(500).json({ message: "Error al obtener los detalles de la compra" });
    }
  };
  