// inventario.js

document.addEventListener('DOMContentLoaded', function () {
  // Variables y elementos del DOM
  const inventoriesTable = document.getElementById('inventoriesTable');
  const searchModelInput = document.getElementById('searchModel');
  const inventoryForm = document.getElementById('inventoryForm');
  const inventoryModalElement = document.getElementById('inventoryModal');
  const inventoryModalLabel = document.getElementById('inventoryModalLabel');
  const addInventoryBtn = document.getElementById('addInventoryBtn');
  let inventoryTotalStockMap = {};
  let openDetails = {};

  // Verificación de elementos del DOM
  if (!inventoriesTable || !searchModelInput || !inventoryForm || !inventoryModalElement || !inventoryModalLabel || !addInventoryBtn) {
    console.error('Error: Algunos elementos del DOM no se encontraron.');
    return;
  }

  // Instancia del modal de inventario
  const inventoryModal = new bootstrap.Modal(inventoryModalElement, {
    keyboard: false
  });

  // Evento para buscar modelos
  searchModelInput.addEventListener('input', function () {
    const searchQuery = this.value.trim();
    loadInventories(searchQuery);
  });

  // Evento para enviar el formulario de inventario
  inventoryForm.addEventListener('submit', function (event) {
    event.preventDefault();
    const newInventoryData = {
      tipo: document.getElementById('inventoryType').value,
      marca: document.getElementById('inventoryBrand').value,
      modelo: document.getElementById('inventoryModel').value,
      capacidad: document.getElementById('inventoryCapacity').value,
      color: document.getElementById('inventoryColor').value,
      stock: parseInt(document.getElementById('inventoryStock').value, 10)
    };

    fetch('http://localhost:3000/api/inventarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newInventoryData)
    })
      .then(response => response.json())
      .then(() => {
        loadInventories(searchModelInput.value, true); // Mantener detalles abiertos
        inventoryModal.hide();
        // Resetear el formulario
        inventoryForm.reset();
      })
      .catch(error => {
        console.error('Error al agregar el inventario:', error);
        alert('Hubo un problema al agregar el inventario. Por favor, inténtelo de nuevo.');
      });
  });

  // Evento para el botón "Agregar Inventario"
  addInventoryBtn.addEventListener('click', function () {
    inventoryModalLabel.textContent = 'Agregar Inventario';
    inventoryForm.reset();
    inventoryModal.show();
  });

  // Función para cargar inventarios
  function loadInventories(searchQuery = '', keepDetailsOpen = false) {
    let url = 'http://localhost:3000/api/inventarios';

    if (searchQuery) {
      url += `?modelo=${searchQuery}`;
    }

    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(inventories => {
        inventoriesTable.innerHTML = '';
        if (!keepDetailsOpen) {
          openDetails = {};
        }

        inventoryTotalStockMap = {};

        if (inventories.length > 0) {
          inventories.sort((a, b) => a.marca.localeCompare(b.marca));

          const inventoryGroups = groupInventories(inventories);

          inventoryGroups.forEach(group => {
            const row = inventoriesTable.insertRow();
            row.innerHTML = `
                <td>${group.tipo}</td>
                <td>${group.marca}</td>
                <td>${group.modelo}</td>
                <td>${group.capacidad}</td>
                <td>${group.totalStock}</td>
                <td>
                  <button class="btn btn-warning btn-sm btnToggleDetails">Detalles</button>
                </td>
              `;

            // Añadir evento al botón "Detalles"
            const btnToggleDetails = row.querySelector('.btnToggleDetails');
            btnToggleDetails.addEventListener('click', function () {
              toggleDetails(group.modelo, group.capacidad);
            });

            // Fila de detalles
            const detailRow = inventoriesTable.insertRow();
            detailRow.style.display = openDetails[`${group.modelo}-${group.capacidad}`] ? '' : 'none';
            detailRow.setAttribute('data-model', group.modelo);
            detailRow.setAttribute('data-capacity', group.capacidad);

            const detailCell = detailRow.insertCell();
            detailCell.colSpan = 6;

            detailCell.innerHTML = `
                ${group.inventories.map(item => `
                  <div>
                    <span>Color: ${item.color}</span>
                    <span>Stock: <input type="number" class="form-control d-inline-block w-25" value="${item.stock}" data-id="${item.id_inventario}" data-color="${item.color}" readonly /></span>
                    <input type="hidden" data-field="type" value="${item.tipo}" />
                    <input type="hidden" data-field="brand" value="${item.marca}" />
                    <input type="hidden" data-field="model" value="${group.modelo}" />
                    <input type="hidden" data-field="capacity" value="${group.capacidad}" />
                  </div>
                `).join('')}
                <div class="mt-2">
                  <button class="btn btn-info btn-sm btnEditStocks">Editar</button>
                  <button class="btn btn-success btn-sm btnAddColor">Agregar Color</button>
                  <button class="btn btn-primary btn-sm btnSaveChanges">Guardar Cambios</button>
                  <button class="btn btn-secondary btn-sm btnCancelDetails">Cancelar</button>
                </div>
              `;

            // Añadir eventos a los botones dentro de detailCell
            const btnEditStocks = detailCell.querySelector('.btnEditStocks');
            const btnAddColor = detailCell.querySelector('.btnAddColor');
            const btnSaveChanges = detailCell.querySelector('.btnSaveChanges');
            const btnCancelDetails = detailCell.querySelector('.btnCancelDetails');

            btnEditStocks.addEventListener('click', function () {
              editAllStocks(group.modelo, group.capacidad);
            });

            btnAddColor.addEventListener('click', function () {
              addColor(group.modelo, group.capacidad);
            });

            btnSaveChanges.addEventListener('click', function () {
              saveChanges(group.modelo, group.capacidad);
            });

            btnCancelDetails.addEventListener('click', function () {
              cancelDetails(group.modelo, group.capacidad);
            });

            inventoryTotalStockMap[`${group.modelo}-${group.capacidad}`] = group.totalStock;
          });
        } else {
          inventoriesTable.innerHTML = "<tr><td colspan='6' class='text-center'>No se encontraron inventarios</td></tr>";
        }
      })
      .catch(error => {
        console.error('Error al cargar los inventarios:', error);
        alert('Hubo un problema al cargar los inventarios. Por favor, inténtelo de nuevo.');
      });
  }

  // Función para agrupar inventarios
  function groupInventories(inventories) {
    const groups = {};
    inventories.forEach(inventory => {
      const key = `${inventory.tipo}-${inventory.marca}-${inventory.modelo}-${inventory.capacidad}`;
      if (!groups[key]) {
        groups[key] = {
          tipo: inventory.tipo,
          marca: inventory.marca,
          modelo: inventory.modelo,
          capacidad: inventory.capacidad,
          totalStock: 0,
          inventories: []
        };
      }
      groups[key].totalStock += inventory.stock;
      groups[key].inventories.push(inventory);
    });
    return Object.values(groups);
  }

  // Función para alternar detalles
  function toggleDetails(model, capacity) {
    const key = `${model}-${capacity}`;
    const detailRows = inventoriesTable.querySelectorAll(`tr[data-model="${model}"][data-capacity="${capacity}"]`);
    detailRows.forEach(row => {
      const isVisible = row.style.display === '';
      row.style.display = isVisible ? 'none' : '';
      openDetails[key] = !isVisible;
    });
  }

 // Función para editar todos los stocks
function editAllStocks(model, capacity) {
  const detailRow = inventoriesTable.querySelector(`tr[data-model="${model}"][data-capacity="${capacity}"]`);
  const stockInputs = detailRow.querySelectorAll('input[type="number"]');
  stockInputs.forEach(input => {
    input.removeAttribute('readonly');
  });
}


  // Función para guardar cambios
function saveChanges(model, capacity) {
  const detailRow = inventoriesTable.querySelector(`tr[data-model="${model}"][data-capacity="${capacity}"]`);
  const stockInputs = detailRow.querySelectorAll('input[type="number"]');

  const updatedInventories = Array.from(stockInputs).map(input => {
    const id = input.getAttribute('data-id');
    const stock = parseInt(input.value, 10);

    if (!id || id === 'null') {
      console.error(`Error: id_inventario es null`);
      return;
    }

    return {
      id: id,
      stock: stock
    };
  }).filter(inv => inv !== undefined);

  // Obtener el stock total almacenado en inventoryTotalStockMap
  const totalStock = inventoryTotalStockMap[`${model}-${capacity}`];

  // Calcular la suma de los stocks ingresados
  const sumStocks = updatedInventories.reduce((sum, inv) => sum + inv.stock, 0);

  // Validar que la suma de stocks coincida con el total
  if (sumStocks !== totalStock) {
    alert(`La suma de los stocks (${sumStocks}) no coincide con el stock total (${totalStock}). Por favor, ajusta las cantidades.`);
    return;
  }

  // Actualizar inventarios
  const updatePromises = updatedInventories.map(inventory => {
    return fetch(`http://localhost:3000/api/inventarios/${inventory.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stock: inventory.stock })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Error en la actualización del inventario con ID ${inventory.id}`);
      }
      return response.json();
    });
  });

  Promise.all(updatePromises)
    .then(() => {
      loadInventories(searchModelInput.value, true); // Mantener detalles abiertos
      alert('Cambios guardados exitosamente.');
    })
    .catch(error => {
      console.error('Error al guardar los cambios:', error);
      alert('Hubo un problema al guardar los cambios. Por favor, inténtelo de nuevo.');
    });
}


  // Función para cancelar detalles
  function cancelDetails(model, capacity) {
    const detailRow = inventoriesTable.querySelector(`tr[data-model="${model}"][data-capacity="${capacity}"]`);
    if (detailRow) {
      detailRow.style.display = 'none';
      delete openDetails[`${model}-${capacity}`];
    }
  }

  // Función para agregar color
  function addColor(model, capacity) {
    const detailRow = inventoriesTable.querySelector(`tr[data-model="${model}"][data-capacity="${capacity}"]`);
    const uniqueId = Date.now();
    const newColorDiv = document.createElement('div');

    // Crear elementos
    const colorSpan = document.createElement('span');
    colorSpan.innerHTML = `Color: <input type="text" class="form-control d-inline-block w-25" placeholder="Nuevo color" id="newColorInput-${uniqueId}" />`;

    const saveButton = document.createElement('button');
    saveButton.className = 'btn btn-primary btn-sm';
    saveButton.textContent = 'Guardar Color';
    saveButton.addEventListener('click', function () {
      saveNewColor(model, capacity, uniqueId);
    });

    // Añadir elementos al div
    newColorDiv.appendChild(colorSpan);
    newColorDiv.appendChild(saveButton);

    detailRow.querySelector('td').appendChild(newColorDiv);
  }


  // Función para guardar nuevo color
function saveNewColor(model, capacity, uniqueId) {
  const newColorInput = document.getElementById(`newColorInput-${uniqueId}`);
  const newColor = newColorInput.value.trim();
  if (!newColor) {
    alert('Por favor, ingresa un color válido.');
    return;
  }

  const detailRow = inventoriesTable.querySelector(`tr[data-model="${model}"][data-capacity="${capacity}"]`);
  const type = detailRow.querySelector('input[data-field="type"]').value;
  const brand = detailRow.querySelector('input[data-field="brand"]').value;
  const modelValue = model;
  const capacityValue = capacity;

  const newInventoryData = {
    tipo: type,
    marca: brand,
    modelo: modelValue,
    capacidad: capacityValue,
    color: newColor,
    stock: 0 // Siempre se guarda con stock 0
  };

  fetch('http://localhost:3000/api/inventarios', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newInventoryData)
  })
  .then(response => response.json())
  .then(() => {
    loadInventories(searchModelInput.value, true); // Mantener detalles abiertos
  })
  .catch(error => {
    console.error('Error al agregar el nuevo color:', error);
    alert('Hubo un problema al agregar el nuevo color. Por favor, inténtelo de nuevo.');
  });
}


  // Cargar inventarios al iniciar
  loadInventories();
});
