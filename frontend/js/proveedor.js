import { apiFetch } from './api.js';

document.addEventListener('DOMContentLoaded', async () => {
    await loadProveedores();

    // Evento para buscar proveedores
    const searchInput = document.getElementById('searchProveedor');
    if (searchInput) {
        searchInput.addEventListener('input', async (event) => {
            await loadProveedores(event.target.value);
        });
    }

    // Evento para abrir el modal de agregar proveedor
    const btnAgregar = document.getElementById('btnAgregarProveedor');
    if (btnAgregar) {
        btnAgregar.addEventListener('click', abrirModalProveedor);
    }

    // Evento para guardar proveedor
    const form = document.getElementById('proveedorForm');
    if (form) {
        form.addEventListener('submit', async function (event) {
            event.preventDefault();
            await guardarProveedor();
        });
    }
});

// ✅ Cargar proveedores con opción de búsqueda
async function loadProveedores(nombre = '') {
    try {
        const queryParam = nombre ? `?nombre=${encodeURIComponent(nombre)}` : '';
        const proveedores = await apiFetch(`proveedores${queryParam}`);

        console.log("📥 Proveedores recibidos:", proveedores); // 🔍 Depuración

        renderProveedoresTable(proveedores);
    } catch (error) {
        console.error("❌ Error al cargar proveedores:", error);
    }
}

// ✅ Renderizar proveedores en la tabla
function renderProveedoresTable(proveedores) {
    const table = document.getElementById('proveedoresTable');

    if (!table) {
        console.error("❌ Error: Elemento con id 'proveedoresTable' no encontrado en el DOM.");
        return;
    }

    table.innerHTML = '';

    if (proveedores.length === 0) {
        table.innerHTML = `<tr><td colspan="5" class="text-center">No se encontraron proveedores</td></tr>`;
        return;
    }

    proveedores.forEach(proveedor => {
        const row = table.insertRow();
        row.innerHTML = `
            <td>${proveedor.nombre.toUpperCase()}</td>
            <td>${proveedor.contacto.toUpperCase()}</td>
            <td>${proveedor.telefono}</td>
            <td>${proveedor.direccion ? proveedor.direccion.toUpperCase() : 'SIN DIRECCIÓN'}</td>
            <td>
                <button class="btn btn-warning btn-sm" onclick="editProveedor(${proveedor.id_proveedor}, '${proveedor.nombre}', '${proveedor.contacto}', '${proveedor.telefono}', '${proveedor.direccion || ''}')">Editar</button>
                <button class="btn btn-danger btn-sm" onclick="deleteProveedor(${proveedor.id_proveedor})">Eliminar</button>
            </td>
        `;
    });
}

// ✅ Abrir modal para agregar un nuevo proveedor
function abrirModalProveedor() {
    document.getElementById('proveedorId').value = "";
    document.getElementById('nombreProveedor').value = "";
    document.getElementById('contactoProveedor').value = "";
    document.getElementById('telefonoProveedor').value = "";
    document.getElementById('direccionProveedor').value = "";
    document.getElementById('guardarProveedor').innerText = "Guardar Proveedor";

    const modal = new bootstrap.Modal(document.getElementById('proveedorModal'));
    modal.show();
}

// ✅ Editar proveedor (abre el modal con datos cargados)
window.editProveedor = function (id_proveedor, nombre, contacto, telefono, direccion) {
    document.getElementById('proveedorId').value = id_proveedor;
    document.getElementById('nombreProveedor').value = nombre;
    document.getElementById('contactoProveedor').value = contacto;
    document.getElementById('telefonoProveedor').value = telefono;
    document.getElementById('direccionProveedor').value = direccion;
    document.getElementById('guardarProveedor').innerText = "Actualizar Proveedor";

    const modal = new bootstrap.Modal(document.getElementById('proveedorModal'));
    modal.show();
};

// ✅ Guardar o actualizar proveedor
async function guardarProveedor() {
    const id_proveedor = document.getElementById('proveedorId').value;
    const nombre = document.getElementById('nombreProveedor').value.trim().toUpperCase();
    const contacto = document.getElementById('contactoProveedor').value.trim().toUpperCase();
    const telefono = document.getElementById('telefonoProveedor').value.trim();
    const direccion = document.getElementById('direccionProveedor').value.trim().toUpperCase();

    if (!nombre || !contacto || !telefono) {
        Swal.fire("Error", "Todos los campos son obligatorios excepto dirección.", "error");
        return;
    }

    const proveedorData = { nombre, contacto, telefono, direccion };

    try {
        await apiFetch(`proveedores/${id_proveedor ? id_proveedor : ''}`, id_proveedor ? 'PUT' : 'POST', proveedorData);
        Swal.fire("Éxito", `Proveedor ${id_proveedor ? 'actualizado' : 'registrado'} correctamente`, "success");

        document.getElementById('proveedorForm').reset();
        document.getElementById('guardarProveedor').innerText = "Guardar Proveedor";
        loadProveedores();

        // ✅ Cerrar el modal después de guardar
        bootstrap.Modal.getInstance(document.getElementById('proveedorModal')).hide();
    } catch (error) {
        Swal.fire("Error", "No se pudo guardar el proveedor.", "error");
    }
}

// ✅ Eliminar proveedor con confirmación y validación de compras asociadas
window.deleteProveedor = async function (id_proveedor) {
    const confirmDelete = await Swal.fire({
        title: "¿Estás seguro?",
        text: "No podrás recuperar este proveedor",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar"
    });

    if (!confirmDelete.isConfirmed) return;

    try {
        await apiFetch(`proveedores/${id_proveedor}`, 'DELETE');
        Swal.fire("Eliminado", "Proveedor eliminado correctamente", "success");
        loadProveedores();
    } catch (error) {
        Swal.fire("Error", error.message || "No se pudo eliminar el proveedor. Puede tener compras asociadas.", "error");
    }
};
