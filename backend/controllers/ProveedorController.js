import { pool } from '../config/db.js'; // 📌 Importar conexión a la BD

// 📌 Obtener todos los proveedores o filtrar por nombre
export const getProveedores = async (req, res) => {
    try {
        const { nombre } = req.query;
        let query = "SELECT id_proveedor, UPPER(nombre) AS nombre, UPPER(contacto) AS contacto, telefono, UPPER(direccion) AS direccion FROM proveedores";
        let params = [];

        if (nombre) {
            query += " WHERE nombre LIKE ?";
            params.push(`%${nombre.toUpperCase()}%`);
        }

        query += " ORDER BY nombre ASC";
        const [rows] = await pool.query(query, params);

        if (rows.length === 0) {
            return res.status(404).json({ message: "No se encontraron proveedores." });
        }

        res.json(rows);
    } catch (error) {
        console.error("❌ Error al obtener proveedores:", error);
        res.status(500).json({ message: "Error al obtener proveedores." });
    }
};

// 📌 Crear un nuevo proveedor
export const createProveedor = async (req, res) => {
    const { nombre, contacto, telefono, direccion } = req.body;

    if (!nombre || !telefono) {
        return res.status(400).json({ message: "El nombre y el teléfono son obligatorios." });
    }

    try {
        const [result] = await pool.query(
            "INSERT INTO proveedores (nombre, contacto, telefono, direccion) VALUES (?, ?, ?, ?)",
            [nombre.toUpperCase(), contacto.toUpperCase(), telefono, direccion.toUpperCase()]
        );
        res.status(201).json({ message: "Proveedor agregado correctamente", id: result.insertId });
    } catch (error) {
        console.error("❌ Error al crear proveedor:", error);
        res.status(500).json({ message: "Error al crear proveedor." });
    }
};

// 📌 Actualizar un proveedor
export const updateProveedor = async (req, res) => {
    const { id } = req.params;
    const { nombre, contacto, telefono, direccion } = req.body;

    if (!nombre || !telefono) {
        return res.status(400).json({ message: "El nombre y el teléfono son obligatorios." });
    }

    try {
        const [result] = await pool.query(
            "UPDATE proveedores SET nombre = ?, contacto = ?, telefono = ?, direccion = ? WHERE id_proveedor = ?",
            [nombre.toUpperCase(), contacto.toUpperCase(), telefono, direccion.toUpperCase(), id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Proveedor no encontrado." });
        }

        res.json({ message: "Proveedor actualizado correctamente" });
    } catch (error) {
        console.error("❌ Error al actualizar proveedor:", error);
        res.status(500).json({ message: "Error al actualizar proveedor." });
    }
};

// 📌 Eliminar un proveedor con validación de compras asociadas
export const deleteProveedor = async (req, res) => {
    const { id } = req.params;

    try {
        // Verificar si el proveedor tiene compras asociadas
        const [compras] = await pool.query("SELECT id_compra FROM compras WHERE id_proveedor = ?", [id]);

        if (compras.length > 0) {
            return res.status(400).json({ message: "No se puede eliminar el proveedor porque tiene compras registradas." });
        }

        // Si no tiene compras asociadas, eliminar el proveedor
        const [result] = await pool.query("DELETE FROM proveedores WHERE id_proveedor = ?", [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Proveedor no encontrado." });
        }

        res.json({ message: "Proveedor eliminado correctamente" });
    } catch (error) {
        console.error("❌ Error al eliminar proveedor:", error);
        res.status(500).json({ message: "Error al eliminar proveedor." });
    }
};

export const getProveedoresConSaldoPendiente = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        p.id_proveedor,
        UPPER(p.nombre) AS proveedor_nombre,
        -- Suma cantidad * costo de todos los detalles
        IFNULL(SUM(d.cantidad * d.costo), 0)          AS costo_total,
        -- Suma de los abonos hechos (0 si no hay)
        IFNULL(SUM(ap.monto_abono), 0)                AS total_abonado,
        -- Saldo pendiente = total de detalles menos abonos
        IFNULL(SUM(d.cantidad * d.costo), 0)
        - IFNULL(SUM(ap.monto_abono), 0)              AS saldo_pendiente_total
      FROM proveedores p
      LEFT JOIN compras c 
        ON c.proveedor_id = p.id_proveedor
      LEFT JOIN detalles_compra d 
        ON d.id_compra = c.id_compra
      LEFT JOIN abonos_proveedores ap 
        ON ap.id_compra = c.id_compra
      GROUP BY p.id_proveedor, p.nombre
      ORDER BY p.nombre ASC
    `);

    return res.json(rows);
  } catch (error) {
    console.error("❌ Error en getProveedoresConSaldoPendiente:", error.sqlMessage || error.message);
    return res.status(500).json({ message: 'Error al obtener saldos pendientes' });
  }
};
  
  