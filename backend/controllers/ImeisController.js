import { pool } from '../config/db.js';


export const registrarImeis = async (req, res) => {
  const { id_detalle } = req.params;
  const { imeis } = req.body;

  try {
    const [[{ cantidad }]] = await pool.query(
      `SELECT cantidad FROM detalles_compra WHERE id_detalle = ?`, [id_detalle]
    );
    const [[{ registrados }]] = await pool.query(
      `SELECT COUNT(*) AS registrados FROM imeis WHERE id_detalle = ?`, [id_detalle]
    );

    const disponibles = cantidad - registrados;
    if (imeis.length > disponibles) {
      return res.status(400).json({ message: `Solo puedes registrar ${disponibles} IMEIs restantes.` });
    }

    for (const { imei1, imei2 } of imeis) {
      if (!imei1) continue;
      await pool.query(
        `INSERT INTO imeis (id_detalle, imei1, imei2) VALUES (?, ?, ?)`,
        [id_detalle, imei1.trim(), imei2?.trim() || null]
      );
    }

    res.status(200).json({ message: "IMEIs registrados correctamente" });
  } catch (err) {
    console.error("❌ Error registrando IMEIs:", err);
    res.status(500).json({ message: "Error al registrar IMEIs" });
  }
};

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
