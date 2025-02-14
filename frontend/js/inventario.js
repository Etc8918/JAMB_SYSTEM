document.addEventListener('DOMContentLoaded', function () {
    const inventoriesTable = document.getElementById('inventoriesTable').getElementsByTagName('tbody')[0];
    const inventoryModal = new bootstrap.Modal(document.getElementById('inventoryModal'));
    const inventoryForm = document.getElementById('inventoryForm');
    const searchModelInput = document.getElementById('searchModel');
    
    let currentInventoryId = null;
    let currentInventoryColor = null; // Añadido para manejar el color actual

    // Función para cargar los inventarios (con o sin búsqueda)
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
        
                            // Guardar el total del stock en el mapeo utilizando una clave combinada de modelo y capacidad
                            const key = `${group.modelo}-${group.capacidad}`;
                            inventoryTotalStockMap[key] = group.totalStock;
                        });
                    } else {
                        inventoriesTable.innerHTML = "<tr><td colspan='6' class='text-center'>No se encontraron inventarios</td></tr>";
                    }
                })
                .catch(error => console.error('Error al cargar los inventarios:', error));
        }
    
    
    // Función de cancelar detalle
    window.cancelDetails = function(model, capacity) {
        const detailRows = inventoriesTable.querySelectorAll(`tr[data-model="${model}"][data-capacity="${capacity}"]`);
        detailRows.forEach(row => {
            row.style.display = 'none';
        });
    };
    
    
   

    function groupInventories(inventories) {
        const groups = {};
        inventories.forEach(inventory => {
            const key = `${inventory.tipo}-${inventory.marca}-${inventory.modelo}-${inventory.capacidad}`;
            if (!groups[key]) {
                groups[key] = {
                    tipo: inventory.tipo,
                    marca: inventory.marca,
                    modelo: inventory.modelo,
                    capacidad: inventory.capacidad, // Asegurar que la capacidad se asigna correctamente
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
        console.log(`toggleDetails called with model: ${model} and capacity: ${capacity}`);
        const detailRows = inventoriesTable.querySelectorAll(`tr[data-model="${model}"][data-capacity="${capacity}"]`);
        console.log(`Found ${detailRows.length} detail rows`);
        detailRows.forEach(row => {
            row.style.display = row.style.display === 'none' ? '' : 'none';
        });
    };
    
    
    
    

    window.editInventory = function(id, color) {
        fetch(`http://localhost:3000/inventarios/${id}/color/${color}`)
            .then(response => response.json())
            .then(inventory => {
                document.getElementById('inventoryType').value = inventory.tipo;
                document.getElementById('inventoryBrand').value = inventory.marca;
                document.getElementById('inventoryModel').value = inventory.modelo;
                document.getElementById('inventoryCapacity').value = inventory.capacidad;
                document.getElementById('inventoryColor').value = inventory.color;
                document.getElementById('inventoryStock').value = inventory.stock;
                currentInventoryId = inventory.id_inventario;
                currentInventoryColor = inventory.color;  // Guardar el color actual para la actualización
                inventoryModal.show();
            });
    };

    
    window.addColor = function(model, capacity) {
        const detailRow = document.querySelector(`tr[data-model="${model}"][data-capacity="${capacity}"]`);
        const uniqueId = Date.now(); // Usar una marca de tiempo como identificador único
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
    
        // Obtener datos existentes del inventario usando el modelo
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
            stock: 0 // Stock inicializado a 0
        };
    
        fetch('http://localhost:3000/inventarios', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newInventoryData)
        })
        .then(response => response.json())
        .then(() => {
            // Aquí actualizamos la fila de detalles sin recargar toda la tabla
            const detailRow = document.querySelector(`tr[data-model="${model}"][data-capacity="${capacity}"]`);
            const newColorDiv = document.createElement('div');
            newColorDiv.innerHTML = `
                <span>Color: ${newColor}</span>
                <span>Stock: <input type="number" class="form-control d-inline-block w-25" value="0" data-id="null" data-color="${newColor}" readonly /></span>
                <input type="hidden" data-field="type" value="${type}" />
                <input type="hidden" data-field="brand" value="${brand}" />
                <input type="hidden" data-field="model" value="${modelValue}" />
                <input type="hidden" data-field="capacity" value="${capacityValue}" />
            `;
            detailRow.appendChild(newColorDiv);
        
            newColorInput.value = ''; // Limpiar el campo de entrada
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
    

    window.editStock = function(id, color) {
        const input = document.querySelector(`input[data-color="${color}"]`);
        input.removeAttribute('readonly');
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
    
    

    inventoryForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const inventoryData = {
            tipo: document.getElementById('inventoryType').value,
            marca: document.getElementById('inventoryBrand').value,
            modelo: document.getElementById('inventoryModel').value,
            capacidad: document.getElementById('inventoryCapacity').value,
            color: document.getElementById('inventoryColor').value,
            stock: document.getElementById('inventoryStock').value
        };

        if (currentInventoryId) {
            fetch(`http://localhost:3000/inventarios/${currentInventoryId}/color/${currentInventoryColor}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(inventoryData)
            })
            .then(response => response.json())
            .then(() => {
                loadInventories();
                inventoryModal.hide();
            });
        } else {
            fetch('http://localhost:3000/inventarios', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(inventoryData)
            })
            .then(response => response.json())
            .then(() => {
                loadInventories();
                inventoryModal.hide();
            });
        }

        currentInventoryId = null;
        currentInventoryColor = null;  // Restablecer el color actual después de la actualización
        inventoryForm.reset();
    });

    // Cargar los inventarios al inicio
    loadInventories();

    searchModelInput.addEventListener('input', function () {
        const searchQuery = searchModelInput.value; 
        loadInventories(searchQuery); 
});



document.getElementById('addInventoryBtn').addEventListener('click', function () {
    currentInventoryId = null;
    currentInventoryColor = null; // Añadido para manejar el color actual
    inventoryForm.reset();
    inventoryModal.show();
});

});
