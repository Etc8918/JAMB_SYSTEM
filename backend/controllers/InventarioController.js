import { pool } from '../config/db.js'; // 📌 Conexión a la base de datos

// 📌 Obtener inventario agrupado por tipo, marca, modelo y capacidad
export const getInventarios = async (req, res) => {
    try {
        let { modelo } = req.query;
        let query = `
            SELECT MIN(id_inventario) AS id_inventario, 
                   UPPER(tipo) AS tipo, 
                   UPPER(marca) AS marca, 
                   UPPER(modelo) AS modelo, 
                   UPPER(capacidad) AS capacidad, 
                   SUM(stock) as totalStock
            FROM inventario
        `;

        let params = [];

        if (modelo) {
            query += ` WHERE modelo LIKE ? `;
            params.push(`%${modelo.toUpperCase()}%`);
        }

        query += ` 
            GROUP BY tipo, marca, modelo, capacidad 
            ORDER BY 
                FIELD(tipo, 'CELULAR', 'TABLET', 'ACCESORIOS'), 
                marca ASC, 
                modelo ASC, 
                CAST(capacidad AS UNSIGNED) ASC
        `;

        const [results] = await pool.query(query, params);
        res.json(results);
    } catch (error) {
        console.error("❌ Error en getInventarios:", error);
        res.status(500).json({ message: "Error al obtener los inventarios" });
    }
};

// ✅ Obtener capacidades disponibles por Tipo, Marca y Modelo
export const getCapacidadesPorModelo = async (req, res) => {
    const { id_modelo } = req.params;

    try {
        const query = `
            SELECT DISTINCT capacidad 
            FROM inventario 
            WHERE tipo = (SELECT tipo FROM inventario WHERE id_inventario = ? LIMIT 1)
            AND marca = (SELECT marca FROM inventario WHERE id_inventario = ? LIMIT 1)
            AND modelo = (SELECT modelo FROM inventario WHERE id_inventario = ? LIMIT 1)
            ORDER BY CAST(capacidad AS UNSIGNED) ASC
        `;

        const [result] = await pool.query(query, [id_modelo, id_modelo, id_modelo]);

        if (result.length === 0) {
            return res.status(404).json({ message: "No se encontraron capacidades para este modelo." });
        }

        res.json(result);
    } catch (error) {
        console.error("❌ Error al obtener capacidades:", error);
        res.status(500).json({ message: "Error al obtener capacidades." });
    }
};




// 📌 Obtener detalles de colores para un modelo específico
export const getDetallesPorModelo = async (req, res) => {
    const { id_inventario } = req.params;

    const query = `
        SELECT id_inventario, color, stock
        FROM inventario
        WHERE modelo = (SELECT modelo FROM inventario WHERE id_inventario = ? LIMIT 1)
        AND capacidad = (SELECT capacidad FROM inventario WHERE id_inventario = ? LIMIT 1)
        ORDER BY color;
    `;

    try {
        const [results] = await pool.query(query, [id_inventario, id_inventario]);
        res.json(results);
    } catch (error) {
        console.error("❌ Error en getDetallesPorModelo:", error);
        res.status(500).json({ message: "Error al obtener los detalles" });
    }
};

// 📌 Agregar un nuevo inventario
export const createInventario = async (req, res) => {
    const { tipo, marca, modelo, capacidad, color, cantidad } = req.body;

    if (!tipo || !marca || !modelo || !capacidad || !color) {
        return res.status(400).json({ message: "Todos los campos son obligatorios." });
    }

    try {
        const [result] = await pool.query(
            "INSERT INTO inventario (tipo, marca, modelo, capacidad, color, stock) VALUES (?, ?, ?, ?, ?, ?)",
            [tipo.toUpperCase(), marca.toUpperCase(), modelo.toUpperCase(), capacidad.toUpperCase(), color.toUpperCase(), cantidad || 0] // 📌 Si no envía cantidad, inicia en 0
        );

        res.json({ message: "Equipo registrado correctamente", id: result.insertId });
    } catch (error) {
        console.error("❌ Error al registrar equipo:", error);
        res.status(500).json({ message: "Error al registrar equipo." });
    }
};


// 📌 Agregar un nuevo color a un modelo existente
export const agregarColor = async (req, res) => {
    let { id_inventario, color } = req.body;

    if (!id_inventario || !color) {
        return res.status(400).json({ message: "ID de inventario y color son obligatorios." });
    }

    color = color.toUpperCase(); // Convertir a mayúsculas antes de guardar

    const query = `
        INSERT INTO inventario (tipo, marca, modelo, capacidad, id_modelo, id_capacidad, id_color, color, stock)
        SELECT UPPER(tipo), UPPER(marca), UPPER(modelo), UPPER(capacidad), id_modelo, id_capacidad, NULL, ?, 0
        FROM inventario
        WHERE id_inventario = ?
        LIMIT 1
    `;

    try {
        const [result] = await pool.query(query, [color, id_inventario]);

        if (result.affectedRows === 0) {
            return res.status(500).json({ message: "No se pudo agregar el color." });
        }

        res.json({ message: "Color agregado exitosamente" });
    } catch (error) {
        console.error("❌ Error al agregar color:", error);
        res.status(500).json({ message: "Error al agregar el color." });
    }
};

// 📌 Actualizar stock de un color específico
export const actualizarStockColores = async (req, res) => {
    const { id_inventario, colores } = req.body;

    if (!id_inventario || !colores || !Array.isArray(colores)) {
        return res.status(400).json({ message: "Datos inválidos. Se requiere id_inventario y una lista de colores." });
    }

    console.log("📥 Datos recibidos en la API:", { id_inventario, colores });

    const sumaColores = colores.reduce((total, c) => total + parseInt(c.stock, 10), 0);

    const queryStockTotal = `
        SELECT SUM(stock) as totalStock
        FROM inventario
        WHERE modelo = (SELECT modelo FROM inventario WHERE id_inventario = ? LIMIT 1)
        AND capacidad = (SELECT capacidad FROM inventario WHERE id_inventario = ? LIMIT 1)
        GROUP BY modelo, capacidad
    `;

    try {
        const [result] = await pool.query(queryStockTotal, [id_inventario, id_inventario]);
        const stockTotal = result[0]?.totalStock ? parseInt(result[0].totalStock, 10) : 0;

        console.log(`🔍 Comparando suma de colores (${sumaColores}) con stock total (${stockTotal})`);

        if (sumaColores !== stockTotal) {
            return res.status(400).json({ message: `La suma de los colores (${sumaColores}) no coincide con el stock total (${stockTotal}).` });
        }

        for (const color of colores) {
            if (!color.id_inventario || color.stock === undefined) {
                return res.status(400).json({ message: "Cada color debe tener un id_inventario y un stock válido." });
            }

            await pool.query(
                `UPDATE inventario SET stock = ? WHERE id_inventario = ?`,
                [color.stock, color.id_inventario]
            );
        }

        res.json({ message: "Stock actualizado correctamente" });
    } catch (error) {
        console.error("❌ Error al actualizar stock:", error);
        res.status(500).json({ message: "Error al actualizar stock." });
    }
};



// ✅ Obtener colores disponibles por marca, modelo y capacidad
export const getColoresPorCapacidad = async (req, res) => {
    const { id_modelo, capacidad } = req.params;

    try {
        const query = `
            SELECT DISTINCT color 
            FROM inventario 
            WHERE marca = (SELECT marca FROM inventario WHERE id_inventario = ? LIMIT 1) 
            AND modelo = (SELECT modelo FROM inventario WHERE id_inventario = ? LIMIT 1)
            AND capacidad = ?
            ORDER BY color ASC
        `;

        const [result] = await pool.query(query, [id_modelo, id_modelo, decodeURIComponent(capacidad)]);

        if (result.length === 0) {
            return res.status(404).json({ message: "No se encontraron colores para esta capacidad." });
        }

        res.json(result);
    } catch (error) {
        console.error("❌ Error al obtener colores:", error);
        res.status(500).json({ message: "Error al obtener colores." });
    }
};
