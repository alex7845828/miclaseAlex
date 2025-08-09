// Este es el código JavaScript para el panel de control.
// Utiliza la librería de Supabase para manejar la autenticación, la base de datos y el almacenamiento.

// ====================
// CONFIGURACIÓN INICIAL
// ====================

const SUPABASE_URL = "https://nebwwmhqaupmfsgbules.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lYnd3bWhxYXVwbWZzZ2J1bGVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MDUzMjUsImV4cCI6MjA3MDA4MTMyNX0.wSufUYgkxjGZxlbpqonqbdlnN1nzWXZ-Sd5zgcZeMAc";
const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', () => {
    cargarEstudiantes();
    listarArchivos();
});

// ====================
// FUNCIONES DE ESTUDIANTES
// ====================

async function agregarEstudiante() {
    const nombre = document.getElementById("nombre").value;
    const correo = document.getElementById("correo").value;
    const clase = document.getElementById("clase").value;

    if (!nombre || !correo || !clase) {
        alert("Por favor, completa todos los campos.");
        return;
    }

    try {
        const { data: { user } } = await client.auth.getUser();

        if (!user) {
            alert("No estás autenticado.");
            return;
        }

        const { error } = await client.from("estudiantes").insert({
            nombre,
            correo,
            clase,
            user_id: user.id,
        });

        if (error) throw error;

        alert("Estudiante agregado correctamente.");
        cargarEstudiantes();
    } catch (error) {
        alert("Error al agregar estudiante: " + error.message);
    }
}

async function cargarEstudiantes() {
    try {
        const { data, error } = await client
            .from("estudiantes")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw error;

        const lista = document.getElementById("lista-estudiantes");
        lista.innerHTML = "";
        
        if (data.length === 0) {
            lista.innerHTML = "<li>No hay estudiantes registrados.</li>";
            return;
        }
        
        data.forEach((est) => {
            const item = document.createElement("li");
            item.textContent = `${est.nombre} (${est.clase})`;
            lista.appendChild(item);
        });
    } catch (error) {
        alert("Error al cargar estudiantes: " + error.message);
    }
}

// ====================
// FUNCIONES DE ARCHIVOS
// ====================

async function subirArchivo() {
    const archivoInput = document.getElementById("archivo");
    const archivo = archivoInput.files[0];

    if (!archivo) {
        alert("Selecciona un archivo primero.");
        return;
    }

    try {
        const { data: { user } } = await client.auth.getUser();

        if (!user) {
            alert("Sesión no válida.");
            return;
        }

        const nombreRuta = `${user.id}/${archivo.name}`;
        const { error } = await client.storage
            .from("tareas")
            .upload(nombreRuta, archivo, {
                cacheControl: "3600",
                upsert: false,
            });

        if (error) throw error;

        alert("Archivo subido correctamente.");
        listarArchivos();
    } catch (error) {
        alert("Error al subir archivo: " + error.message);
    }
}

async function listarArchivos() {
    const lista = document.getElementById("lista-archivos");
    lista.innerHTML = "";
    
    try {
        const { data: { user } } = await client.auth.getUser();

        if (!user) {
            lista.innerHTML = "<li>Sesión no válida.</li>";
            return;
        }

        const { data, error } = await client.storage
            .from("tareas")
            .list(user.id, { limit: 20 });
        
        if (error) throw error;
        
        if (data.length === 0) {
            lista.innerHTML = "<li>No hay archivos subidos.</li>";
            return;
        }

        data.forEach(async (archivo) => {
            const item = document.createElement("li");
            
            try {
                const { data: signedUrlData, error: signedUrlError } = await client.storage
                    .from("tareas")
                    .createSignedUrl(`${user.id}/${archivo.name}`, 60);

                if (signedUrlError) throw signedUrlError;
                
                const publicUrl = signedUrlData.signedUrl;
                const esImagen = archivo.name.match(/\.(jpg|jpeg|png|gif)$/i);
                const esPDF = archivo.name.match(/\.pdf$/i);
                
                if (esImagen) {
                    item.innerHTML = `<strong>${archivo.name}</strong><br><a href="${publicUrl}" target="_blank"><img src="${publicUrl}" width="150" style="border:1px solid #ccc; margin:5px;" /></a>`;
                } else if (esPDF) {
                    item.innerHTML = `<strong>${archivo.name}</strong><br><a href="${publicUrl}" target="_blank">Ver PDF</a>`;
                } else {
                    item.innerHTML = `<a href="${publicUrl}" target="_blank">${archivo.name}</a>`;
                }
            } catch (error) {
                item.innerHTML = `<strong>${archivo.name}</strong><br><span>Error al generar enlace</span>`;
                console.error("Error al generar URL firmada:", error.message);
            }
            
            lista.appendChild(item);
        });
    } catch (error) {
        lista.innerHTML = `<li>Error al listar archivos: ${error.message}</li>`;
    }
}

// ====================
// FUNCIÓN DE AUTENTICACIÓN
// ====================

async function cerrarSesion() {
    try {
        const { error } = await client.auth.signOut();

        if (error) throw error;

        localStorage.removeItem("token");
        alert("Sesión cerrada correctamente continue.");
        window.location.href = "index.html";
    } catch (error) {
        alert("Error al cerrar sesión: " + error.message);
    }
}