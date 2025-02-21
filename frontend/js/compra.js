document.addEventListener('DOMContentLoaded', function () {
  const compraForm = document.getElementById('compraForm');
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
  const agregarDetalleBtn = document.getElementById('agregarDetalleBtn');

  // Función para cargar proveedores
  function loadProveedores() {
    fetch('http://localhost:3000/api/proveedores')
      .then(response => response.json())
      .then(data => {
        const proveedorSelect = document.getElementById('proveedorCompra');
        proveedorSelect.innerHTML = ''; // Limpiar las opciones anteriores
        proveedorSelect.add(new Option('Selecciona un proveedor', ''));
        data.forEach(proveedor => {
          const option = document.createElement('option');
          option.value = proveedor.id_proveedor; // Usar el id_proveedor como valor
          option.textContent = proveedor.nombre;
          proveedorSelect.appendChild(option);
        });
        console.log('Proveedores cargados:', data); // Verificar los proveedores cargados
      })
      .catch(error => console.error('Error al cargar los proveedores:', error));
  }

  // Función para cargar inventarios
  function loadInventarios() {
    fetch('http://localhost:3000/api/inventarios')
      .then(response => response.json())
      .then(data => {
        const modelos = {}; // Objeto para almacenar los modelos únicos
        data.forEach(inventario => {
          const key = `${inventario.marca} - ${inventario.modelo}`;
          if (!modelos[key]) {
            modelos[key] = { capacidades: [], colores: [], tipo: inventario.tipo, marca: inventario.marca, modelo: inventario.modelo };
          }
          modelos[key].capacidades.push(inventario.capacidad);
          modelos[key].colores.push(inventario.color);
        });

        // Limpiar opciones anteriores
        modeloDetalle.innerHTML = '';
        capacidadDetalle.innerHTML = '';
        colorDetalle.innerHTML = '';

        // Agregar opciones de modelos únicos
        for (const key in modelos) {
          const optionModelo = document.createElement('option');
          optionModelo.value = key;
          optionModelo.textContent = key;
          modeloDetalle.appendChild(optionModelo);
        }

        // Guardar modelos en una variable global para su uso posterior
        window.modelos = modelos;
        console.log('Modelos cargados:', window.modelos); // Añadir log para verificar la carga
      })
      .catch(error => console.error('Error al cargar los inventarios:', error));
  }

  // Obtener la fecha actual y establecerla en el campo de fecha
  document.getElementById('fechaCompra').value = new Date().toISOString().slice(0, 10);

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

  // Función para agregar detalle de compra a la tabla
  if (agregarDetalleBtn) {
    agregarDetalleBtn.addEventListener('click', function () {
      const selectedModel = modeloDetalle.value;

      // Asegurarse de que se ha seleccionado un modelo antes de continuar
      if (!selectedModel) {
        console.error('Error: No se ha seleccionado un modelo.');
        return;
      }

      if (window.modelos && window.modelos[selectedModel]) {
        const tipo = window.modelos[selectedModel].tipo;
        const marca = window.modelos[selectedModel].marca;
        const modelo = window.modelos[selectedModel].modelo; // Obtener solo el modelo
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

        // Resetea los campos del detalle después de agregar el detalle
        modeloDetalle.value = '';
        capacidadDetalle.value = '';
        colorDetalle.value = '';
        document.getElementById('cantidadDetalle').value = '';
        document.getElementById('costoDetalle').value = '';
      } else {
        console.error('Error: El modelo seleccionado no existe en la lista de modelos.');
      }
    });
  }

  // Manejar el envío del formulario de compra
  if (compraForm) {
    compraForm.addEventListener('submit', function (e) {
      e.preventDefault(); // Evitar el envío del formulario por defecto
      console.log('Formulario de compra enviado');

      const detalles = obtenerDetallesAgregados();
      if (detalles.length === 0) {
        console.error('No se han agregado equipos. Por favor, agregue al menos un equipo antes de registrar la compra.');
        return;
      }

      let costoTotal = 0;
      detalles.forEach(detalle => {
        costoTotal += detalle.cantidad * detalle.costo;
      });

      // Asegúrate de obtener el valor del proveedor seleccionado
      const proveedorId = proveedorCompra.value;
      console.log('Proveedor seleccionado:', proveedorId); // Añadir log para verificar el proveedor seleccionado
      if (!proveedorId) {
        console.error('Por favor, seleccione un proveedor.');
        return;
      }

      const compraData = {
        proveedor_id: proveedorId,
        costo_total: costoTotal,
        saldo_favor: 0,
        saldo_pendiente: costoTotal,
        detalles: detalles
      };

      console.log('Datos enviados al servidor:', compraData); // Verificar los datos

      fetch('http://localhost:3000/api/compras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(compraData)
      })
      .then(response => {
        console.log('Respuesta del servidor:', response); // Verificar la respuesta del servidor
        return response.json();
      })
      .then(data => {
        console.log('Datos del servidor:', data); // Verificar datos devueltos
        if (data.message) {
          console.log(data.message);
          compraForm.reset();
          equiposAgregadosTable.innerHTML = '';
          document.getElementById('fechaCompra').value = new Date().toISOString().slice(0, 10);
        } else {
          console.error('Error en la respuesta del servidor:', data);
        }
      })
      .catch(error => console.error('Error al registrar la compra:', error));
    });
  }

  // Mostrar modal para agregar proveedor
  if (addProveedorBtn) {
    addProveedorBtn.addEventListener('click', function () {
      proveedorModal.show();
    });
  }

  // Manejar el envío del formulario de proveedor
  if (proveedorForm) {
    proveedorForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const proveedorData = {
        nombre: document.getElementById('providerName').value,
        contacto: document.getElementById('providerContact').value,
        telefono: document.getElementById('providerPhone').value,
        direccion: document.getElementById('providerDireccion').value
      };

      fetch('http://localhost:3000/api/proveedores', {
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
  }

  // Mostrar modal para agregar inventario
  if (addModeloBtn) {
    addModeloBtn.addEventListener('click', function () {
      inventarioModal.show();
    });
  }

  // Manejar el envío del formulario de inventario
  if (inventarioForm) {
    inventarioForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const inventarioData = {
        tipo: document.getElementById('inventoryType').value,
        marca: document.getElementById('inventoryBrand').value,
        modelo: document.getElementById('inventoryModel').value,
        capacidad: document.getElementById('inventoryCapacity').value,
        color: document.getElementById('inventoryColor').value,
        stock: 0 // Inicialmente 0
      };

      fetch('http://localhost:3000/api/inventarios', {
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
  }

  // Manejar el cambio en el combobox de modeloDetalle
  if (modeloDetalle) {
    modeloDetalle.addEventListener('change', function () {
      const selectedModel = modeloDetalle.value;
      fetch(`http://localhost:3000/api/capacidades_colores?modelo=${selectedModel.split(' - ')[1]}&marca=${selectedModel.split(' - ')[0]}`)
        .then(response => response.json())
        .then(data => {
          const capacidades = [...new Set(data.map(item => item.capacidad))];
          const colores = [...new Set(data.map(item => item.color))];
          const tipo = data.length > 0 ? data[0].tipo : '';

          document.getElementById('inventoryType').value = tipo;
          document.getElementById('inventoryBrand').value = selectedModel.split(' - ')[0];

          // Limpiar opciones anteriores
          capacidadDetalle.innerHTML = '';
          colorDetalle.innerHTML = '';

          // Agregar nuevas opciones de capacidad
          capacidades.forEach(capacidad => {
            const optionCapacidad = document.createElement('option');
            optionCapacidad.value = capacidad;
            optionCapacidad.textContent = capacidad;
            capacidadDetalle.appendChild(optionCapacidad);
          });

          // Agregar nuevas opciones de color
          colores.forEach(color => {
            const optionColor = document.createElement('option');
            optionColor.value = color;
            optionColor.textContent = color;
            colorDetalle.appendChild(optionColor);
          });
        })
        .catch(error => console.error('Error al cargar capacidades y colores:', error));
    });
  }

  // Cargar los datos iniciales
  loadProveedores();
  loadInventarios();
});
