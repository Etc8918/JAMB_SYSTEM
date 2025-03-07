import { apiFetch } from './api.js';

document.addEventListener("DOMContentLoaded", async () => {
    const fechaCompraInput = document.getElementById('fechaCompra');
    if (fechaCompraInput) {
        const today = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
        fechaCompraInput.value = today;
    }
    await loadCompras();
    await loadProveedores();
    await loadModelos();

    document.getElementById("addProveedorBtn").addEventListener("click", abrirModalProveedor);
    document.getElementById("addModeloBtn").addEventListener("click", abrirModalInventario);
    document.getElementById("proveedorForm").addEventListener("submit", guardarProveedor);
    document.getElementById("inventarioForm").addEventListener("submit", guardarInventario);
    document.getElementById('agregarDetalleBtn').addEventListener('click', agregarDetalle);



    // ✅ Configurar cambio en modelo para cargar capacidades
    document.getElementById("modeloDetalle").addEventListener("change", async (event) => {
        await loadCapacidades(event.target.value);
    });

    // ✅ Configurar cambio en capacidad para cargar colores
    document.getElementById("capacidadDetalle").addEventListener("change", async (event) => {
        const id_modelo = document.getElementById("modeloDetalle").value;
        await loadColores(id_modelo, event.target.value);
    });
});

// 🛒 Lista de detalles de compra
let detallesCompra = [];

// ✅ Agregar detalle a la tabla
function agregarDetalle() {
    const id_inventario = document.getElementById('modeloDetalle').value;
    const capacidad = document.getElementById('capacidadDetalle').value;
    const color = document.getElementById('colorDetalle').value;
    const cantidad = document.getElementById('cantidadDetalle').value;
    const costo = document.getElementById('costoDetalle').value;

    // ⚠️ Validación de campos
    if (!id_inventario || !capacidad || !color || !cantidad || !costo) {
        Swal.fire("⚠️ Atención", "Todos los campos son obligatorios.", "warning");
        return;
    }

    // Obtener información adicional de los selects
    const modeloOption = document.getElementById('modeloDetalle').selectedOptions[0].text;
    const [marca, modelo] = modeloOption.split(" - "); // ✅ Ahora obtenemos solo Marca y Modelo

    // Obtener el tipo desde la base de datos en `loadModelos()`
    const tipo = obtenerTipoPorId(id_inventario);

    // 🔹 Crear objeto detalle
    const detalle = {
        id: detallesCompra.length + 1,
        tipo: tipo, // ✅ Asegurarnos de que es CELULAR, TABLET o ACCESORIOS
        marca: marca.trim(),
        modelo: modelo.trim(),
        capacidad,
        color,
        cantidad: parseInt(cantidad, 10),
        costo: parseFloat(costo).toFixed(2),
    };

    // Agregar detalle a la lista y actualizar la tabla
    detallesCompra.push(detalle);
    actualizarTablaDetalles();

    // ✅ Limpiar los combobox y los campos de cantidad y costo después de agregar el detalle
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
        tableBody.innerHTML = '<tr><td colspan="8" class="text-center">No hay equipos agregados</td></tr>';
        return;
    }

    detallesCompra.forEach((detalle, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${detalle.tipo}</td>
            <td>${detalle.marca}</td>
            <td>${detalle.modelo}</td>
            <td>${detalle.capacidad}</td>
            <td>${detalle.color}</td>
            <td>${detalle.cantidad}</td>
            <td>$${detalle.costo}</td>
            <td>
                <button class="btn btn-sm btn-warning" onclick="editarCantidad(${index})">Editar</button>
                <button class="btn btn-sm btn-danger" onclick="eliminarDetalle(${index})">Eliminar</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
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


// ✅ Cargar compras en la tabla
async function loadCompras() {
    try {
        const compras = await apiFetch("compras");
        // Si no necesitas renderizar compras, solo realiza la solicitud sin llamar renderComprasTable()
        console.log("📥 Compras recibidas:", compras); // Para depuración
    } catch (error) {
        console.error("❌ Error al cargar compras:", error);
    }
}



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
        const modelos = await apiFetch("inventario");
        const select = document.getElementById("modeloDetalle");

        // Usar un Set para almacenar modelos únicos basados en marca + modelo
        const modelosUnicos = new Map();

        modelos.forEach(modelo => {
            const clave = `${modelo.marca} - ${modelo.modelo}`; // Clave única
            if (!modelosUnicos.has(clave)) {
                modelosUnicos.set(clave, modelo.id_inventario);
            }
        });

        // Limpiar el combobox antes de agregar nuevas opciones
        select.innerHTML = '<option value="">Seleccione un modelo</option>';

        // Agregar modelos únicos al select
        modelosUnicos.forEach((id_inventario, clave) => {
            const option = document.createElement("option");
            option.value = id_inventario;
            option.textContent = clave; // Solo Marca y Modelo
            select.appendChild(option);
        });

    } catch (error) {
        console.error("❌ Error al cargar modelos:", error);
    }
}






// ✅ Cargar capacidades basadas en modelo
async function loadCapacidades(id_modelo) {
    try {
        const capacidades = await apiFetch(`inventario/capacidades/${id_modelo}`);
        const select = document.getElementById("capacidadDetalle");

        select.innerHTML = '<option value="">Seleccione una capacidad</option>';
        capacidades.forEach(capacidad => {
            const option = document.createElement("option");
            option.value = capacidad.capacidad;
            option.textContent = capacidad.capacidad;
            select.appendChild(option);
        });
    } catch (error) {
        console.error("❌ Error al cargar capacidades:", error);
    }
}

// ✅ Cargar colores basados en modelo y capacidad
async function loadColores(id_modelo, capacidad) {
    try {
        const colores = await apiFetch(`inventario/colores/${id_modelo}/${capacidad}`);
        const select = document.getElementById("colorDetalle");

        select.innerHTML = '<option value="">Seleccione un color</option>';
        colores.forEach(color => {
            const option = document.createElement("option");
            option.value = color.color;
            option.textContent = color.color;
            select.appendChild(option);
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

    const inventarioData = { tipo, marca, modelo, capacidad, color, cantidad }; // 📌 Se envía cantidad

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

