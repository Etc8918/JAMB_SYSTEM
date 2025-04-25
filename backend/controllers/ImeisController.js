import { pool } from '../config/db.js';


export const getCantidadYRegistrados = async (req, res) => {
  const { id_detalle } = req.params;
  try {
    const [[{ cantidad }]] = await pool.query(
      `SELECT cantidad FROM detalles_compra WHERE id_detalle = ?`, [id_detalle]
    );
    const [[{ registrados }]] = await pool.query(
      `SELECT COUNT(*) AS registrados FROM imeis WHERE id_detalle = ?`, [id_detalle]
    );
    res.json({ cantidad_total: cantidad, imeis_registrados: registrados });
  } catch (err) {
    res.status(500).json({ message: "Error consultando cantidad" });
  }
};

export const getImeisPorDetalle = async (req, res) => {
  const { id_detalle } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT imei1, imei2 FROM imeis WHERE id_detalle = ?`,
      [id_detalle]
    );
    res.json(rows);
  } catch (err) {
    console.error("❌ Error al obtener IMEIs:", err);
    res.status(500).json({ message: "Error al obtener los IMEIs" });
  }
};


export const obtenerImeisPorDetalle = async (req, res) => {
  const { id_detalle } = req.params;
  try {
    const [imeis] = await pool.query(
      `SELECT imei1, imei2 FROM imeis WHERE id_detalle = ?`,
      [id_detalle]
    );
    res.json(imeis);
  } catch (error) {
    console.error("Error al obtener los IMEIs:", error);
    res.status(500).json({ message: "Error al obtener los IMEIs" });
  }
};



export const guardarImeis = async (req, res) => {
  const idDetalle = req.params.id;
  const { imeis } = req.body;

  if (!Array.isArray(imeis) || imeis.length === 0) {
    return res.status(400).json({ message: "Lista de IMEIs vacía o inválida" });
  }

  const conn = await pool.getConnection();
  await conn.beginTransaction();

  try {
    // 1. Borrar todos los imeis anteriores de ese detalle
    await conn.query("DELETE FROM imeis WHERE id_detalle = ?", [idDetalle]);

    // 2. 🔄 Commit parcial para liberar imeis eliminados del índice único
    await conn.commit();
    await conn.beginTransaction(); // volver a empezar para la inserción limpia

    // 3. Verificar qué imei1 ya existen
    const [global] = await conn.query("SELECT imei1 FROM imeis");
    const globalSet = new Set(global.map(row => row.imei1));

    const nuevos = [];
    for (const { imei1, imei2 } of imeis) {
      if (!globalSet.has(imei1)) {
        nuevos.push([idDetalle, imei1, imei2 || null]);
      }
    }

    // 4. Insertar IMEIs válidos
    if (nuevos.length > 0) {
      await conn.query("INSERT INTO imeis (id_detalle, imei1, imei2) VALUES ?", [nuevos]);
    }

    await conn.commit();
    res.json({ message: "IMEIs actualizados correctamente" });
  } catch (err) {
    await conn.rollback();
    console.error("❌ Error al guardar IMEIs:", err);
    res.status(500).json({ message: "Error al guardar los IMEIs" });
  } finally {
    conn.release();
  }
};
