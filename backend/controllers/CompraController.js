import { pool } from '../config/db.js';

// Obtener todas las compras
export const getCompras = async (req, res) => {
    try {
        const [compras] = await pool.query("SELECT * FROM compras ORDER BY fecha DESC");
        res.json(compras);
    } catch (error) {
        console.error("❌ Error al obtener compras:", error);
        res.status(500).json({ message: "Error al obtener compras." });
    }
};

// Obtener compra por ID
export const getCompraById = async (req, res) => {
    const { id } = req.params;
    try {
        const [compra] = await pool.query("SELECT * FROM compras WHERE id_compra = ?", [id]);
        if (compra.length === 0) {
            return res.status(404).json({ message: "Compra no encontrada." });
        }
        res.json(compra[0]);
    } catch (error) {
        console.error("❌ Error al obtener compra:", error);
        res.status(500).json({ message: "Error al obtener compra." });
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
            await pool.query(
                "INSERT INTO detalles_compra (id_compra, modelo, capacidad, color, cantidad, costo, tipo, marca) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                [compraId, detalle.modelo, detalle.capacidad, detalle.color, detalle.cantidad, detalle.costo, detalle.tipo, detalle.marca]
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
        const query = `
            SELECT 
                c.id_compra, 
                c.fecha, 
                p.nombre AS proveedor, 
                d.modelo, 
                d.capacidad, 
                d.color, 
                d.cantidad, 
                d.costo 
            FROM compras c
            JOIN proveedores p ON c.id_proveedor = p.id_proveedor
            JOIN detalles_compra d ON c.id_compra = d.id_compra
            WHERE c.id_compra = ?;
        `;

        const [result] = await pool.query(query, [id_compra]);

        if (result.length === 0) {
            return res.status(404).json({ message: "No se encontraron detalles para esta compra." });
        }

        res.json(result);
    } catch (error) {
        console.error("❌ Error al obtener detalles de compra:", error);
        res.status(500).json({ message: "Error al obtener los detalles de la compra." });
    }
};
