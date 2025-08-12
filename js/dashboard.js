// ====================
// CONFIGURACIÓN INICIAL
// ====================

const SUPABASE_URL = 'https://nebwwmhqaupmfsgbules.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lYnd3bWhxYXVwbWZzZ2J1bGVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MDUzMjUsImV4cCI6MjA3MDA4MTMyNX0.wSufUYgkxjGZxlbpqonqbdlnN1nzWXZ-Sd5zgcZeMAc';

const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let estudianteIdEnEdicion = null;

// ====================
// GESTIÓN DE USUARIO
// ====================

// Verifica si el usuario está logueado, de lo contrario, lo redirige
async function verificarSesion() {
    const { data: { session } } = await client.auth.getSession();
    if (!session) {
        window.location.href = 'index.html';
    } else {
        listarEstudiantes();
        listarArchivos();
    }
}

// Cierra la sesión del usuario
async function cerrarSesion() {
    await client.auth.signOut();
    window.location.href = 'index.html';
}

// ====================
// GESTIÓN DE ESTUDIANTES
// ====================

// Obtiene la lista de estudiantes de Supabase
async function listarEstudiantes() {
    const { data, error } = await client.from('estudiantes').select('*');

    if (error) {
        console.error('Error al obtener estudiantes:', error.message);
        return;
    }

    const lista = document.getElementById('lista-estudiantes');
    lista.innerHTML = '';
    data.forEach(estudiante => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${estudiante.nombre} (${estudiante.clase})</span>
            <div class="list-actions">
                <button class="btn-edit" onclick="cargarEstudianteParaEdicion('${estudiante.id}')">Editar</button>
                <button class="btn-delete" onclick="eliminarEstudiante('${estudiante.id}')">Eliminar</button>
            </div>
        `;
        lista.appendChild(li);
    });
}

// Agrega un nuevo estudiante o edita uno existente
async function agregarEstudiante() {
    const nombre = document.getElementById('nombre').value;
    const correo = document.getElementById('correo').value;
    const clase = document.getElementById('clase').value;

    if (!nombre || !correo || !clase) {
        alert('Por favor, completa todos los campos.');
        return;
    }

    if (estudianteIdEnEdicion) {
        // Lógica para editar un estudiante existente
        const { error } = await client.from('estudiantes').update({ nombre, correo, clase }).eq('id', estudianteIdEnEdicion);

        if (error) {
            alert('Error al actualizar estudiante: ' + error.message);
        } else {
            alert('Estudiante actualizado con éxito.');
            estudianteIdEnEdicion = null;
            document.querySelector('.btn-primary').textContent = 'Agregar';
            limpiarCampos();
            // Llama a la función para recargar la lista
            listarEstudiantes(); 
        }
    } else {
        // Lógica para agregar un nuevo estudiante
        const { error } = await client.from('estudiantes').insert([{ nombre, correo, clase }]);

        if (error) {
            alert('Error al agregar estudiante: ' + error.message);
        } else {
            alert('Estudiante agregado con éxito.');
            limpiarCampos();
            listarEstudiantes();
        }
    }
}

// Carga los datos de un estudiante en el formulario para su edición
async function cargarEstudianteParaEdicion(id) {
    const { data, error } = await client.from('estudiantes').select('*').eq('id', id).single();

    if (error) {
        alert('Error al cargar estudiante: ' + error.message);
        return;
    }

    estudianteIdEnEdicion = id;
    document.getElementById('nombre').value = data.nombre;
    document.getElementById('correo').value = data.correo;
    document.getElementById('clase').value = data.clase;

    document.querySelector('.btn-primary').textContent = 'Guardar Cambios';
}

// Elimina un estudiante
async function eliminarEstudiante(id) {
    if (!confirm('¿Estás seguro de que quieres eliminar a este estudiante?')) {
        return;
    }

    const { error } = await client.from('estudiantes').delete().eq('id', id);

    if (error) {
        alert('Error al eliminar estudiante: ' + error.message);
    } else {
        alert('Estudiante eliminado con éxito.');
        listarEstudiantes();
    }
}

// Limpia los campos del formulario de estudiantes
function limpiarCampos() {
    document.getElementById('nombre').value = '';
    document.getElementById('correo').value = '';
    document.getElementById('clase').value = '';
    estudianteIdEnEdicion = null;
    document.querySelector('.btn-primary').textContent = 'Agregar';
}

// ====================
// GESTIÓN DE ARCHIVOS
// ====================

// Llena el selector de estudiantes para subir archivos
async function llenarSelectorEstudiantes() {
    const { data, error } = await client.from('estudiantes').select('*');

    if (error) {
        console.error('Error al obtener estudiantes:', error.message);
        return;
    }

    const selector = document.getElementById('estudiante');
    selector.innerHTML = '<option value="">Selecciona un estudiante</option>';
    data.forEach(estudiante => {
        const option = document.createElement('option');
        option.value = estudiante.id;
        option.textContent = estudiante.nombre;
        selector.appendChild(option);
    });
}

// Sube un archivo
async function subirArchivo() {
    const estudianteId = document.getElementById('estudiante').value;
    const archivo = document.getElementById('archivo').files[0];

    if (!estudianteId || !archivo) {
        alert('Por favor, selecciona un estudiante y un archivo.');
        return;
    }

    const { data, error } = await client.storage
        .from('tareas')
        .upload(`${estudianteId}/${archivo.name}`, archivo);

    if (error) {
        alert('Error al subir archivo: ' + error.message);
    } else {
        alert('Archivo subido con éxito.');
        listarArchivos();
    }
}

// Obtiene la lista de archivos de Supabase Storage
async function listarArchivos() {
    const { data: { session } } = await client.auth.getSession();
    const userId = session.user.id;

    const { data, error } = await client.storage
        .from('tareas')
        .list(userId, { limit: 100, offset: 0, sortBy: { column: 'name', order: 'asc' } });

    if (error) {
        console.error('Error al obtener archivos:', error.message);
        return;
    }

    const lista = document.getElementById('lista-archivos');
    lista.innerHTML = '';
    data.forEach(file => {
        const li = document.createElement('li');
        const fileUrl = `${SUPABASE_URL}/storage/v1/object/public/tareas/${userId}/${file.name}`;
        li.innerHTML = `
            <span><a href="${fileUrl}" target="_blank">${file.name}</a></span>
            <div class="list-actions">
                <button class="btn-delete" onclick="eliminarArchivo('${userId}/${file.name}')">Eliminar</button>
            </div>
        `;
        lista.appendChild(li);
    });
}

// Elimina un archivo
async function eliminarArchivo(filePath) {
    if (!confirm('¿Estás seguro de que quieres eliminar este archivo?')) {
        return;
    }

    const { error } = await client.storage.from('tareas').remove([filePath]);

    if (error) {
        alert('Error al eliminar archivo: ' + error.message);
    } else {
        alert('Archivo eliminado con éxito.');
        listarArchivos();
    }
}

// ====================
// INICIALIZACIÓN
// ====================

document.addEventListener('DOMContentLoaded', () => {
    verificarSesion();
    llenarSelectorEstudiantes();
});