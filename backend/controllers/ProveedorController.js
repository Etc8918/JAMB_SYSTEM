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
          p.nombre AS proveedor_nombre,
          SUM(
            IFNULL(c.costo_total, 0) - IFNULL((
              SELECT SUM(ap.monto_abono)
              FROM abonos_proveedores ap
              WHERE ap.id_compra = c.id_compra
            ), 0)
          ) AS saldo_pendiente_total
        FROM compras c
        INNER JOIN proveedores p ON c.proveedor_id = p.id_proveedor
        GROUP BY p.id_proveedor, p.nombre
        
      `);
  
      res.json(rows);
    } catch (error) {
      console.error("❌ Error al obtener proveedores con saldo pendiente:", error.sqlMessage || error.message);
      res.status(500).json({ message: 'Error al obtener proveedores con saldo pendiente' });
    }
  };
  
  