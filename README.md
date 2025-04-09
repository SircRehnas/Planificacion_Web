# Planificacion_Web - Gestor de Tareas y Proyectos

[![Estado del proyecto](https://img.shields.io/badge/Estado-En%20Desarrollo-yellow)](https://shields.io/)
[![Licencia CC BY-NC-ND 4.0](https://img.shields.io/badge/Licencia-CC_BY--NC--ND_4.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc-nd/4.0/)

**Nota:** Este proyecto se encuentra actualmente en desarrollo y puede contener errores o funcionalidades incompletas.

Planificacion_Web es una aplicación web completa para la gestión de tareas personales y proyectos profesionales. Combina un tablero Kanban interactivo con un calendario de eventos e incluye página de planificación de proyectos.

## Características Principales

   ✅ Calendario integrado para planificación de sprints

   ✅ Drag & Drop para mover tareas entre columnas

   ✅ Personalización de tarjetas (colores, fechas, descripciones) 

   ✅ Exportar/Importar datos en JSON 

   ✅ Diseño moderno y responsive  

## 🚀 Cómo Usar

### Versión Básica (sin servidor)
1. Clona el repositorio:
```bash
git clone https://github.com/SircRehnas/planificacion_web.git
```
2. Abre `index.html` en tu navegador (no requiere servidor para la versión básica)


### Versión con Persistencia (opcional)

1. Configura un servidor local (XAMPP, WAMP, etc.)

2. Asegurate de que se incluye el archivo `save_data.php`

### 📌 Tablero Kanban
* Organiza tus tareas en columnas personalizables (Por hacer, En progreso, Completado)
* Arrastra y suelta tarjetas entre columnas
* Edición rápida de tareas con prioridades y etiquetas

### 📅 Calendario de Eventos
* Visualización mensual, semanal y diaria
* Creación, modificación y eliminación de eventos
* Recordatorios y notificaciones
* Sincronización con calendarios externos

### 📌 Gestión de Proyectos
* Vista editable para planificación de proyectos 
* Asignación y organización visual de tareas
* Listado de tareas
* Permite añadir nuevas secciones (grid, listado, bloques)

### 💾 Gestión de Datos
- **Exportación**: Descarga todos tus datos en formato `.json`
- **Importación**: Carga archivos `.json` para restaurar tu información
- **Almacenamiento local**: Los datos se guardan automáticamente en tu navegador
- **Copia de seguridad manual**: Opción para guardar/recuperar snapshots

## 🛠️ Tecnologías Utilizadas

* Frontend: HTML5, CSS3, JavaScript (Vanilla)
* Backend: PHP (opcional para persistencia de datos)
* Almacenamiento: LocalStorage/IndexedDB (o `.json` para versión con backend)
* Librerías:

## 📜 Licencia

Planificacion_Web © 2025 by ThianDev (GitHub: [SircRehnas](https://github.com/SircRehnas)) is licensed under [CC BY-NC-ND 4.0](https://creativecommons.org/licenses/by-nc-nd/4.0/?ref=chooser-v1)

[![CC BY-NC-ND 4.0](https://mirrors.creativecommons.org/presskit/icons/cc.svg?ref=chooser-v1)](https://creativecommons.org/licenses/by-nc-nd/4.0/?ref=chooser-v1)
[![CC BY-NC-ND 4.0](https://mirrors.creativecommons.org/presskit/icons/by.svg?ref=chooser-v1)](https://creativecommons.org/licenses/by-nc-nd/4.0/?ref=chooser-v1)
[![CC BY-NC-ND 4.0](https://mirrors.creativecommons.org/presskit/icons/nc.svg?ref=chooser-v1)](https://creativecommons.org/licenses/by-nc-nd/4.0/?ref=chooser-v1)
[![CC BY-NC-ND 4.0](https://mirrors.creativecommons.org/presskit/icons/nd.svg?ref=chooser-v1)](https://creativecommons.org/licenses/by-nc-nd/4.0/?ref=chooser-v1)

## 📜 Datos de atribución

* **Título de la obra:** Planificacion_Web
* **Nombre de desarrollador:** SircRehnas (ThianDev)
* **Enlace a la obra:** [https://github.com/SircRehnas/Planificacion_Web](https://github.com/SircRehnas/Planificacion_Web)
* **Enlace al GitHub del creador:** [SircRehnas](https://github.com/SircRehnas)
* **Año de creación:** 2025

## ❗Términos Adicionales
EL SOFTWARE SE PROPORCIONA "TAL CUAL", SIN GARANTÍA DE NINGÚN TIPO.
Queda prohibido:
1. Uso comercial sin permiso
2. Distribución de versiones modificadas
3. Omitir atribución al autor

## 👨💻 Desarrollador

ThianDev (GitHub: [SircRehnas](https://github.com/SircRehnas))

## 📅 Roadmap
- [x] Versión inicial
- [ ] Implementar autenticación
- [ ] Mejorar sistema de notificaciones
- [ ] Sincronización en la nube
- [ ] Diseño móvil

## ❓ FAQ
<details>
  <summary>🔽<b>¿Cómo exportar/importar datos?</b></summary>
  &nbsp;
  <ol>
    <li> Ve a <code>📤 Exportar</code> → Descarga un archivo formato JSON con:
      <ul>
        <li>Tareas del Kanban</li>
        <li>Eventos del calendario</li>
      </ul>
    </li>
    <li>Ve a <code>📤 Importar</code> → Selecciona el archivo formato JSON con toda tu información</li>
  </ol>
  <br>
</details>
<details>
  <summary>🔽<b>¿Dónde se guardan los datos?</b></summary>
  &nbsp;
  <ul>
    <li><b>Navegador</b>: <code>LocalStorage</code> (persistente hasta limpiar caché)</li>
    <li><b>Servidor</b>: <code>JSON</code></li>
  </ul>
  <br>
</details>
<details>
  <summary>🔽<b>¿Es seguro?</b></summary>
  &nbsp;
  <ul>
    <li><b>Si</b>:
      <ul>
        <li><code>Nunca se envían a terceros</code></li>
        <li><code>Puedes auto-hospedar el servidor</code></li> 
      </ul>
    </li>
  </ul>
  <br>
</details>

### 🔐 Recomendaciones:
1. Exporta backups periódicos
2. No compartas archivos .json
3. En el modo edición del planificador asegurate de guardar lo cambios presionando el boton "💾 Guardar"
