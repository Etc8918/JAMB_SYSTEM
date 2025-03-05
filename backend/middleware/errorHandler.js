const errorHandler = (err, req, res, next) => {
  console.error("❌ Error en el servidor:", err.stack);
  res.status(500).json({ message: "Error en el servidor" });
};

// ✅ Exportar correctamente como `default`
export default errorHandler;
