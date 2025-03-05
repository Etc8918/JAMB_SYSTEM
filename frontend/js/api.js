export async function apiFetch(endpoint, method = 'GET', data = null) {
    const url = `http://localhost:3000/api/${endpoint}`;

    const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
    };

    if (data) options.body = JSON.stringify(data);

    const response = await fetch(url, options);

    if (!response.ok) {
        let errorMessage = "Error en la solicitud";
        try {
            const errorResponse = await response.json();
            errorMessage = errorResponse.message || errorMessage;
        } catch (e) {
            console.error("❌ Error al leer la respuesta del servidor:", e);
        }
        throw new Error(errorMessage);
    }

    return await response.json();
}
