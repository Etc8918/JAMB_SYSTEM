import { pool } from '../config/db.js'; // 📌 Conexión a la base de datos

// 📌 Obtener todos los clientes o filtrar por nombre
export const getClientes = async (req, res) => {
    try {
        const { nombre } = req.query;
        let query = "SELECT * FROM clientes";
        let params = [];

        if (nombre) {
            query += " WHERE nombre LIKE ?";
            params.push(`%${nombre}%`);
        }

        query += " ORDER BY nombre ASC";

        const [clientes] = await pool.query(query, params);

        res.json(clientes);
    } catch (error) {
        console.error("❌ Error al obtener clientes:", error);
        res.status(500).json({ message: "Error al obtener clientes." });
    }
};

// 📌 Obtener un cliente por ID
export const getClienteById = async (req, res) => {
    const { id } = req.params;
    try {
        const [cliente] = await pool.query("SELECT * FROM clientes WHERE id_cliente = ?", [id]);

        if (cliente.length === 0) {
            return res.status(404).json({ message: "Cliente no encontrado." });
        }

        res.json(cliente[0]);
    } catch (error) {
        console.error("❌ Error al obtener cliente:", error);
        res.status(500).json({ message: "Error al obtener cliente." });
    }
};

// 📌 Crear un nuevo cliente
export const createCliente = async (req, res) => {
    const { nombre, telefono } = req.body;

    if (!nombre || !telefono) {
        return res.status(400).json({ message: "Nombre y teléfono son obligatorios." });
    }

    try {
        const [result] = await pool.query(
            "INSERT INTO clientes (nombre, telefono) VALUES (?, ?)",
            [nombre.toUpperCase(), telefono]
        );

        res.json({ message: "Cliente registrado correctamente", id_cliente: result.insertId });
    } catch (error) {
        console.error("❌ Error al registrar cliente:", error);
        res.status(500).json({ message: "Error al registrar cliente." });
    }
};

// 📌 Actualizar cliente
export const updateCliente = async (req, res) => {
    const { id } = req.params;
    const { nombre, telefono } = req.body;

    try {
        const [result] = await pool.query(
            "UPDATE clientes SET nombre = ?, telefono = ? WHERE id_cliente = ?",
            [nombre.toUpperCase(), telefono, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Cliente no encontrado." });
        }

        res.json({ message: "Cliente actualizado correctamente" });
    } catch (error) {
        console.error("❌ Error al actualizar cliente:", error);
        res.status(500).json({ message: "Error al actualizar cliente." });
    }
};

// 📌 Eliminar cliente con validación de ventas asociadas
export const deleteCliente = async (req, res) => {
    const { id } = req.params;

    try {
        // 📌 Verificar si el cliente tiene ventas asociadas
        const [ventas] = await pool.query("SELECT id_venta FROM ventas WHERE id_cliente = ?", [id]);

        if (ventas.length > 0) {
            console.log("❌ No se puede eliminar, tiene ventas registradas.");
            return res.status(400).json({ message: "No se puede eliminar el cliente porque tiene ventas registradas." });
        }

        // 📌 Si no tiene ventas, eliminar el cliente
        const [result] = await pool.query("DELETE FROM clientes WHERE id_cliente = ?", [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Cliente no encontrado." });
        }

        res.json({ message: "Cliente eliminado correctamente" });
    } catch (error) {
        console.error("❌ Error al eliminar cliente:", error);
        res.status(500).json({ message: "No se pudo eliminar el cliente." });
    }
};
