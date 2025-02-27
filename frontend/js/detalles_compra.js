// detalles_compra.js

document.addEventListener('DOMContentLoaded', function () {
    const tablaProveedores = document.querySelector('#tablaProveedores tbody');
    const modalEditarCostoElement = document.getElementById('modalEditarCosto');
    const modalEditarCosto = new bootstrap.Modal(modalEditarCostoElement);
    const formEditarCosto = document.getElementById('formEditarCosto');
    const idDetalleEditar = document.getElementById('id_detalle_editar');
    const nuevoCostoInput = document.getElementById('nuevo_costo');
    const alertContainer = document.getElementById('alertContainer');
  
    // Función para mostrar mensajes al usuario
    function mostrarAlerta(mensaje, tipo) {
      alertContainer.innerHTML = `
        <div class="alert alert-${tipo} alert-dismissible fade show" role="alert">
          ${mensaje}
          <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button>
        </div>
      `;
    }
  
    // Función para cargar los proveedores con saldo pendiente
    function cargarProveedoresConSaldoPendiente() {
      fetch('http://localhost:3000/api/proveedores/con_saldo_pendiente')
        .then(response => response.json())
        .then(data => {
          tablaProveedores.innerHTML = '';
          data.forEach(proveedor => {
            // Fila del proveedor
            const filaProveedor = document.createElement('tr');
            filaProveedor.classList.add('cursor-pointer');
            filaProveedor.dataset.proveedorId = proveedor.id_proveedor;
            filaProveedor.innerHTML = `
              <td>${proveedor.proveedor_nombre}</td>
              <td>${proveedor.saldo_pendiente_total}</td>
              <td><button class="btn btn-sm btn-primary btnToggleCompras">Ver Compras</button></td>
            `;
            tablaProveedores.appendChild(filaProveedor);
  
            // Fila ocultable para las compras
            const filaCompras = document.createElement('tr');
            filaCompras.classList.add('fila-compras');
            filaCompras.style.display = 'none'; // Iniciar oculta
            const celdaCompras = document.createElement('td');
            celdaCompras.colSpan = 3;
            celdaCompras.innerHTML = '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Cargando...</span></div>';
  
            filaCompras.appendChild(celdaCompras);
            tablaProveedores.appendChild(filaCompras);
  
            // Evento para mostrar/ocultar compras
            filaProveedor.querySelector('.btnToggleCompras').addEventListener('click', function () {
              if (filaCompras.style.display === 'none') {
                filaCompras.style.display = '';
                this.textContent = 'Ocultar Compras';
  
                // Cargar compras y detalles
                cargarComprasPorProveedor(proveedor.id_proveedor, celdaCompras);
              } else {
                filaCompras.style.display = 'none';
                this.textContent = 'Ver Compras';
                celdaCompras.innerHTML = ''; // Limpiar contenido
              }
            });
          });
        })
        .catch(error => {
          console.error('Error al cargar los proveedores con saldo pendiente:', error);
          mostrarAlerta('Error al cargar los proveedores.', 'danger');
        });
    }
  
    // Función para cargar las compras y detalles por proveedor
    function cargarComprasPorProveedor(proveedorId, contenedor) {
      fetch(`http://localhost:3000/api/compras/compras_por_proveedor/${proveedorId}`)
        .then(response => response.json())
        .then(data => {
          if (data.length === 0) {
            contenedor.innerHTML = '<em>No hay compras para este proveedor.</em>';
            return;
          }
  
          const tablaCompras = document.createElement('table');
          tablaCompras.classList.add('table', 'table-bordered', 'mt-2');
          tablaCompras.innerHTML = `
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Costo Total</th>
                <th>Saldo Pendiente</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody></tbody>
          `;
  
          const tbodyCompras = tablaCompras.querySelector('tbody');
  
          data.forEach(compra => {
            const filaCompra = document.createElement('tr');
            filaCompra.classList.add('cursor-pointer');
            filaCompra.dataset.compraId = compra.id_compra;
            filaCompra.innerHTML = `
              <td>${compra.fecha}</td>
              <td>${compra.estado}</td>
              <td>${compra.costo_total}</td>
              <td>${compra.saldo_pendiente}</td>
              <td><button class="btn btn-sm btn-secondary btnToggleDetalles">Ver Detalles</button></td>
            `;
            tbodyCompras.appendChild(filaCompra);
  
            // Fila para detalles
            const filaDetalles = document.createElement('tr');
            filaDetalles.style.display = 'none';
            const celdaDetalles = document.createElement('td');
            celdaDetalles.colSpan = 5;
  
            if (compra.detalles.length > 0) {
              const tablaDetalles = document.createElement('table');
              tablaDetalles.classList.add('table', 'table-sm', 'table-striped', 'mt-2');
              tablaDetalles.innerHTML = `
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Marca</th>
                    <th>Modelo</th>
                    <th>Capacidad</th>
                    <th>Color</th>
                    <th>Cantidad</th>
                    <th>Costo</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody></tbody>
              `;
  
              const tbodyDetalles = tablaDetalles.querySelector('tbody');
  
              compra.detalles.forEach(detalle => {
                const filaDetalle = document.createElement('tr');
                filaDetalle.innerHTML = `
                  <td>${detalle.tipo}</td>
                  <td>${detalle.marca}</td>
                  <td>${detalle.modelo}</td>
                  <td>${detalle.capacidad}</td>
                  <td>${detalle.color}</td>
                  <td>${detalle.cantidad}</td>
                  <td>${detalle.costo}</td>
                  <td><button class="btn btn-sm btn-warning btnEditarCosto" data-id-detalle="${detalle.id_detalle}">Editar Costo</button></td>
                `;
                tbodyDetalles.appendChild(filaDetalle);
              });
  
              celdaDetalles.appendChild(tablaDetalles);
            } else {
              celdaDetalles.innerHTML = '<em>No hay detalles para esta compra.</em>';
            }
  
            filaDetalles.appendChild(celdaDetalles);
            tbodyCompras.appendChild(filaDetalles);
  
            // Evento para mostrar/ocultar detalles
            filaCompra.querySelector('.btnToggleDetalles').addEventListener('click', function () {
              if (filaDetalles.style.display === 'none') {
                filaDetalles.style.display = '';
                this.textContent = 'Ocultar Detalles';
              } else {
                filaDetalles.style.display = 'none';
                this.textContent = 'Ver Detalles';
              }
            });
          });
  
          contenedor.innerHTML = '';
          contenedor.appendChild(tablaCompras);
  
          // Añadir eventos a los botones de editar costo
          const botonesEditarCosto = contenedor.querySelectorAll('.btnEditarCosto');
          botonesEditarCosto.forEach(boton => {
            boton.addEventListener('click', function () {
              const idDetalle = this.dataset.idDetalle;
              idDetalleEditar.value = idDetalle;
              nuevoCostoInput.value = '';
              modalEditarCosto.show();
            });
          });
        })
        .catch(error => {
          console.error('Error al cargar las compras por proveedor:', error);
          contenedor.innerHTML = '<em>Error al cargar las compras.</em>';
        });
    }
  
    // Evento al enviar el formulario de editar costo
    if (formEditarCosto) {
      formEditarCosto.addEventListener('submit', function (e) {
        e.preventDefault();
        const idDetalle = idDetalleEditar.value;
        const nuevoCosto = nuevoCostoInput.value;
  
        // Validar que el costo es válido
        if (!nuevoCosto || isNaN(nuevoCosto) || nuevoCosto <= 0) {
          mostrarAlerta('Por favor, ingresa un costo válido.', 'warning');
          return;
        }
  
        // Actualizar el costo en el servidor
        fetch(`http://localhost:3000/api/detalles_compra/${idDetalle}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ costo: nuevoCosto })
        })
          .then(response => response.json())
          .then(data => {
            mostrarAlerta(data.message, 'success');
            modalEditarCosto.hide();
            cargarProveedoresConSaldoPendiente();
          })
          .catch(error => {
            console.error('Error al actualizar el costo:', error);
            mostrarAlerta('Error al actualizar el costo.', 'danger');
          });
      });
    } else {
      console.error('El formulario de edición de costo no se encontró en el DOM.');
    }
  
    // Cargar los proveedores al iniciar
    cargarProveedoresConSaldoPendiente();
  });
  