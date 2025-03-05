import { apiFetch } from './api.js';

document.addEventListener('DOMContentLoaded', async () => {
    await loadClientes();

    // Evento para buscar clientes en tiempo real
    const searchInput = document.getElementById('searchCliente');
    if (searchInput) {
        searchInput.addEventListener('input', async (event) => {
            await loadClientes(event.target.value);
        });
    }

    // Evento para abrir el modal de agregar cliente
    const btnAgregar = document.getElementById('btnAgregarCliente');
    if (btnAgregar) {
        btnAgregar.addEventListener('click', abrirModalCliente);
    }

    // Evento para guardar cliente
    const form = document.getElementById('clienteForm');
    if (form) {
        form.addEventListener('submit', async function (event) {
            event.preventDefault();
            await guardarCliente();
        });
    }
});

// ✅ Cargar clientes y mostrarlos en la tabla
async function loadClientes(nombre = '') {
    try {
        const queryParam = nombre ? `?nombre=${encodeURIComponent(nombre)}` : '';
        const clientes = await apiFetch(`clientes${queryParam}`);
        renderClientesTable(clientes);
    } catch (error) {
        console.error("❌ Error al cargar clientes:", error);
        renderClientesTable([]); // Mostrar tabla vacía en caso de error
    }
}

// ✅ Renderizar la tabla de clientes
function renderClientesTable(clientes) {
    const table = document.getElementById('clientesTable');
    if (!table) {
        console.error("❌ Error: No se encontró la tabla de clientes en el DOM.");
        return;
    }

    table.innerHTML = '';

    if (clientes.length === 0) {
        table.innerHTML = `<tr><td colspan="3" class="text-center">No se encontraron clientes</td></tr>`;
        return;
    }

    clientes.forEach(cliente => {
        const row = table.insertRow();
        row.innerHTML = `
            <td>${cliente.nombre.toUpperCase()}</td>
            <td>${cliente.telefono}</td>
            <td>
                <button class="btn btn-warning btn-sm" onclick="editCliente(${cliente.id_cliente}, '${cliente.nombre}', '${cliente.telefono}')">Editar</button>
                <button class="btn btn-danger btn-sm" onclick="deleteCliente(${cliente.id_cliente})">Eliminar</button>
            </td>
        `;
    });
}

// ✅ Guardar Cliente (Crear o Actualizar)
async function guardarCliente() {
    const id_cliente = document.getElementById("clienteId").value.trim();
    const nombre = document.getElementById("nombreCliente").value.trim();
    const telefono = document.getElementById("telefonoCliente").value.trim();

    if (!nombre || !telefono) {
        Swal.fire("⚠️ Atención", "Todos los campos son obligatorios", "warning");
        return;
    }

    try {
        const metodo = id_cliente ? "PUT" : "POST";
        const endpoint = id_cliente ? `clientes/${id_cliente}` : "clientes";

        await apiFetch(endpoint, metodo, { nombre, telefono });

        Swal.fire("✅ Éxito", `Cliente ${id_cliente ? "actualizado" : "registrado"} correctamente`, "success");

        // 📌 Cerrar modal después de guardar correctamente
        const modalElement = document.getElementById('clienteModal');
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) modal.hide(); 

        document.getElementById("clienteForm").reset();
        loadClientes(); // Recargar la tabla
    } catch (error) {
        console.error("❌ Error al guardar cliente:", error);
        Swal.fire("❌ Error", error.message, "error");
    }
}


// ✅ Editar Cliente
window.editCliente = function(id, nombre, telefono) {
    document.getElementById('clienteId').value = id;
    document.getElementById('nombreCliente').value = nombre;
    document.getElementById('telefonoCliente').value = telefono;
    document.getElementById('guardarCliente').innerText = "Actualizar Cliente";

    const modal = new bootstrap.Modal(document.getElementById('clienteModal'));
    modal.show();
};

// ✅ Eliminar Cliente con validación de ventas asociadas
window.deleteCliente = async function(id_cliente) {
    const confirmDelete = await Swal.fire({
        title: "¿Estás seguro?",
        text: "No podrás recuperar este cliente",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar"
    });

    if (!confirmDelete.isConfirmed) return;

    try {
        await apiFetch(`clientes/${id_cliente}`, 'DELETE');
        Swal.fire("Eliminado", "Cliente eliminado correctamente", "success");
        loadClientes();
    } catch (error) {
        console.error("❌ Error al eliminar cliente:", error);
        
        // 📌 Mostrar alerta adecuada si tiene ventas asociadas
        if (error.message.includes("ventas registradas")) {
            Swal.fire("❌ No se puede eliminar", "El cliente tiene ventas registradas y no puede ser eliminado.", "error");
        } else {
            Swal.fire("Error", "No se pudo eliminar el cliente", "error");
        }
    }
};

// ✅ **Abrir modal de cliente**
window.abrirModalCliente = function() {
    const inputId = document.getElementById('clienteId');
    const inputNombre = document.getElementById('nombreCliente');
    const inputTelefono = document.getElementById('telefonoCliente');
    const btnGuardar = document.getElementById('guardarCliente');

    if (!inputId || !inputNombre || !inputTelefono || !btnGuardar) {
        console.error("❌ Error: No se encontraron elementos del formulario de clientes.");
        return;
    }

    inputId.value = "";
    inputNombre.value = "";
    inputTelefono.value = "";
    btnGuardar.innerText = "Guardar Cliente";

    const modal = new bootstrap.Modal(document.getElementById('clienteModal'));
    modal.show();
};
