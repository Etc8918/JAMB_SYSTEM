document.addEventListener('DOMContentLoaded', function () {
    const providersTable = document.getElementById('providersTable').getElementsByTagName('tbody')[0];
    const providerModal = new bootstrap.Modal(document.getElementById('providerModal'));
    const providerForm = document.getElementById('providerForm');
    const searchNameInput = document.getElementById('searchNameProvider');
    let currentProviderId = null;
  
    // Función para cargar los proveedores (con o sin búsqueda)
    function loadProviders(searchQuery = '') {
        let url = 'http://localhost:3000/proveedores'; // Ruta para obtener proveedores
  
        // Si hay un texto de búsqueda, añadimos el query string a la URL
        if (searchQuery) {
            url += `?nombre=${searchQuery}`;
        }
  
        fetch(url)
            .then(response => response.json())
            .then(providers => {
                providersTable.innerHTML = ''; // Limpiar la tabla antes de agregar nuevos datos
                if (providers.length > 0) {
                    providers.forEach(provider => {
                        const row = providersTable.insertRow();
                        row.innerHTML = `
                            <td>${provider.id_proveedor}</td>
                            <td>${provider.nombre}</td>
                            <td>${provider.contacto}</td>
                            <td>${provider.telefono}</td>
                            <td>${provider.direccion}</td>
                            <td>
                                <button class="btn btn-warning btn-sm edit-btn" data-id="${provider.id_proveedor}">Editar</button>
                                <button class="btn btn-danger btn-sm delete-btn" data-id="${provider.id_proveedor}">Eliminar</button>
                            </td>
                        `;
                    });
  
                    // Asignar eventos a los botones de editar y eliminar
                    const editButtons = document.querySelectorAll('.edit-btn');
                    editButtons.forEach(button => {
                        button.addEventListener('click', function () {
                            editProvider(button.dataset.id);
                        });
                    });
  
                    const deleteButtons = document.querySelectorAll('.delete-btn');
                    deleteButtons.forEach(button => {
                        button.addEventListener('click', function () {
                            deleteProvider(button.dataset.id);
                        });
                    });
                } else {
                    // Si no se encontraron resultados, mostrar un mensaje
                    providersTable.innerHTML = "<tr><td colspan='6' class='text-center'>No se encontraron proveedores</td></tr>";
                }
            })
            .catch(error => {
                console.error('Error al cargar los proveedores:', error);
                alert('Ocurrió un error al cargar los proveedores.');
            });
    }
  
    // Función para agregar o editar un proveedor
    providerForm.addEventListener('submit', function (e) {
        e.preventDefault();
  
        const providerData = {
            nombre: document.getElementById('providerName').value,
            contacto: document.getElementById('providerContact').value,
            telefono: document.getElementById('providerPhone').value,
            direccion: document.getElementById('providerDireccion').value
        };
  
        if (currentProviderId) {
            // Si hay un proveedor seleccionado, actualizar
            fetch(`http://localhost:3000/proveedores/${currentProviderId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(providerData)
            })
            .then(response => response.json())
            .then(() => {
                loadProviders();
                providerModal.hide();
            })
            .catch(error => {
                console.error('Error al actualizar el proveedor:', error);
                alert('Ocurrió un error al actualizar el proveedor.');
            });
        } else {
            // Si no, crear uno nuevo
            fetch('http://localhost:3000/proveedores', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(providerData)
            })
            .then(response => response.json())
            .then(() => {
                loadProviders();
                providerModal.hide();
            })
            .catch(error => {
                console.error('Error al crear el proveedor:', error);
                alert('Ocurrió un error al crear el proveedor.');
            });
        }
  
        currentProviderId = null;
        providerForm.reset();
    });
  
    // Función para editar un proveedor
    function editProvider(id) {
        fetch(`http://localhost:3000/proveedores/${id}`)
            .then(response => response.json())
            .then(provider => {
                document.getElementById('providerName').value = provider.nombre;
                document.getElementById('providerContact').value = provider.contacto;
                document.getElementById('providerPhone').value = provider.telefono;
                document.getElementById('providerDireccion').value = provider.direccion;
                currentProviderId = provider.id_proveedor;
                providerModal.show();
            })
            .catch(error => {
                console.error('Error al obtener el proveedor:', error);
                alert('Ocurrió un error al obtener los detalles del proveedor.');
            });
    }
  
    // Función para eliminar un proveedor
    function deleteProvider(id) {
        if (confirm('¿Estás seguro de que deseas eliminar este proveedor?')) {
            fetch(`http://localhost:3000/proveedores/${id}`, {
                method: 'DELETE'
            })
            .then(response => response.json())
            .then(() => {
                loadProviders();
            })
            .catch(error => {
                console.error('Error al eliminar el proveedor:', error);
                alert('Ocurrió un error al eliminar el proveedor.');
            });
        }
    }
  
    // Cargar los proveedores al inicio
    loadProviders();
  
    // Manejar la búsqueda en tiempo real
    searchNameInput.addEventListener('input', function () {
        const searchQuery = searchNameInput.value; // Obtener lo que el usuario está buscando
        loadProviders(searchQuery); // Recargar los proveedores con el filtro de búsqueda
    });
  
    // Mostrar el modal para agregar un proveedor
    document.getElementById('addProviderBtn').addEventListener('click', function () {
        currentProviderId = null;
        providerForm.reset();
        providerModal.show();
    });
  });
  