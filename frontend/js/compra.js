document.addEventListener('DOMContentLoaded', function () {
  const compraForm = document.getElementById('compraForm');
  const detalleCompraForm = document.getElementById('detalleCompraForm');
  const proveedorCompra = document.getElementById('proveedorCompra');
  const modeloDetalle = document.getElementById('modeloDetalle');
  const capacidadDetalle = document.getElementById('capacidadDetalle');
  const colorDetalle = document.getElementById('colorDetalle');
  const addProveedorBtn = document.getElementById('addProveedorBtn');
  const addModeloBtn = document.getElementById('addModeloBtn');
  const proveedorModal = new bootstrap.Modal(document.getElementById('proveedorModal'));
  const inventarioModal = new bootstrap.Modal(document.getElementById('inventarioModal'));
  const proveedorForm = document.getElementById('proveedorForm');
  const inventarioForm = document.getElementById('inventarioForm');
  const equiposAgregadosTable = document.getElementById('equiposAgregadosTable').getElementsByTagName('tbody')[0];

  // Obtener la fecha actual y establecerla en el campo de fecha
  document.getElementById('fechaCompra').value = new Date().toISOString().slice(0, 10);

  // Cargar proveedores
  function loadProveedores() {
    fetch('http://localhost:3000/proveedores')
      .then(response => response.json())
      .then(proveedores => {
        proveedorCompra.innerHTML = '';
        proveedores.forEach(proveedor => {
          const option = document.createElement('option');
          option.value = proveedor.id_proveedor;
          option.textContent = proveedor.nombre;
          proveedorCompra.appendChild(option);
        });
      })
      .catch(error => console.error('Error al cargar los proveedores:', error));
  }


// Cargar inventarios
function loadInventarios() {
  fetch('http://localhost:3000/inventarios')
    .then(response => response.json())
    .then(inventarios => {
      const modelosUnicos = [];

      inventarios.forEach(inventario => {
        const modeloCompleto = `${inventario.marca} - ${inventario.modelo}`;
        if (!modelosUnicos.includes(modeloCompleto)) {
          modelosUnicos.push(modeloCompleto);
          const option = document.createElement('option');
          option.value = inventario.modelo;
          option.textContent = modeloCompleto;
          option.dataset.tipo = inventario.tipo;  // Guardar tipo en data attribute
          option.dataset.marca = inventario.marca;  // Guardar marca en data attribute
          modeloDetalle.appendChild(option);
        }
      });
    })
    .catch(error => console.error('Error al cargar los inventarios:', error));
}


  // Manejar el cambio del modelo para cargar capacidades y colores
  modeloDetalle.addEventListener('change', function () {
    const modeloSeleccionado = modeloDetalle.options[modeloDetalle.selectedIndex];
    const tipo = modeloSeleccionado.dataset.tipo;
    const marca = modeloSeleccionado.dataset.marca;
  
    document.getElementById('inventoryType').value = tipo;
    document.getElementById('inventoryBrand').value = marca;
  
    // Cargar capacidades y colores basados en el modelo y la marca
    fetch(`http://localhost:3000/modelos_capacidades?modelo=${modeloSeleccionado.value}&marca=${marca}`)
      .then(response => response.json())
      .then(data => {
        capacidadDetalle.innerHTML = '';
        colorDetalle.innerHTML = '';
  
        const capacidadesUnicas = [];
        const coloresPorCapacidad = {};
  
        data.forEach(item => {
          if (!capacidadesUnicas.includes(item.capacidad)) {
            capacidadesUnicas.push(item.capacidad);
            const capacidadOption = document.createElement('option');
            capacidadOption.value = item.capacidad;
            capacidadOption.textContent = item.capacidad;
            capacidadDetalle.appendChild(capacidadOption);
          }
  
          if (!coloresPorCapacidad[item.capacidad]) {
            coloresPorCapacidad[item.capacidad] = [];
          }
  
          if (!coloresPorCapacidad[item.capacidad].includes(item.color)) {
            coloresPorCapacidad[item.capacidad].push(item.color);
          }
        });
  
        // Manejar cambio de capacidad para actualizar colores
        capacidadDetalle.addEventListener('change', function () {
          const capacidadSeleccionada = capacidadDetalle.value;
          colorDetalle.innerHTML = '';
  
          coloresPorCapacidad[capacidadSeleccionada].forEach(color => {
            const colorOption = document.createElement('option');
            colorOption.value = color;
            colorOption.textContent = color;
            colorDetalle.appendChild(colorOption);
          });
        });
  
        // Disparar evento para cargar colores del primer elemento de capacidad por defecto
        if (capacidadesUnicas.length > 0) {
          capacidadDetalle.dispatchEvent(new Event('change'));
        }
      })
      .catch(error => console.error('Error al cargar las capacidades y colores:', error));
  });
  
  
  

// Manejar el envío del formulario de compra
compraForm.addEventListener('submit', function (e) {
  e.preventDefault();

  // Obtener detalles agregados
  const detalles = obtenerDetallesAgregados();

  // Calcular costo_total
  let costoTotal = 0;
  detalles.forEach(detalle => {
    costoTotal += detalle.cantidad * detalle.costo;
  });

  const compraData = {
    proveedor_id: proveedorCompra.value,
    costo_total: costoTotal,
    saldo_favor: 0, // Inicialmente 0
    saldo_pendiente: costoTotal, // Inicialmente igual a costo_total
    detalles: detalles // Agregar detalles a la compra
  };

  console.log('Datos enviados al servidor:', compraData);

  fetch('http://localhost:3000/compras', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(compraData)
  })
  .then(response => response.json())
  .then(data => {
    console.log(data.message);
    // Resetear formularios después de registrar la compra
    compraForm.reset();
    detalleCompraForm.reset();
    equiposAgregadosTable.innerHTML = '';
    document.getElementById('fechaCompra').value = new Date().toISOString().slice(0, 10);
  })
  .catch(error => console.error('Error al registrar la compra:', error));
});

// Función para obtener los detalles agregados en la tabla
function obtenerDetallesAgregados() {
  const filas = equiposAgregadosTable.getElementsByTagName('tr');
  const detalles = [];

  for (let i = 0; i < filas.length; i++) {
    const celdas = filas[i].getElementsByTagName('td');
    const detalle = {
      tipo: celdas[0].textContent,
      marca: celdas[1].textContent,
      modelo: celdas[2].textContent,
      capacidad: celdas[3].textContent,
      color: celdas[4].textContent,
      cantidad: parseFloat(celdas[5].textContent),
      costo: parseFloat(celdas[6].textContent)
    };
    detalles.push(detalle);
  }

  return detalles;
}


// Función para agregar detalle de compra a la tabla
detalleCompraForm.addEventListener('submit', function (e) {
  e.preventDefault();

  const tipo = document.getElementById('inventoryType').value;
  const marca = document.getElementById('inventoryBrand').value;
  const modelo = modeloDetalle.value;
  const capacidad = capacidadDetalle.value;
  const color = colorDetalle.value;
  const cantidad = document.getElementById('cantidadDetalle').value;
  const costo = document.getElementById('costoDetalle').value;

  const row = equiposAgregadosTable.insertRow();
  row.innerHTML = `
    <td>${tipo}</td>
    <td>${marca}</td>
    <td>${modelo}</td>
    <td>${capacidad}</td>
    <td>${color}</td>
    <td>${cantidad}</td>
    <td>${costo}</td>
    <td><button class="btn btn-danger btn-sm" onclick="eliminarFila(this)">Eliminar</button></td>
  `;

  // Resetear el formulario de detalle después de agregar el equipo
  detalleCompraForm.reset();
});


  
  // Función para obtener los detalles agregados en la tabla
  function obtenerDetallesAgregados() {
    const filas = equiposAgregadosTable.getElementsByTagName('tr');
    const detalles = [];
  
    for (let i = 0; i < filas.length; i++) {
      const celdas = filas[i].getElementsByTagName('td');
      const detalle = {
        tipo: celdas[0].textContent,
        marca: celdas[1].textContent,
        modelo: celdas[2].textContent,
        capacidad: celdas[3].textContent,
        color: celdas[4].textContent,
        cantidad: parseFloat(celdas[5].textContent),
        costo: parseFloat(celdas[6].textContent)
      };
      detalles.push(detalle);
    }
  
    return detalles;
  }
  
  



  // Función para eliminar una fila de la tabla de equipos agregados
  window.eliminarFila = function (btn) {
    const row = btn.parentNode.parentNode;
    equiposAgregadosTable.deleteRow(row.rowIndex - 1);
  };

  // Mostrar modal para agregar proveedor
  addProveedorBtn.addEventListener('click', function () {
    proveedorModal.show();
  });

  // Manejar el envío del formulario de proveedor
  proveedorForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const proveedorData = {
      nombre: document.getElementById('providerName').value,
      contacto: document.getElementById('providerContact').value,
      telefono: document.getElementById('providerPhone').value,
      direccion: document.getElementById('providerDireccion').value
    };

    fetch('http://localhost:3000/proveedores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(proveedorData)
    })
    .then(response => response.json())
    .then(data => {
      console.log(data.message);
      loadProveedores();
      proveedorModal.hide();
    })
    .catch(error => console.error('Error al registrar el proveedor:', error));
  });

  // Mostrar modal para agregar inventario
  addModeloBtn.addEventListener('click', function () {
    inventarioModal.show();
  });

  // Manejar el envío del formulario de inventario
  inventarioForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const inventarioData = {
      tipo: document.getElementById('inventoryType').value,
      marca: document.getElementById('inventoryBrand').value,
      modelo: document.getElementById('inventoryModel').value,
      capacidad: document.getElementById('inventoryCapacity').value,
      color: document.getElementById('inventoryColor').value,
      stock: 0 
    };

    fetch('http://localhost:3000/inventarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inventarioData)
    })
    .then(response => response.json())
    .then(data => {
      console.log(data.message);
      loadInventarios();
      inventarioModal.hide();
    })
    .catch(error => console.error('Error al registrar el inventario:', error));
  });

  // Cargar los datos iniciales
  loadProveedores();
  loadInventarios();
});
