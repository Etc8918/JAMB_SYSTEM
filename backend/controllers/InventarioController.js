import { pool } from '../config/db.js'; // 📌 Conexión a la base de datos

// 📌 Obtener inventario agrupado por tipo, marca, modelo y capacidad
export const getInventarios = async (req, res) => {
    try {
        let { modelo } = req.query;

        let query = `
  SELECT 
    MIN(i.id_inventario) AS id_inventario,
    UPPER(t.nombre_tipo) AS tipo,
    UPPER(mar.nombre) AS marca,
    UPPER(modelo.nombre_modelo) AS modelo,
    UPPER(cap.capacidad) AS capacidad,
    SUM(i.stock) as totalStock
  FROM inventario i
  JOIN tipo t ON i.id_tipo = t.id_tipo
  JOIN marca mar ON i.id_marca = mar.id_marca
  JOIN modelos modelo ON i.id_modelo = modelo.id_modelo
  JOIN capacidades cap ON i.id_capacidad = cap.id_capacidad
`;


        let params = [];

        if (modelo) {
            query += ` WHERE UPPER(modelo.nombre_modelo) LIKE ? `;
            params.push(`%${modelo.toUpperCase()}%`);
        }

        query += `
  GROUP BY t.nombre_tipo, mar.nombre, modelo.nombre_modelo, cap.capacidad
  ORDER BY 
    FIELD(t.nombre_tipo, 'CELULAR', 'TABLET', 'ACCESORIOS'), 
    mar.nombre ASC, 
    modelo.nombre_modelo ASC, 
    CAST(cap.capacidad AS UNSIGNED) ASC
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
            SELECT DISTINCT c.id_capacidad, cap.descripcion AS capacidad
            FROM inventario i
            JOIN capacidades cap ON i.id_capacidad = cap.id_capacidad
            WHERE i.id_modelo = ?
            ORDER BY CAST(cap.descripcion AS UNSIGNED) ASC
        `;

        const [result] = await pool.query(query, [id_modelo, id_modelo, id_modelo]);
        console.log("🟢 Capacidades encontradas:", result);


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
        SELECT 
            i.id_inventario, 
            c.nombre_color AS color, 
            i.stock
        FROM inventario i
        JOIN colores c ON i.id_color = c.id_color
        WHERE i.id_modelo = (SELECT id_modelo FROM inventario WHERE id_inventario = ? LIMIT 1)
          AND i.id_capacidad = (SELECT id_capacidad FROM inventario WHERE id_inventario = ? LIMIT 1)
        ORDER BY c.nombre_color;
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
    const { tipo, marca, modelo, capacidad, color, cantidad = 0 } = req.body;
  
    if (!tipo || !marca || !modelo || !capacidad || !color) {
      return res.status(400).json({ message: "Todos los campos son obligatorios." });
    }
  
    try {
      // 1. Buscar o insertar tipo
      const [tipoRows] = await pool.query("SELECT id_tipo FROM tipo WHERE nombre_tipo = ?", [tipo]);
      const id_tipo = tipoRows.length ? tipoRows[0].id_tipo : (
        await pool.query("INSERT INTO tipo (nombre_tipo) VALUES (?)", [tipo])
      )[0].insertId;
  
      // 2. Buscar o insertar marca
      const [marcaRows] = await pool.query("SELECT id_marca FROM marca WHERE nombre = ?", [marca]);
      const id_marca = marcaRows.length ? marcaRows[0].id_marca : (
        await pool.query("INSERT INTO marca (nombre) VALUES (?)", [marca])
      )[0].insertId;
  
      // 3. Buscar o insertar modelo
      const [modeloRows] = await pool.query("SELECT id_modelo FROM modelos WHERE nombre_modelo = ?", [modelo]);
      const id_modelo = modeloRows.length ? modeloRows[0].id_modelo : (
        await pool.query("INSERT INTO modelos (nombre_modelo) VALUES (?)", [modelo])
      )[0].insertId;
  
      // 4. Buscar o insertar capacidad
      const [capRows] = await pool.query("SELECT id_capacidad FROM capacidades WHERE capacidad = ?", [capacidad]);
      const id_capacidad = capRows.length ? capRows[0].id_capacidad : (
        await pool.query("INSERT INTO capacidades (capacidad) VALUES (?)", [capacidad])
      )[0].insertId;
  
      // 5. Buscar o insertar color
      const [colorRows] = await pool.query("SELECT id_color FROM colores WHERE nombre_color = ?", [color]);
      const id_color = colorRows.length ? colorRows[0].id_color : (
        await pool.query("INSERT INTO colores (nombre_color) VALUES (?)", [color])
      )[0].insertId;
  
      // 6. Finalmente insertar en inventario
      const [result] = await pool.query(
        `INSERT INTO inventario (id_tipo, id_marca, id_modelo, id_capacidad, id_color, stock)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id_tipo, id_marca, id_modelo, id_capacidad, id_color, cantidad]
      );
  
      res.status(201).json({ message: "Equipo agregado al inventario", id: result.insertId });
  
    } catch (error) {
      console.error("❌ Error al registrar equipo:", error);
      res.status(500).json({ message: "Error al registrar el equipo" });
    }
  };
  


// 📌 Agregar un nuevo color a un modelo existente
export const agregarColor = async (req, res) => {
    let { id_inventario, color } = req.body;

    if (!id_inventario || !color) {
        return res.status(400).json({ message: "ID de inventario y color son obligatorios." });
    }

    color = color.toUpperCase();

    try {
        // 1. Verificamos si el color ya existe en la tabla 'colores'
        let [colorResult] = await pool.query(
            "SELECT id_color FROM colores WHERE nombre_color = ? LIMIT 1",
            [color]
        );

        let id_color;

        if (colorResult.length > 0) {
            id_color = colorResult[0].id_color;
        } else {
            // Si no existe, lo insertamos
            const [insertResult] = await pool.query(
                "INSERT INTO colores (nombre_color) VALUES (?)",
                [color]
            );
            id_color = insertResult.insertId;
        }

        // 2. Obtenemos los datos del equipo original desde su ID
        const [equipoBase] = await pool.query(
            "SELECT id_tipo, id_marca, id_modelo, id_capacidad FROM inventario WHERE id_inventario = ? LIMIT 1",
            [id_inventario]
        );

        if (equipoBase.length === 0) {
            return res.status(404).json({ message: "Equipo base no encontrado." });
        }

        const { id_tipo, id_marca, id_modelo, id_capacidad } = equipoBase[0];

        // 3. Insertamos un nuevo inventario con el nuevo color
        await pool.query(
            `INSERT INTO inventario 
            (id_tipo, id_marca, id_modelo, id_capacidad, id_color, stock) 
            VALUES (?, ?, ?, ?, ?, 0)`,
            [id_tipo, id_marca, id_modelo, id_capacidad, id_color]
        );

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
    WHERE id_modelo = (SELECT id_modelo FROM inventario WHERE id_inventario = ? LIMIT 1)
    AND id_capacidad = (SELECT id_capacidad FROM inventario WHERE id_inventario = ? LIMIT 1)
    GROUP BY id_modelo, id_capacidad
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
