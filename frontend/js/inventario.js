document.addEventListener('DOMContentLoaded', function () {
    const inventoriesTable = document.getElementById('inventoriesTable').getElementsByTagName('tbody')[0];
    const inventoryModal = new bootstrap.Modal(document.getElementById('inventoryModal'));
    const inventoryForm = document.getElementById('inventoryForm');
    const searchModelInput = document.getElementById('searchModel');
  
    let currentInventoryId = null;
  
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
            if (inventories.length > 0) {
                // Ordenar los inventarios por marca ascendente
                inventories.sort((a, b) => a.marca.localeCompare(b.marca));

                inventories.forEach(inventory => {
                    const row = inventoriesTable.insertRow();
                    row.innerHTML = `
                        <td>${inventory.id_inventario}</td>
                        <td>${inventory.tipo}</td>
                        <td>${inventory.marca}</td>
                        <td>${inventory.modelo}</td>
                        <td>${inventory.capacidad}</td>
                        <td>${inventory.color}</td>
                        <td>${inventory.stock}</td>
                        <td>
                            <button class="btn btn-warning btn-sm" onclick="editInventory(${inventory.id_inventario})">Editar</button>
                            <button class="btn btn-danger btn-sm" onclick="confirmDeleteInventory(${inventory.id_inventario})">Eliminar</button>
                        </td>
                    `;
                });
            } else {
                inventoriesTable.innerHTML = "<tr><td colspan='8' class='text-center'>No se encontraron inventarios</td></tr>";
            }
        })
        .catch(error => console.error('Error al cargar los inventarios:', error));
}
  
    // Función para agregar o editar un inventario
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
            // Si hay un inventario seleccionado, actualizar
            fetch(`http://localhost:3000/inventarios/${currentInventoryId}`, {
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
            // Si no, crear uno nuevo
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
        inventoryForm.reset();
    });
  
    // Función para editar un inventario
    window.editInventory = function(id) {
        fetch(`http://localhost:3000/inventarios/${id}`)
            .then(response => response.json())
            .then(inventory => {
                document.getElementById('inventoryType').value = inventory.tipo;
                document.getElementById('inventoryBrand').value = inventory.marca;
                document.getElementById('inventoryModel').value = inventory.modelo;
                document.getElementById('inventoryCapacity').value = inventory.capacidad;
                document.getElementById('inventoryColor').value = inventory.color;
                document.getElementById('inventoryStock').value = inventory.stock;
                currentInventoryId = inventory.id_inventario;
                inventoryModal.show();
            });
    };
  
    // Función para confirmar la eliminación de un inventario
    window.confirmDeleteInventory = function(id) {
        if (confirm('¿Estás seguro de que deseas eliminar este inventario?')) {
            deleteInventory(id);
        }
    };
  
    // Función para eliminar un inventario
    function deleteInventory(id) {
        fetch(`http://localhost:3000/inventarios/${id}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(() => loadInventories());
    }
  
    // Cargar los inventarios al inicio
    loadInventories();
  
    // Manejar la búsqueda en tiempo real
    searchModelInput.addEventListener('input', function () {
        const searchQuery = searchModelInput.value; // Obtener lo que el usuario está buscando
        loadInventories(searchQuery); // Recargar los inventarios con el filtro de búsqueda
    });
  
    // Mostrar el modal para agregar un inventario
    document.getElementById('addInventoryBtn').addEventListener('click', function () {
        currentInventoryId = null;
        inventoryForm.reset();
        inventoryModal.show();
    });
  });
  