document.addEventListener('DOMContentLoaded', function () {
    loadInventories();
});

function loadInventories(searchQuery = '') {
    let url = 'http://localhost:3000/inventarios';

    if (searchQuery) {
        url += `?modelo=${searchQuery}`;
    }

    fetch(url)
        .then(response => response.json())
        .then(inventories => {
            inventoriesTable.innerHTML = '';
            inventoryTotalStockMap = {}; // Resetear el mapeo

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
                            <button class="btn btn-warning btn-sm" onclick="toggleDetails('${group.modelo}', '${group.capacidad}')">Detalles</button>
                        </td>
                    `;

                    const detailRow = inventoriesTable.insertRow();
                    detailRow.style.display = 'none';
                    detailRow.setAttribute('data-model', group.modelo);
                    detailRow.setAttribute('data-capacity', group.capacidad); // Asignar el atributo data-capacity
                    detailRow.innerHTML = `<td colspan="6">
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
                            <button class="btn btn-info btn-sm" onclick="editAllStocks('${group.modelo}', '${group.capacidad}')">Editar</button>
                            <button class="btn btn-success btn-sm" onclick="addColor('${group.modelo}', '${group.capacidad}')">Agregar Color</button>
                            <button class="btn btn-primary btn-sm" onclick="saveChanges('${group.modelo}', '${group.capacidad}')">Guardar Cambios</button>
                            <button class="btn btn-secondary btn-sm" onclick="cancelDetails('${group.modelo}', '${group.capacidad}')">Cancelar</button>
                        </div>
                    </td>`;

                    // Guardar el total del stock en el mapeo
                    inventoryTotalStockMap[`${group.modelo}-${group.capacidad}`] = group.totalStock;
                });
            } else {
                inventoriesTable.innerHTML = "<tr><td colspan='6' class='text-center'>No se encontraron inventarios</td></tr>";
            }
        })
        .catch(error => console.error('Error al cargar los inventarios:', error));
}

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

window.toggleDetails = function(model, capacity) {
    const detailRows = inventoriesTable.querySelectorAll(`tr[data-model="${model}"][data-capacity="${capacity}"]`);
    detailRows.forEach(row => {
        row.style.display = row.style.display === 'none' ? '' : 'none';
    });
};

window.editAllStocks = function(model, capacity) {
    const detailRow = document.querySelector(`tr[data-model="${model}"][data-capacity="${capacity}"]`);
    const stockInputs = detailRow.querySelectorAll('input[type="number"]');
    stockInputs.forEach(input => {
        input.removeAttribute('readonly');
    });
};

window.saveChanges = function(model, capacity) {
    const detailRow = document.querySelector(`tr[data-model="${model}"][data-capacity="${capacity}"]`);
    const stockInputs = detailRow.querySelectorAll('input[type="number"]');

    const updatedInventories = Array.from(stockInputs).map(input => {
        const id = input.getAttribute('data-id');
        const color = input.getAttribute('data-color');
        const stock = parseInt(input.value);

        if (!id || id === 'null') {
            console.error(`Error: id_inventario es null para el color ${color}`);
            return;
        }

        return {
            id: id,
            color: color,
            stock: stock
        };
    }).filter(inv => inv !== undefined);

    const totalStock = getTotalStock(model, capacity);
    const sumStocks = updatedInventories.reduce((sum, inv) => sum + inv.stock, 0);

    if (sumStocks !== totalStock) {
        alert(`La cantidad total no coincide. Suma: ${sumStocks}, Total: ${totalStock}`);
        return;
    }

    updatedInventories.forEach(inventory => {
        fetch(`http://localhost:3000/inventarios/${inventory.id}/color/${inventory.color}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stock: inventory.stock })
        })
        .then(response => response.json())
        .then(() => {
            loadInventories();
        });
    });
};

function getTotalStock(model, capacity) {
    const key = `${model}-${capacity}`;
    return inventoryTotalStockMap[key] || 0;
}

window.addColor = function(model, capacity) {
    const detailRow = document.querySelector(`tr[data-model="${model}"][data-capacity="${capacity}"]`);
    const uniqueId = Date.now();
    const newColorDiv = document.createElement('div');
    newColorDiv.innerHTML = `
        <span>Color: <input type="text" class="form-control d-inline-block w-25" placeholder="Nuevo color" id="newColorInput-${uniqueId}" /></span>
        <span>Stock: <input type="number" class="form-control d-inline-block w-25" value="0" readonly /></span>
        <button class="btn btn-primary btn-sm" onclick="saveNewColor('${model}', '${capacity}', '${uniqueId}')">Guardar Color</button>
    `;
    detailRow.appendChild(newColorDiv);
};

window.saveNewColor = function(model, capacity, uniqueId) {
    const newColorInput = document.getElementById(`newColorInput-${uniqueId}`);
    const newColor = newColorInput.value.trim();
    if (!newColor) {
        alert('Por favor, ingresa un color válido.');
        return;
    }

    const detailRow = document.querySelector(`tr[data-model="${model}"][data-capacity="${capacity}"]`);
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
        stock: 0
    };

    fetch('http://localhost:3000/inventarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newInventoryData)
    })
    .then(response => response.json())
    .then(() => {
        loadInventories(searchModelInput.value);
        toggleDetails(model, capacity); // Mantener el despliegue abierto
    });
};

window.cancelDetails = function(model, capacity) {
    const detailRows = inventoriesTable.querySelectorAll(`tr[data-model="${model}"][data-capacity="${capacity}"]`);
    detailRows.forEach(row => {
        row.style.display = 'none';
    });
};
