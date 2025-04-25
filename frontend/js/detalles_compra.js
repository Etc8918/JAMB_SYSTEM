// detalles_compra.js

function formatearFecha(fechaISO) {
  const fecha = new Date(fechaISO);
  const dia = String(fecha.getDate()).padStart(2, '0');
  const mes = String(fecha.getMonth() + 1).padStart(2, '0'); // +1 porque enero = 0
  const anio = fecha.getFullYear();
  return `${dia}-${mes}-${anio}`;
}

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
          if (!Array.isArray(data)) {
            console.error("❌ Respuesta inesperada:", data);
            mostrarMensajeError("La respuesta del servidor no es válida.");
            return;
          }
    
          if (data.length === 0) {
            mostrarMensajeError("No hay compras registradas para este proveedor.");
            return;
          }
    
          // Aquí usamos el nuevo sistema de agrupación con selects
          mostrarSelectsDeFiltro(data, contenedor, renderTablaCompras);
        })
        .catch(error => {
          console.error('Error al cargar las compras por proveedor:', error);
          contenedor.innerHTML = '<em>Error al cargar las compras.</em>';
        });
    }

    function renderTablaCompras(data, contenedor) {
      const tablaCompras = document.createElement('table');
      tablaCompras.classList.add('table', 'table-bordered', 'mt-2');
      tablaCompras.innerHTML = `
        <thead>
          <tr>
            <th>Fecha</th>
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
          <td>${formatearFecha(compra.fecha)}</td>
          <td>${compra.costo_total}</td>
          <td>${compra.saldo_pendiente}</td>
          <td><button class="btn btn-sm btn-secondary btnToggleDetalles">Ver Detalles</button></td>
        `;
        tbodyCompras.appendChild(filaCompra);
    
        const filaDetalles = document.createElement('tr');
        filaDetalles.style.display = 'none';
        const celdaDetalles = document.createElement('td');
        celdaDetalles.colSpan = 5;
    
        if (Array.isArray(compra.detalles) && compra.detalles.length > 0) {
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
    
        filaCompra.querySelector('.btnToggleDetalles').addEventListener('click', async function () {
          if (filaDetalles.style.display === 'none') {
            try {
              const response = await fetch(`http://localhost:3000/api/compras/detalles/${compra.id_compra}`);
              const detalles = await response.json();
        
              if (!Array.isArray(detalles) || detalles.length === 0) {
                celdaDetalles.innerHTML = '<em>No hay detalles para esta compra.</em>';
                filaDetalles.style.display = '';
                this.textContent = 'Ocultar Detalles';
                return;
              }
        
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
                  </tr>
                </thead>
                <tbody>
                
                  ${detalles.map(det => `
                    <tr>
                      <td>${det.tipo}</td>
                      <td>${det.marca}</td>
                      <td>${det.modelo}</td>
                      <td>${det.capacidad}</td>
                      <td>${det.color}</td>
                      <td>${det.cantidad}</td>
                      <td>${det.costo}</td>
                      
                      <td>
                        <span id="imeiStatus-${det.id_detalle}" class="badge bg-secondary mb-1">${det.imeis_registrados || 0} de ${det.cantidad}</span><br>
                        <button class="btn btn-sm btn-outline-primary btnRegistrarImeis"
                              data-id="${det.id_detalle}" 
                               data-cantidad="${det.cantidad}">
                                Registrar IMEIs
                                  </button>


                      </td>
                    </tr>
                  `).join('')
                  }
                </tbody>
              `;
        
              celdaDetalles.innerHTML = '';
              celdaDetalles.appendChild(tablaDetalles);
              filaDetalles.style.display = '';
              this.textContent = 'Ocultar Detalles';
        
            } catch (error) {
              console.error("❌ Error al obtener detalles:", error);
              celdaDetalles.innerHTML = '<em>Error al cargar los detalles.</em>';
              filaDetalles.style.display = '';
            }
          } else {
            filaDetalles.style.display = 'none';
            this.textContent = 'Ver Detalles';
          }
        });
        
      });
    
      contenedor.innerHTML = '';
      contenedor.appendChild(tablaCompras);
    
      const botonesEditarCosto = contenedor.querySelectorAll('.btnEditarCosto');
      botonesEditarCosto.forEach(boton => {
        boton.addEventListener('click', function () {
          const idDetalle = this.dataset.idDetalle;
          idDetalleEditar.value = idDetalle;
          nuevoCostoInput.value = '';
          modalEditarCosto.show();
        });
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
  
  function agruparComprasPorAnioYMes(compras) {
    const agrupadas = {};
  
    compras.forEach(compra => {
      const fecha = new Date(compra.fecha);
      const anio = fecha.getFullYear();
      const mes = fecha.getMonth() + 1;
  
      if (!agrupadas[anio]) agrupadas[anio] = {};
      if (!agrupadas[anio][mes]) agrupadas[anio][mes] = [];
  
      agrupadas[anio][mes].push(compra);
    });
  
    return agrupadas;
  }
  
  function mostrarSelectsDeFiltro(compras, contenedor, renderTablaCallback) {
    const agrupadas = agruparComprasPorAnioYMes(compras);
  
    const selectAnio = document.createElement('select');
    const selectMes = document.createElement('select');
    const contenedorTabla = document.createElement('div');
  
    selectAnio.innerHTML = `<option value="">Selecciona un año</option>`;
    Object.keys(agrupadas).forEach(anio => {
      selectAnio.innerHTML += `<option value="${anio}">${anio}</option>`;
    });
  
    selectMes.innerHTML = `<option value="">Selecciona un mes</option>`;
  
    selectAnio.addEventListener('change', () => {
      const anio = selectAnio.value;
      selectMes.innerHTML = `<option value="">Selecciona un mes</option>`;
  
      if (agrupadas[anio]) {
        Object.keys(agrupadas[anio]).forEach(mes => {
          selectMes.innerHTML += `<option value="${mes}">${mes}-${anio}</option>`;
        });
      }
    });
  
    selectMes.addEventListener('change', () => {
      const anio = selectAnio.value;
      const mes = selectMes.value;
      const comprasFiltradas = agrupadas[anio][mes] || [];
      contenedorTabla.innerHTML = '';
      renderTablaCallback(comprasFiltradas, contenedorTabla);
    });
  
    contenedor.innerHTML = '';
    contenedor.appendChild(selectAnio);
    contenedor.appendChild(selectMes);
    contenedor.appendChild(contenedorTabla);
  }
  
  function mostrarSelectsDeFiltro(compras, contenedor, renderTablaCallback) {
    const agrupadas = agruparComprasPorAnioYMes(compras);
  
    const wrapperFiltros = document.createElement('div');
    wrapperFiltros.classList.add('d-flex', 'flex-wrap', 'gap-2', 'mb-3');
  
    const selectAnio = document.createElement('select');
    const selectMes = document.createElement('select');
    const inputDesde = document.createElement('input');
    const inputHasta = document.createElement('input');
    const btnFiltrarRango = document.createElement('button');
    const btnVerTodo = document.createElement('button');
    const contenedorTabla = document.createElement('div');
  
    // Estilos y clases
    [selectAnio, selectMes, inputDesde, inputHasta, btnFiltrarRango, btnVerTodo].forEach(el => {
      el.classList.add('form-control');
      el.style.maxWidth = '200px';
    });
  
    selectAnio.innerHTML = `<option value="">Selecciona un año</option>`;
    Object.keys(agrupadas).forEach(anio => {
      selectAnio.innerHTML += `<option value="${anio}">${anio}</option>`;
    });
  
    const mesesTexto = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio',
                        'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  
    selectMes.innerHTML = `<option value="">Selecciona un mes</option>`;
  
    selectAnio.addEventListener('change', () => {
      const anio = selectAnio.value;
      selectMes.innerHTML = `<option value="">Selecciona un mes</option>`;
  
      if (agrupadas[anio]) {
        Object.keys(agrupadas[anio]).forEach(mes => {
          selectMes.innerHTML += `<option value="${mes}">${mesesTexto[mes - 1]}</option>`;
        });
      }
    });
  
    selectMes.addEventListener('change', () => {
      const anio = selectAnio.value;
      const mes = selectMes.value;
      const comprasFiltradas = agrupadas[anio][mes] || [];
      contenedorTabla.innerHTML = '';
      renderTablaCallback(comprasFiltradas, contenedorTabla);
    });
  
    inputDesde.type = "date";
    inputHasta.type = "date";
    inputDesde.placeholder = "Desde";
    inputHasta.placeholder = "Hasta";
  
    btnFiltrarRango.textContent = "Filtrar Rango";
    btnFiltrarRango.classList.add('btn', 'btn-primary');
    btnFiltrarRango.addEventListener('click', () => {
      const desde = new Date(inputDesde.value);
      const hasta = new Date(inputHasta.value);
      const filtradas = compras.filter(compra => {
        const fecha = new Date(compra.fecha);
        return fecha >= desde && fecha <= hasta;
      });
  
      contenedorTabla.innerHTML = '';
      renderTablaCallback(filtradas, contenedorTabla);
    });
  
    btnVerTodo.textContent = "Ver todo el historial";
    btnVerTodo.classList.add('btn', 'btn-secondary');
    btnVerTodo.addEventListener('click', () => {
      // Cambia esto por tu URL real de historial
      window.open(`/historial_compras.html?proveedor_id=${compras[0]?.proveedor_id || ''}`, '_blank');
    });
  
    wrapperFiltros.appendChild(selectAnio);
    wrapperFiltros.appendChild(selectMes);
    wrapperFiltros.appendChild(inputDesde);
    wrapperFiltros.appendChild(inputHasta);
    wrapperFiltros.appendChild(btnFiltrarRango);
    wrapperFiltros.appendChild(btnVerTodo);
  
    contenedor.innerHTML = '';
    contenedor.appendChild(wrapperFiltros);
    contenedor.appendChild(contenedorTabla);
  }
  


  const modalRegistrarImeis = new bootstrap.Modal(document.getElementById("modalRegistrarImeis"));
const formRegistrarImeis = document.getElementById("formRegistrarImeis");

formRegistrarImeis.addEventListener("submit", async function (e) {
  e.preventDefault();

  const idDetalle = document.getElementById("detalleCompraId").value;
  const imei1List = document.getElementById("textareaImei1").value.trim().split("\n").filter(l => l.trim());
  const imei2List = document.getElementById("textareaImei2").value.trim().split("\n");

  // Obtener IMEIs originales desde memoria
  const originalImeis = window.imeisOriginales || [];

  const nuevos = imei1List.filter((imei, i) => !originalImeis.some(d => d.imei1 === imei && d.imei2 === (imei2List[i]?.trim() || null)));
  const eliminados = originalImeis.filter(oi => !imei1List.includes(oi.imei1));
  const reemplazados = originalImeis.filter((oi, i) => imei1List[i] && imei1List[i] !== oi.imei1);

  let resumen = "";
  if (nuevos.length) resumen += `✅ ${nuevos.length} IMEIs nuevos agregados\n`;
  if (eliminados.length) resumen += `❌ ${eliminados.length} IMEIs eliminados\n`;
  if (reemplazados.length) resumen += `🔁 ${reemplazados.length} IMEIs reemplazados\n`;

  const confirm = await Swal.fire({
    title: "¿Confirmar cambios en IMEIs?",
    text: resumen || "No se detectaron cambios.",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Guardar",
    cancelButtonText: "Cancelar"
  });

  if (!confirm.isConfirmed) return;

  // Vincular imei1 con imei2 para enviar
  const listaFinal = imei1List.map((imei1, idx) => ({
    imei1,
    imei2: imei2List[idx]?.trim() || null
  }));

  const res = await fetch(`/api/imeis/${idDetalle}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imeis: listaFinal })
  });

  if (res.ok) {
    modalRegistrarImeis.hide();
    Swal.fire("✅ Guardado", resumen || "IMEIs actualizados.", "success");
    actualizarContadorImeis(idDetalle);
  } else {
    const err = await res.json();
    mostrarAlertaIMEI(err.message || "Error al guardar IMEIs");
  }
});


function mostrarAlertaIMEI(msg) {
  const alerta = document.getElementById("alertImeiError");
  alerta.classList.remove("d-none");
  alerta.textContent = msg;
}

// ✅ Hacerla global para que funcione desde el HTML dinámico
let cantidadDetalle = 0; // Variable global

window.abrirModalImeis = async function (idDetalle, cantidad) {
  console.log("✅ ID recibido en abrirModalImeis:", idDetalle);
  console.log("📦 Cantidad recibida:", cantidad);
  cantidadDetalle = cantidad; // Guardamos la cantidad aquí
  document.getElementById("detalleCompraId").value = idDetalle;
  document.getElementById("textareaImei1").value = '';
  document.getElementById("textareaImei2").value = '';
  document.getElementById("alertImeiError").classList.add("d-none");
  // 🔽 Obtener IMEIs ya registrados
  try {
    const res = await fetch(`/api/imeis/${idDetalle}`);
    if (res.ok) {
      const data = await res.json();
      const imei1List = data.map(d => d.imei1).join("\n");
      const imei2List = data.map(d => d.imei2 || '').join("\n");
      document.getElementById("textareaImei1").value = imei1List;
      document.getElementById("textareaImei2").value = imei2List;
    }
  } catch (e) {
    console.warn("⚠️ No se pudieron cargar los IMEIs:", e);
  }
  modalRegistrarImeis.show();
};


document.addEventListener("click", function(e) {
  if (e.target.classList.contains("btnRegistrarImeis")) {
    const id = e.target.dataset.id;
    const cantidad = e.target.dataset.cantidad;
    abrirModalImeis(id, cantidad);
  }
});

function actualizarContadorImeis(idDetalle) {
  fetch(`/api/detalles_compra/${idDetalle}/cantidad`)
    .then(res => res.json())
    .then(data => {
      const badge = document.getElementById(`imeiStatus-${idDetalle}`);
      if (badge) {
        badge.textContent = `${data.imeis_registrados} de ${data.cantidad_total}`;
      }
    });
}

