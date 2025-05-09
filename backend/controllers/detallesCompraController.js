import DetallesCompraModel from '../models/detallesCompraModel.js'; // ✅ Importación corregida
// 📌 Obtener todos los detalles de compra
export const getDetallesCompra = (req, res) => {
  DetallesCompraModel.getAllDetalles((err, detalles) => {
    if (err) {
      res.status(500).send('Error al obtener los detalles de compra');
    } else {
      res.json(detalles);
    }
  });
};

// 📌 Obtener un detalle de compra por ID
export const getDetalleCompraById = (req, res) => {
  const id = req.params.id;
  DetallesCompraModel.getDetalleById(id, (err, detalle) => {
    if (err || !detalle) {
      res.status(404).send('Detalle de compra no encontrado');
    } else {
      res.json(detalle);
    }
  });
};

// 📌 Crear un nuevo detalle de compra
export const createDetalleCompra = (req, res) => {
  const detalleData = req.body;

  // ✅ Validación con campos normalizados
  if (
    !detalleData.id_compra ||
    !detalleData.id_tipo ||
    !detalleData.id_marca ||
    !detalleData.id_modelo ||
    !detalleData.id_capacidad ||
    !detalleData.id_color ||
    !detalleData.cantidad ||
    !detalleData.costo
  ) {
    return res.status(400).send('Todos los campos son obligatorios (usando IDs)');
  }

  DetallesCompraModel.createDetalle(detalleData, (err, insertId) => {
    if (err) {
      console.error("❌ Error al crear detalle de compra:", err);
      res.status(500).send('Error al crear el detalle de compra');
    } else {
      res.status(201).json({ message: 'Detalle de compra creado exitosamente', id: insertId });
    }
  });
};


// 📌 Actualizar un detalle de compra
export const updateDetalleCompra = (req, res) => {
  const id = req.params.id;
  const detalleData = req.body;

  DetallesCompraModel.updateDetalle(id, detalleData, (err) => {
    if (err) {
      res.status(500).send('Error al actualizar el detalle de compra');
    } else {
      res.json({ message: 'Detalle de compra actualizado exitosamente' });
    }
  });
};

// 📌 Eliminar un detalle de compra
export const deleteDetalleCompra = (req, res) => {
  const id = req.params.id;

  DetallesCompraModel.deleteDetalle(id, (err) => {
    if (err) {
      res.status(500).send('Error al eliminar el detalle de compra');
    } else {
      res.json({ message: 'Detalle de compra eliminado exitosamente' });
    }
  });
};


export const actualizarCosto = (req, res) => {
   console.log(`🔥 PUT /api/detalles-compra/${req.params.id}/costo ->`, req.body);
  const { id } = req.params;
  const { costo } = req.body;

  DetallesCompraModel.updateCostoSolo(id, costo, (err) => {
    if (err) {
      return res
      .status(500)
      .json({ message: "Error al actualizar el costo", error: err.message });
    }
    return res
     .status(200)
     .json({ message: "Costo actualizado correctamente" });
  });
};

