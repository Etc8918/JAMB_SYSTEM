import { apiFetch } from './api.js';

document.addEventListener("DOMContentLoaded", async () => {
    const fechaCompraInput = document.getElementById('fechaCompra');
    if (fechaCompraInput) {
        const today = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
        fechaCompraInput.value = today;
    }
    await loadProveedores();
    await loadModelos();

    document.getElementById("addProveedorBtn").addEventListener("click", abrirModalProveedor);
    document.getElementById("addModeloBtn").addEventListener("click", abrirModalInventario);
    document.getElementById("proveedorForm").addEventListener("submit", guardarProveedor);
    document.getElementById("inventarioForm").addEventListener("submit", guardarInventario);
    document.getElementById('agregarDetalleBtn').addEventListener('click', agregarDetalle);

    // ✅ Configurar cambio en capacidad para cargar colores
    document.getElementById("capacidadDetalle").addEventListener("change", function () {
        const id_capacidad = this.value;
        const selectModelo = document.getElementById("modeloDetalle");
        const id_modelo = selectModelo.value;
        const selectedOption = selectModelo.options[selectModelo.selectedIndex];
        const id_tipo = selectedOption.getAttribute("data-id-tipo");
        const id_marca = selectedOption.getAttribute("data-id-marca");

        console.log("🟡 Enviando a loadColores:", id_modelo, id_capacidad, id_marca, id_tipo);
        loadColores(id_modelo, id_capacidad, id_tipo, id_marca);
    });

});

// 🛒 Lista de detalles de compra
let detallesCompra = [];

// ✅ Agregar detalle a la tabla
async function agregarDetalle() {
    const id_modelo = document.getElementById('modeloDetalle').value;
    const id_capacidad = document.getElementById('capacidadDetalle').value;
    const id_color = document.getElementById('colorDetalle').value;
    const cantidad = document.getElementById('cantidadDetalle').value;
    const costo = document.getElementById('costoDetalle').value;

    // ⚠️ Validación
    if (!id_modelo || !id_capacidad || !id_color || !cantidad || !costo) {
        Swal.fire("⚠️ Atención", "Todos los campos son obligatorios.", "warning");
        return;
    }

    // 🔎 Buscar id_tipo y id_marca desde el option del modelo
    const selectModelo = document.getElementById('modeloDetalle');
    const selectedOption = selectModelo.options[selectModelo.selectedIndex];
    const id_tipo = selectedOption.getAttribute("data-id-tipo");
    const id_marca = selectedOption.getAttribute("data-id-marca");

    // ✅ Hacer una petición al backend para obtener el id_inventario basado en combinación
    let id_inventario;
    try {
        const resultado = await apiFetch(`compras/id/${id_tipo}/${id_marca}/${id_modelo}/${id_capacidad}/${id_color}`);

        id_inventario = resultado.id_inventario;

        if (!id_inventario) {
            throw new Error("No se encontró el inventario.");
        }
    } catch (error) {
        console.error("❌ Error al obtener id_inventario:", error);
        Swal.fire("❌ Error", "No se pudo identificar el inventario en base a los datos seleccionados.", "error");
        return;
    }

    // ✅ Obtener textos para mostrar
    const capacidadTexto = document.getElementById("capacidadDetalle").selectedOptions[0].text;
    const colorTexto = document.getElementById("colorDetalle").selectedOptions[0].text;
    const [marcaTexto, modeloTexto] = selectedOption.text.split(" - ");
    const tipoTexto = obtenerTipoPorId(id_modelo); // Usa tu función auxiliar

    // ✅ Crear detalle
    const detalle = {
        id: detallesCompra.length + 1,
        id_inventario,
        tipo: tipoTexto,
        marca: marcaTexto.trim(),
        modelo: modeloTexto.trim(),
        id_capacidad,
        capacidad: capacidadTexto,
        id_color,
        color: colorTexto,
        cantidad: parseInt(cantidad),
        costo: parseFloat(costo).toFixed(2),
    };

    detallesCompra.push(detalle);
    actualizarTablaDetalles();

    // 🔄 Limpiar campos
    document.getElementById('modeloDetalle').value = "";
    document.getElementById('capacidadDetalle').innerHTML = '<option value="">Seleccione una capacidad</option>';
    document.getElementById('colorDetalle').innerHTML = '<option value="">Seleccione un color</option>';
    document.getElementById('cantidadDetalle').value = "";
    document.getElementById('costoDetalle').value = "";
}

function obtenerTipoPorId(id_inventario) {
    const modeloSeleccionado = modelosLista.find(m => m.id_inventario == id_inventario);
    return modeloSeleccionado ? modeloSeleccionado.tipo : "CELULAR"; // Si no encuentra, asigna CELULAR por defecto
}


// ✅ Actualizar la tabla con los detalles agregados
function actualizarTablaDetalles() {
    const tableBody = document.querySelector('#equiposAgregadosTable tbody');
    tableBody.innerHTML = '';

    if (detallesCompra.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="9" class="text-center">No hay equipos agregados</td></tr>';
        return;
    }

    let totalGeneral = 0;

    detallesCompra.forEach((detalle, index) => {
        const totalPorEquipo = detalle.cantidad * parseFloat(detalle.costo);
        totalGeneral += totalPorEquipo;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${detalle.tipo}</td>
            <td>${detalle.marca}</td>
            <td>${detalle.modelo}</td>
            <td>${detalle.capacidad}</td>
            <td>${detalle.color}</td>
            <td>${detalle.cantidad}</td>
            <td>$${detalle.costo}</td>
            <td>$${totalPorEquipo.toFixed(2)}</td>
            <td>
                <button class="btn btn-sm btn-warning" onclick="editarCantidad(${index})">Editar</button>
                <button class="btn btn-sm btn-danger" onclick="eliminarDetalle(${index})">Eliminar</button>
            </td>
        `;
        tableBody.appendChild(row);
    });

    // Agregar fila del total general
    const totalRow = document.createElement('tr');
    totalRow.innerHTML = `
        <td colspan="7" class="text-end fw-bold">Total General:</td>
        <td colspan="2" class="fw-bold text-success">$${totalGeneral.toFixed(2)}</td>
    `;
    tableBody.appendChild(totalRow);
}


// ✅ Eliminar un detalle agregado
window.eliminarDetalle = function (index) {
    detallesCompra.splice(index, 1);
    actualizarTablaDetalles();
}

// ✅ Editar la cantidad de un equipo agregado
window.editarCantidad = function (index) {
    Swal.fire({
        title: "Editar Cantidad",
        input: "number",
        inputValue: detallesCompra[index].cantidad,
        showCancelButton: true,
        confirmButtonText: "Actualizar",
        preConfirm: (newCantidad) => {
            if (!newCantidad || newCantidad <= 0) {
                Swal.showValidationMessage("La cantidad debe ser mayor a 0");
            }
            return newCantidad;
        }
    }).then((result) => {
        if (result.isConfirmed) {
            detallesCompra[index].cantidad = parseInt(result.value, 10);
            actualizarTablaDetalles();
        }
    });
};
// ✅ Cargar proveedores en el combobox
async function loadProveedores() {
    try {
        const proveedores = await apiFetch("proveedores");
        const select = document.getElementById("proveedorCompra");

        select.innerHTML = '<option value="">Seleccione un proveedor</option>';
        proveedores.forEach(proveedor => {
            const option = document.createElement("option");
            option.value = proveedor.id_proveedor;
            option.textContent = proveedor.nombre.toUpperCase();
            select.appendChild(option);
        });
    } catch (error) {
        console.error("❌ Error al cargar proveedores:", error);
    }
}

// ✅ Cargar modelos (Marca + Modelo)
// ✅ Guardamos los modelos en una lista global para acceder a ellos después
let modelosLista = [];

// ✅ Cargar modelos (Marca + Modelo) evitando duplicados
async function loadModelos() {
    try {
        const modelos = await apiFetch("compras/modelos");
        console.log("📦 Modelos cargados:", modelos);
        const select = document.getElementById("modeloDetalle");
        renderModelos(modelos);
        select.innerHTML = '<option value="">Seleccione un modelo</option>';

        modelos.forEach(modelo => {
            const option = document.createElement("option");
            option.value = modelo.id_modelo;
            option.textContent = `${modelo.nombre_marca} - ${modelo.nombre_modelo}`;
            option.setAttribute("data-id-marca", modelo.id_marca);
            option.setAttribute("data-id-tipo", modelo.id_tipo);
            select.appendChild(option);
        });


    } catch (error) {
        console.error("❌ Error al cargar modelos:", error);
    }
}

// ✅ Cargar capacidades basadas en modelo
async function loadCapacidades(id_tipo, id_marca, id_modelo) {

    try {
        console.log("🟡 Enviando id_modelo:", id_modelo, id_marca, id_modelo);
        const capacidades = await apiFetch(`compras/capacidades/${id_tipo}/${id_marca}/${id_modelo}`);
        const selectCapacidad = document.getElementById("capacidadDetalle");
        const selectColor = document.getElementById("colorDetalle");

        selectCapacidad.innerHTML = '<option value="">Seleccione una capacidad</option>';
        selectColor.innerHTML = '<option value="">Seleccione un color</option>'; // Limpia colores

        capacidades.forEach(cap => {
            const option = document.createElement("option");
            option.value = cap.id_capacidad;
            option.textContent = cap.capacidad;
            selectCapacidad.appendChild(option);
        });

        console.log("✅ Capacidades cargadas:", capacidades);
    } catch (error) {
        console.error("❌ Error al cargar capacidades:", error);
    }
}



// ✅ Cargar colores basados en modelo y capacidad
async function loadColores(id_modelo, id_capacidad, id_tipo, id_marca) {

    if (!id_tipo || !id_marca || !id_modelo || !id_capacidad) {
        console.error("❌ Error: Parámetros inválidos para cargar colores.", { id_modelo, id_capacidad, id_tipo, id_marca });
        return;
    }

    try {
        const colores = await apiFetch(`compras/colores/${id_tipo}/${id_marca}/${id_modelo}/${id_capacidad}`);
        const selectColor = document.getElementById("colorDetalle");

        selectColor.innerHTML = '<option value="">Seleccione un color</option>';
        colores.forEach(color => {
            console.log("🎨 Color cargado:", color);
            const option = document.createElement("option");
            option.value = color.id_color;  // ✅ Utiliza el ID del color
            option.textContent = color.nombre_color;
            selectColor.appendChild(option);
        });
    } catch (error) {
        console.error("❌ Error al cargar colores:", error);
    }
}



// ✅ Guardar proveedor en la BD
async function guardarProveedor(event) {
    event.preventDefault();

    const nombre = document.getElementById("providerName").value.trim().toUpperCase();
    const contacto = document.getElementById("providerContact").value.trim().toUpperCase();
    const telefono = document.getElementById("providerPhone").value.trim();
    const direccion = document.getElementById("providerDireccion").value.trim();

    if (!nombre || !contacto || !telefono) {
        Swal.fire("⚠️ Atención", "Todos los campos son obligatorios excepto dirección", "warning");
        return;
    }

    try {
        await apiFetch("proveedores", "POST", { nombre, contacto, telefono, direccion });

        Swal.fire("✅ Éxito", "Proveedor registrado correctamente", "success");
        await loadProveedores();
        bootstrap.Modal.getInstance(document.getElementById('proveedorModal')).hide();
        document.getElementById("proveedorForm").reset();
    } catch (error) {
        console.error("❌ Error al guardar proveedor:", error);
        Swal.fire("❌ Error", "No se pudo registrar el proveedor", "error");
    }
}

// ✅ Guardar equipo en la BD
async function guardarInventario(event) {
    event.preventDefault();

    // Capturar valores de los campos
    const tipo = document.getElementById("inventoryType").value.trim();
    const marca = document.getElementById("inventoryBrand").value.trim();
    const modelo = document.getElementById("inventoryModel").value.trim();
    const capacidad = document.getElementById("inventoryCapacity").value.trim();
    const color = document.getElementById("inventoryColor").value.trim();

    // 📌 Iniciar cantidad en 0
    const cantidad = 0;

    if (!tipo || !marca || !modelo || !capacidad || !color) {
        Swal.fire("⚠️ Atención", "Todos los campos son obligatorios.", "warning");
        return;
    }

    const inventarioData = { tipo, marca, modelo, capacidad, color, cantidad };

    try {
        console.log("📤 Enviando datos a la API:", inventarioData); // 🔍 Depuración

        await apiFetch(`inventario`, 'POST', inventarioData);
        Swal.fire("✅ Éxito", "Equipo registrado correctamente", "success");
        await loadModelos();
        // Limpiar formulario después de guardar
        document.getElementById("inventarioForm").reset();

        // Cerrar el modal después de guardar
        bootstrap.Modal.getInstance(document.getElementById('inventarioModal')).hide();

    } catch (error) {
        console.error("❌ Error al guardar equipo:", error);
        Swal.fire("❌ Error", error.message || "Error al registrar equipo.", "error");
    }
}




// ✅ Funciones para abrir modales
function abrirModalProveedor() {
    const modalElement = document.getElementById('proveedorModal');
    const modal = new bootstrap.Modal(modalElement);

    // Asegurar que `aria-hidden` se elimina al abrir el modal
    modalElement.removeAttribute("aria-hidden");

    modal.show();

    // Enfocar el primer campo dentro del modal para accesibilidad
    setTimeout(() => {
        document.getElementById('providerName')?.focus();
    }, 300);
}


function abrirModalInventario() {
    const modal = new bootstrap.Modal(document.getElementById("inventarioModal"));
    modal.show();
}

async function registrarCompra() {
    if (detallesCompra.length === 0) {
        Swal.fire("⚠️ Atención", "Debe agregar al menos un detalle a la compra.", "warning");
        return;
    }

    const fecha = document.getElementById("fechaCompra").value;
    const proveedor_id = document.getElementById("proveedorCompra").value;

    if (!proveedor_id) {
        Swal.fire("⚠️ Atención", "Debe seleccionar un proveedor.", "warning");
        return;
    }

    // 📤 Preparar los datos para enviar al backend
    const compraData = {
        fecha,
        proveedor_id,
        detalles: detallesCompra,
    };

    try {
        console.log("📤 Enviando compra:", JSON.stringify(compraData, null, 2)); // ✅ Depuración

        const response = await apiFetch("compras", "POST", compraData);
        console.log("📥 Respuesta de la API:", response);

        // ✅ Verificar que la API devolvió un id_compra válido
        if (!response || !response.id_compra) {
            throw new Error(response?.message || "Error al registrar compra en la base de datos.");
        }

        // ✅ Mostrar mensaje de éxito
        Swal.fire("✅ Éxito", `Compra registrada correctamente con ID: ${response.id_compra}`, "success");

        // 🧹 Limpiar la tabla y detalles agregados
        detallesCompra = [];
        actualizarTablaDetalles();

        // ❗ Mantener la fecha en el formulario
        const fechaActual = document.getElementById("fechaCompra").value;
        document.getElementById("compraForm").reset();
        document.getElementById("fechaCompra").value = fechaActual;

    } catch (error) {
        console.error("❌ Error al registrar compra:", error);
        Swal.fire("❌ Error", error.message || "No se pudo registrar la compra.", "error");
    }
}


// ✅ Agregar evento al botón de Registrar Compra
document.getElementById("registrarCompraBtn").addEventListener("click", (event) => {
    event.preventDefault(); // ✅ Evita el comportamiento por defecto
    registrarCompra(); // ✅ Llama a la función correctamente
});

const selectModelo = document.getElementById("modeloDetalle"); // ✅ Solo una vez

selectModelo.addEventListener("change", function () {
    const selectedOption = this.options[this.selectedIndex];

    const id_modelo = this.value;
    const id_tipo = selectedOption.getAttribute("data-id-tipo");
    const id_marca = selectedOption.getAttribute("data-id-marca");

    console.log("🟡 Enviando IDs a loadCapacidades:", id_tipo, id_marca, id_modelo);

    loadCapacidades(id_tipo, id_marca, id_modelo);
});



function renderModelos(modelos) {
    const select = document.getElementById("modeloDetalle");
    select.innerHTML = '<option value="">Seleccione un modelo</option>';

    modelos.forEach(m => {
        const option = document.createElement("option");
        option.value = m.id_modelo;
        option.textContent = `${m.nombre_marca} - ${m.nombre_modelo}`;
        option.setAttribute("data-id-tipo", m.id_tipo);
        option.setAttribute("data-id-marca", m.id_marca);
        select.appendChild(option);
    });
}

async function obtenerIdInventario(id_tipo, id_marca, id_modelo, id_capacidad, id_color) {
    try {
        const inventario = await apiFetch(`inventario/obtener-id/${id_tipo}/${id_marca}/${id_modelo}/${id_capacidad}/${id_color}`);
        return inventario.id_inventario;
    } catch (error) {
        console.error("❌ Error al obtener id_inventario:", error);
        return null;
    }
}
