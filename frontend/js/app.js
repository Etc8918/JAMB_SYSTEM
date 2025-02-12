document.addEventListener('DOMContentLoaded', function () {
  const clientsTable = document.getElementById('clientsTable').getElementsByTagName('tbody')[0];
  const clientModal = new bootstrap.Modal(document.getElementById('clientModal'));
  const clientForm = document.getElementById('clientForm');
  const searchNameInput = document.getElementById('searchName');

  let currentClientId = null;

  // Función para cargar los clientes (con o sin búsqueda)
  function loadClients(searchQuery = '') {
      let url = 'http://localhost:3000/clientes'; // Sin '/api', ya que no lo tienes en el backend

      // Si hay un texto de búsqueda, añadimos el query string a la URL
      if (searchQuery) {
          url += `?nombre=${searchQuery}`;
      }

      fetch(url)
          .then(response => response.json())
          .then(clients => {
              clientsTable.innerHTML = ''; // Limpiar la tabla antes de agregar nuevos datos
              if (clients.length > 0) {
                  clients.forEach(client => {
                      const row = clientsTable.insertRow();
                      row.innerHTML = `
                          <td>${client.id_cliente}</td>
                          <td>${client.nombre}</td>
                          <td>${client.telefono}</td>
                          <td>${client.email}</td>
                          <td>
                              <button class="btn btn-warning btn-sm" onclick="editClient(${client.id_cliente})">Editar</button>
                              <button class="btn btn-danger btn-sm" onclick="deleteClient(${client.id_cliente})">Eliminar</button>
                          </td>
                      `;
                  });
              } else {
                  // Si no se encontraron resultados, mostrar un mensaje
                  clientsTable.innerHTML = "<tr><td colspan='5' class='text-center'>No se encontraron clientes</td></tr>";
              }
          })
          .catch(error => console.error('Error al cargar los clientes:', error));
  }

  // Función para agregar o editar un cliente
  clientForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const clientData = {
          nombre: document.getElementById('clientName').value,
          telefono: document.getElementById('clientPhone').value,
          email: document.getElementById('clientEmail').value
      };

      if (currentClientId) {
          // Si hay un cliente seleccionado, actualizar
          fetch(`http://localhost:3000/clientes/${currentClientId}`, { // Sin '/api' en la URL
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(clientData)
          })
          .then(response => response.json())
          .then(() => {
              loadClients();
              clientModal.hide();
          });
      } else {
          // Si no, crear uno nuevo
          fetch('http://localhost:3000/clientes', { // Sin '/api' en la URL
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(clientData)
          })
          .then(response => response.json())
          .then(() => {
              loadClients();
              clientModal.hide();
          });
      }

      currentClientId = null;
      clientForm.reset();
  });

  // Función para editar un cliente
  window.editClient = function(id) {
      fetch(`http://localhost:3000/clientes/${id}`) // Sin '/api' en la URL
          .then(response => response.json())
          .then(client => {
              document.getElementById('clientName').value = client.nombre;
              document.getElementById('clientPhone').value = client.telefono;
              document.getElementById('clientEmail').value = client.email;
              currentClientId = client.id_cliente;
              clientModal.show();
          });
  };

  // Función para eliminar un cliente
  window.deleteClient = function(id) {
      fetch(`http://localhost:3000/clientes/${id}`, { // Sin '/api' en la URL
          method: 'DELETE'
      })
      .then(response => response.json())
      .then(() => loadClients());
  };

  // Cargar los clientes al inicio
  loadClients();
  
  // Manejar la búsqueda en tiempo real
  searchNameInput.addEventListener('input', function () {
      const searchQuery = searchNameInput.value; // Obtener lo que el usuario está buscando
      loadClients(searchQuery); // Recargar los clientes con el filtro de búsqueda
  });

  // Mostrar el modal para agregar un cliente
  document.getElementById('addClientBtn').addEventListener('click', function () {
      currentClientId = null;
      clientForm.reset();
      clientModal.show();
  });
});
