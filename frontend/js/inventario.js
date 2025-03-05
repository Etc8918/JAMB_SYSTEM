import { apiFetch } from './api.js';

document.addEventListener('DOMContentLoaded', async () => {
  await loadInventarios();
  document.getElementById('searchModel').addEventListener('input', async (event) => {
      await loadInventarios(event.target.value);
  });
});

// Cargar inventarios con opción de búsqueda
async function loadInventarios(modelo = '') {
  try {
      const queryParam = modelo ? `?modelo=${encodeURIComponent(modelo)}` : '';
      const inventarios = await apiFetch(`inventario${queryParam}`);
      renderInventariosTable(inventarios);
  } catch (error) {
      console.error("❌ Error al cargar inventarios:", error);
  }
}


// Renderizar inventarios en la tabla
function renderInventariosTable(inventarios) {
  const table = document.getElementById('inventoriesTable').querySelector('tbody');
  table.innerHTML = '';

  inventarios.forEach(item => {
      const row = table.insertRow();
      row.innerHTML = `
          <td>${item.tipo.toUpperCase()}</td>
          <td>${item.marca.toUpperCase()}</td>
          <td>${item.modelo.toUpperCase()}</td>
          <td>${item.capacidad.toUpperCase()}</td>
          <td>${item.totalStock}</td>
          <td>
              <button class="btn btn-primary btn-sm" onclick="toggleDetalles(${item.id_inventario})">Ver Detalles</button>
          </td>
      `;
  });
}


// Desplegar detalles correctamente
window.toggleDetalles = async function (id_inventario) {
  // Eliminar cualquier fila de detalles abierta previamente
  document.querySelectorAll('.details-row').forEach(row => row.remove());

  try {
      const detalles = await apiFetch(`inventario/detalles/${id_inventario}`);

      // Si no hay colores, mostrar mensaje
      if (!detalles.length) {
          alert("No hay colores registrados para este modelo.");
          return;
      }

      // Encontrar la fila donde se hizo clic
      const button = document.querySelector(`button[onclick="toggleDetalles(${id_inventario})"]`);
      const row = button.closest('tr');
      const tableBody = row.parentNode;
      const rowIndex = Array.from(tableBody.children).indexOf(row);

      // Insertar fila debajo de la seleccionada
      const newRow = tableBody.insertRow(rowIndex + 1);
      newRow.id = `details-${id_inventario}`;
      newRow.classList.add('details-row');

      // Calcular el stock total
      const totalStock = detalles.reduce((sum, item) => sum + item.stock, 0);

      newRow.innerHTML = `
          <td colspan="6">
              <table class="table table-bordered">
                  <thead>
                      <tr><th>Color</th><th>Stock</th></tr>
                  </thead>
                  <tbody id="color-body-${id_inventario}">
                      ${detalles.map(item => `
                          <tr>
                              <td>${item.color}</td>
                              <td><input type="number" id="stock-${item.id_inventario}" value="${item.stock}" min="0" disabled></td>
                          </tr>
                      `).join('')}
                  </tbody>
              </table>
              <button class="btn btn-secondary btn-sm" onclick="agregarColor(${id_inventario})">➕ Agregar Color</button>
              <button class="btn btn-warning btn-sm" onclick="habilitarEdicion(${id_inventario})">✏️ Editar</button>
              <button class="btn btn-success btn-sm" id="guardar-stock-${id_inventario}" onclick="guardarStock(${id_inventario}, ${totalStock})" disabled>💾 Guardar</button>
          </td>
      `;
  } catch (error) {
      console.error("❌ Error al obtener detalles:", error);
  }
};





// Agregar color
window.agregarColor = async function (id_inventario) {
    const color = prompt("Ingrese el nuevo color:");
    if (!color) return;

    try {
        await apiFetch('inventario/agregar-color', 'POST', { id_inventario, color });
        alert(`Color ${color} agregado con éxito.`);
        toggleDetalles(id_inventario);
    } catch (error) {
        alert("Error al agregar color.");
    }
};

// Guardar stock
window.guardarStock = async function (id_inventario, totalStockOriginal) {
  const stockInputs = document.querySelectorAll(`#color-body-${id_inventario} input`);
  const coloresActualizados = [];

  let nuevoTotalStock = 0;

  stockInputs.forEach(input => {
      const id = input.id.replace("stock-", "");
      const stock = parseInt(input.value) || 0;
      nuevoTotalStock += stock;
      coloresActualizados.push({ id_inventario: id, stock });
  });

  console.log("📤 Enviando datos a la API:", { id_inventario, colores: coloresActualizados });

  if (nuevoTotalStock !== totalStockOriginal) {
      alert(`La suma del stock (${nuevoTotalStock}) no coincide con el total original (${totalStockOriginal}).`);
      return;
  }

  try {
      const response = await apiFetch('inventario/actualizar-stock', 'PUT', { id_inventario, colores: coloresActualizados });
      console.log("✅ Respuesta de la API:", response);

      alert("Stock actualizado correctamente.");
      toggleDetalles(id_inventario);
  } catch (error) {
      console.error("❌ Error al actualizar stock:", error);
      alert("Error al actualizar stock.");
  }
};



window.habilitarEdicion = function (id_inventario) {
  // Habilitar los campos de stock
  document.querySelectorAll(`#color-body-${id_inventario} input`).forEach(input => {
      input.disabled = false;
  });

  // Habilitar el botón Guardar
  document.getElementById(`guardar-stock-${id_inventario}`).disabled = false;
};
