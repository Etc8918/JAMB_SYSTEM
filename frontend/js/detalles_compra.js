


function formatearFecha(fechaISO) {
  const fecha = new Date(fechaISO);
  const dia = String(fecha.getDate()).padStart(2, '0');
  const mes = String(fecha.getMonth() + 1).padStart(2, '0'); // +1 porque enero = 0
  const anio = fecha.getFullYear();
  return `${dia}-${mes}-${anio}`;
}
let modalEditarCosto; // Instancia de Bootstrap Modal
let modalEditarCostoElement;

document.addEventListener('DOMContentLoaded', function () {
  // Referencia al elemento del modal
  modalEditarCostoElement = document.getElementById('modalEditarCosto');

  if (modalEditarCostoElement) {
    // 1) Instancia el modal
    modalEditarCosto = new bootstrap.Modal(modalEditarCostoElement, {
      backdrop: 'static', // evita cerrar al click fuera
      keyboard: false     // evita cerrar con Escape
    });
    // ⤷ Justo tras new bootstrap.Modal(...)
    modalEditarCostoElement.addEventListener('hidden.bs.modal', () => {
      // Quita cualquier backdrop sobrante
      document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
      // Restaura scroll y padding del body
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    });

  } else {
    console.error("❌ No se encontró el elemento #modalEditarCosto");
  }

  const formEditarCosto = document.getElementById('formEditarCosto');
  const idDetalleEditar = document.getElementById('idDetalleEditar');
  const nuevoCostoInput = document.getElementById('nuevoCostoInput');
  const alertContainer = document.getElementById('alertContainer');

function recalcSaldoProveedor(idProveedor) {
  const filaProv = document.querySelector(`tr[data-proveedor-id="${idProveedor}"]`);
  if (!filaProv) return;
  const filaCompras = filaProv.nextElementSibling;            // la fila que contiene la tabla de compras
  if (!filaCompras) return;
  const tabla = filaCompras.querySelector('table.table-bordered');
  if (!tabla) return;

  let totalPendiente = 0;
  tabla.querySelectorAll('tbody tr[data-id-compra]').forEach(fila => {
    const txt = fila.querySelector('td.saldoPendiente')?.textContent || '0';
    totalPendiente += parseFloat(txt);
  });

  filaProv.querySelector('td:nth-child(2)').textContent = totalPendiente.toFixed(2);
}



  // 3) Handler de submit
  formEditarCosto.addEventListener("submit", async function (e) {
    e.preventDefault();
    const idDetalle = document.getElementById('idDetalleEditar').value;
    const idCompra = document.getElementById('idCompraEditar').value;
    const nuevoCosto = parseFloat(document.getElementById('nuevoCostoInput').value);
    const idProv = document.getElementById('idProveedorEditar').value;
    const btnEditar = document.querySelector(`.btnEditarCosto[data-id-detalle="${idDetalle}"]`);
    const oldCost = parseFloat(btnEditar.dataset.costo);
    // Aquí ya tenemos la cantidad sin buscar filas en el DOM
    const cantidad = parseFloat(btnEditar.dataset.cantidad) || 0;

    if (!nuevoCosto || isNaN(nuevoCosto) || nuevoCosto <= 0) {
      mostrarAlerta('Por favor, ingresa un costo válido.', 'warning');
      return;
    }
    const s = await Swal.fire({
      title: '¿Confirmar nuevo costo?',
      text: `Estás por establecer el costo en S/. ${nuevoCosto.toFixed(2)}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, actualizar',
      cancelButtonText: 'Cancelar'
    });
    if (!s.isConfirmed) return;
    try {
      // 1) Actualiza en backend
      const res = await fetch(`/api/detalles-compra/${idDetalle}/costo`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ costo: nuevoCosto })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error desconocido');

      // 2) Refleja el nuevo costo en la tabla de detalles
      document.querySelectorAll(`[data-id-detalle="${idDetalle}"] td`)
        .forEach((td, i) => i === 6 && (td.textContent = nuevoCosto.toFixed(2)));
      document.querySelectorAll(`tr[data-id-detalle-expandido="${idDetalle}"] td`)
        .forEach((td, i) => i === 6 && (td.textContent = nuevoCosto.toFixed(2)));
      document.querySelectorAll(`.btnEditarCosto[data-id-detalle="${idDetalle}"]`)
        .forEach(btn => btn.setAttribute('data-costo', nuevoCosto.toFixed(2)));

      // 3) Quita el focus del botón de cerrar para no romper aria-hidden
      document.querySelector('#modalEditarCosto .btn-close')?.blur();
      // 4) Cierra el modal y muestra la alerta de éxito



      // 4) Quitamos foco del btn-close para evitar warning de aria-hidden
      document.querySelector('#modalEditarCosto .btn-close')?.blur();
      // 5) Cerramos el modal
      nuevoCostoInput.blur();
      modalEditarCosto.hide();
      // 6) Mostramos alerta de éxito
      await Swal.fire({
        icon: 'success',
        title: '✅ Costo actualizado correctamente',
        timer: 1500,
        showConfirmButton: false
      });

      // 7.1) Actualiza la fila de la compra
      actualizarCostoTotalYSaldo(idCompra);
      // 7.2) Recalcula el saldo TOTAL del proveedor
      recalcSaldoProveedor(idProv);








    } catch (error) {
      console.error('Error al actualizar el costo:', error);
      mostrarAlerta('Error al actualizar el costo.', 'danger');
    }



  }
  );


  // ——— Mantén el resto (modalEnUso, abrirModalEditarCosto, cargarProveedores…)
  let modalEnUso = false;
  window.abrirModalEditarCosto = function (id, costoActual) {
    if (modalEnUso) return;
    modalEnUso = true;
    document.getElementById('idDetalleEditar').value = id;
    document.getElementById('nuevoCostoInput').value = costoActual;
    modalEditarCosto.show();
    setTimeout(() => { modalEnUso = false; }, 500);
  };

  // Carga inicial
  cargarProveedoresConSaldoPendiente();


});

// Función para mostrar mensajes al usuario
function mostrarAlerta(mensaje, tipo) {
  Swal.fire({
    icon: tipo === 'warning' ? 'warning' : 'error',
    title: mensaje,
    timer: 1500,
    showConfirmButton: false
  });
}

// Reasignar evento global para cualquier botón "Editar Costo"
// ———  Reasignar evento click a cualquier botón .btnEditarCosto
document.addEventListener('click', function (e) {
  const btn = e.target.closest('.btnEditarCosto');
  if (!btn) return;

  // 1) Extraemos idDetalle, idCompra, idProveedor y costoActual
  const idDetalle = btn.dataset.idDetalle;
  const idCompra = btn.dataset.idCompra;
  const costoActual = btn.dataset.costo;
 const purchaseTable = btn.closest('table.table-bordered');
  const filaCompras   = purchaseTable.closest('tr.fila-compras');
  const filaProv      = filaCompras.previousElementSibling;
  const idProveedor   = filaProv.dataset.proveedorId;

  // 2) Volcamos en los hidden + en el campo de costo
  idDetalleEditar.value = idDetalle;
  idCompraEditar.value = idCompra;
  idProveedorEditar.value = idProveedor;
  nuevoCostoInput.value = costoActual;

  // 3) Abrimos modal
  modalEditarCosto.show();
});





// Función para cargar los proveedores con saldo pendiente
function cargarProveedoresConSaldoPendiente() {
  // 🔽 Referencia local al <tbody> de tu tabla
  const tablaProveedores = document.querySelector('#tablaProveedores tbody');

  fetch('http://localhost:3000/api/proveedores/con_saldo_pendiente')
    .then(response => response.json())
    .then(data => {
      // 1) Limpia cualquier fila anterior
      tablaProveedores.innerHTML = '';

      // 2) Pinta cada proveedor
      data.forEach(proveedor => {
        // — Fila principal
        const filaProveedor = document.createElement('tr');
        filaProveedor.classList.add('cursor-pointer');
        filaProveedor.dataset.proveedorId = proveedor.id_proveedor;
        filaProveedor.innerHTML = `
          <td>${proveedor.proveedor_nombre}</td>
          <td>${proveedor.saldo_pendiente_total}</td>
          <td>
            <button class="btn btn-sm btn-primary btnToggleCompras">
              Ver Compras
            </button>
          </td>
        `;
        tablaProveedores.appendChild(filaProveedor);

        // — Fila ocultable de compras
        const filaCompras = document.createElement('tr');
        filaCompras.classList.add('fila-compras');
        filaCompras.style.display = 'none';
        const celdaCompras = document.createElement('td');
        celdaCompras.colSpan = 3;
        filaCompras.appendChild(celdaCompras);
        tablaProveedores.appendChild(filaCompras);

        // — Event listener para expandir/colapsar
        filaProveedor.querySelector('.btnToggleCompras').addEventListener('click', function () {
          if (filaCompras.style.display === 'none') {
            filaCompras.style.display = '';
            this.textContent = 'Ocultar Compras';
            celdaCompras.innerHTML = `
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Cargando...</span>
              </div>
            `;
            cargarComprasPorProveedor(proveedor.id_proveedor, celdaCompras);
          } else {
            filaCompras.style.display = 'none';
            this.textContent = 'Ver Compras';
            celdaCompras.innerHTML = '';
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
    filaCompra.dataset.idCompra = compra.id_compra;  // ✅ Importante para que actualizarCostoTotalYSaldo funcione
    filaCompra.innerHTML = `
        <td>${formatearFecha(compra.fecha)}</td>
        <td class="costoTotal">${parseFloat(compra.costo_total).toFixed(2)}</td> <!-- ✅ Clase necesaria -->
        <td class="saldoPendiente">${parseFloat(compra.saldo_pendiente).toFixed(2)}</td> <!-- ✅ Clase necesaria -->
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
        filaDetalle.dataset.idCompra = compra.id_compra;
        filaDetalle.dataset.idDetalle = detalle.id_detalle;
        filaDetalle.setAttribute('data-id-detalle-expandido', detalle.id_detalle);
        filaDetalle.innerHTML = `
              <td>${detalle.tipo}</td>
              <td>${detalle.marca}</td>
              <td>${detalle.modelo}</td>
              <td>${detalle.capacidad}</td>
              <td>${detalle.color}</td>
              <td>${detalle.cantidad}</td>
              <td>${detalle.costo}</td>
              <td>
                <button class="btn btn-sm btn-warning btnEditarCosto"
         data-id-compra="${compra.id_compra}"
      data-id-detalle="${detalle.id_detalle}"
      data-cantidad="${detalle.cantidad}"
      data-costo="${detalle.costo}">
   Editar Costo
 </button>

              </td>

              
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
                    <tr data-id-detalle="${det.id_detalle}" 
                    data-id-detalle-expandido="${det.id_detalle}">
                      <td>${det.tipo}</td>
                      <td>${det.marca}</td>
                      <td>${det.modelo}</td>
                      <td>${det.capacidad}</td>
                      <td>${det.color}</td>
                      <td>${det.cantidad}</td> 
                      <td>${det.costo}</td>
                      
                      <td>
                    <span id="imeiStatus-${det.id_detalle}" class="badge bg-secondary mb-1">
                      ${det.imeis_registrados || 0} de ${det.cantidad}
                    </span><br>

                    <button class="btn btn-sm btn-outline-primary btnRegistrarImeis"
                            data-id="${det.id_detalle}" 
                            data-cantidad="${det.cantidad}">
                      Registrar IMEIs
                    </button>

 <button class="btn btn-sm btn-warning btnEditarCosto"
         data-id-compra="${compra.id_compra}"
      data-id-detalle="${det.id_detalle}"
      data-cantidad="${det.cantidad}"
      data-costo="${det.costo}">
   Editar Costo
 </button>
                  </td>

                    </tr>
                      `).join('')}
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
}



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


document.addEventListener("click", function (e) {
  if (e.target.classList.contains("btnRegistrarImeis")) {
    const id = e.target.dataset.id;
    const cantidad = e.target.dataset.cantidad;
    abrirModalImeis(id, cantidad);
  }
});

function actualizarContadorImeis(idDetalle) {
  fetch(`/api/detalles-compra/${idDetalle}/cantidad`)
    .then(res => res.json())
    .then(data => {
      const badge = document.getElementById(`imeiStatus-${idDetalle}`);
      if (badge) {
        badge.textContent = `${data.imeis_registrados} de ${data.cantidad_total}`;
      }
    });
}

function actualizarCostoTotalYSaldo(idCompra) {
  // 1) Localiza la fila de la compra
  const filaCompra = document.querySelector(`tr[data-id-compra="${idCompra}"]`);
  if (!filaCompra) return;
  // 2) Toma la siguiente fila (la de detalles)
  const filaDetalles = filaCompra.nextElementSibling;
  if (!filaDetalles) return;
  const tabla = filaDetalles.querySelector('table');
  if (!tabla) return;

  // 3) Recorre sólo las filas con al menos 7 <td>
  let total = 0;
  tabla.querySelectorAll('tbody tr').forEach(r => {
    const cols = r.querySelectorAll('td');
    if (cols.length < 7) return;         // <-- SALTA filas “Error …” u otras
    const cantidad = parseFloat(cols[5].textContent.trim()) || 0;
    const costo = parseFloat(cols[6].textContent.trim()) || 0;
    total += cantidad * costo;
  });

  // 4) Pinta los resultados
  filaCompra.querySelector('td.costoTotal').textContent = total.toFixed(2);
  filaCompra.querySelector('td.saldoPendiente').textContent = total.toFixed(2);
}

/**
 * Recalcula el saldo pendiente total del proveedor y lo pinta
 * en su fila principal. NO cierra ni toca el desglose de detalles.
 */
function recalcSaldoProveedor(idProveedor) {
  const filaProv = document.querySelector(`tr[data-proveedor-id="${idProveedor}"]`);
  if (!filaProv) return;
  const filaCompras = filaProv.nextElementSibling;           // la fila oculta de compras
  if (!filaCompras) return;
  const tabla = filaCompras.querySelector('table.table-bordered');
  if (!tabla) return;

  let totalPendiente = 0;
  tabla.querySelectorAll('tbody tr[data-id-compra]').forEach(tr => {
    const txt = tr.querySelector('td.saldoPendiente')?.textContent;
    if (txt) totalPendiente += parseFloat(txt);
  });

  // Pinta en la segunda celda de la fila del proveedor
  filaProv.querySelector('td:nth-child(2)').textContent = totalPendiente.toFixed(2);
}
