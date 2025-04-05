/**
 * Módulo de Interfaz de Usuario
 * Maneja la interacción visual y eventos
 */
const ui = {
    /**
     * Inicializa la interfaz de usuario
     */
    init() {
        this.addStyles();
        this.setupEventDelegation();
        this.setupTitleEditing();
        this.updateClock();
        setInterval(() => this.updateClock(), 1000);

        // Manejar selección de colores
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('color-option')) {
                // Remover selección previa
                document.querySelectorAll('.color-option').forEach(option => {
                    option.classList.remove('selected');
                });
                // Marcar como seleccionado
                e.target.classList.add('selected');
            }
        });
    },

    /**
     * Añade estilos CSS dinámicos
     */
    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .calendar-day.drag-over {
                background-color: rgba(67, 97, 238, 0.2);
                border: 2px dashed #4361ee;
            }
            
            .calendar-event {
                cursor: grab;
            }
            
            .calendar-event:active {
                cursor: grabbing;
            }
            
            .calendar-events-container {
                max-height: 70px;
                overflow-y: auto;
                margin-bottom: 5px;
            }
            
            .add-event-btn {
                position: sticky;
                bottom: 0;
                background: white;
                width: 100%;
                padding: 2px 0;
                font-size: 0.7em;
            }
        `;
        document.head.appendChild(style);
    },

    /**
     * Configura delegación de eventos para mejor rendimiento
     */
    setupEventDelegation() {
        // Delegación para botones de tareas y eventos
        document.addEventListener('click', (e) => {
            const taskCard = e.target.closest('.task-card');
            const calendarEvent = e.target.closest('.calendar-event');
            
            // Manejar botones de tareas
            if (taskCard) {
                this.handleTaskClick(e, taskCard);
                return;
            }
            
            // Manejar botones de eventos del calendario
            if (calendarEvent) {
                this.handleCalendarEventClick(e, calendarEvent);
                return;
            }
            
            // Manejar clic en el título del mes
            if (e.target.id === 'current-month') {
                calendar.handleMonthTitleClick();
            }
        });
        
        // Configurar drag and drop con delegación
        document.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('task-card')) {
                e.dataTransfer.setData('text/plain', e.target.dataset.id);
            } else if (e.target.classList.contains('calendar-event')) {
                e.dataTransfer.setData('text/plain', e.target.dataset.id);
                e.dataTransfer.setData('text/event-type', 'calendar-event');
            }
        });
    },

    /**
     * Maneja clics en elementos de tarea
     * @param {Event} e - Evento de clic
     * @param {HTMLElement} taskCard - Elemento de la tarea
     */
    handleTaskClick(e, taskCard) {
        const taskId = taskCard.dataset.id;
        
        if (e.target.classList.contains('complete-btn')) {
            kanban.completeTask(taskId);
            return;
        }
        
        if (e.target.classList.contains('edit-btn')) {
            this.editTask(taskId);
            return;
        }
        
        if (e.target.classList.contains('delete-btn')) {
            if (confirm('¿Eliminar esta tarea?')) {
                kanban.deleteTask(taskId);
            }
            return;
        }
    },

    /**
     * Maneja clics en elementos de evento del calendario
     * @param {Event} e - Evento de clic
     * @param {HTMLElement} calendarEvent - Elemento del evento
     */
    handleCalendarEventClick(e, calendarEvent) {
        const eventId = calendarEvent.dataset.id;
        
        if (e.target.classList.contains('edit-btn')) {
            app.editCalendarEvent(eventId);
            return;
        }
        
        if (e.target.classList.contains('delete-btn')) {
            app.deleteCalendarEvent(eventId);
            return;
        }
    },

    /**
     * Actualiza el reloj en la interfaz
     */
    updateClock() {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('es-ES', {hour12: false});
        const dateStr = now.toLocaleDateString('es-ES');
        document.getElementById('clock').textContent = `${timeStr}, ${dateStr}`;
    },

    /**
     * Configura la edición del título de la página
     */
    setupTitleEditing() {
        const h1 = document.querySelector('h1');
        h1.addEventListener('blur', function() {
            document.title = this.textContent;
        });
    },

    /**
     * Abre el modal para añadir/editar eventos
     * @param {string|null} eventId - ID del evento a editar o null para nuevo
     */
    openEventModal(eventId = null) {
        if (eventId) {
            const event = calendar.getEvent(eventId);
            if (event) {
                document.getElementById('modalTitle').textContent = 'Editar Evento';
                document.getElementById('eventName').value = event.name;
                document.getElementById('eventDate').value = event.date;
                document.getElementById('eventType').value = event.type;
                app.currentEventId = eventId;
            }
        } else {
            document.getElementById('modalTitle').textContent = 'Añadir Nuevo Evento';
            document.getElementById('eventName').value = '';
            document.getElementById('eventDate').value = '';
            document.getElementById('eventType').value = 'normal';
            app.currentEventId = null;
        }
        
        document.getElementById('eventModal').style.display = 'flex';
    },

    /**
     * Abre el modal para añadir tareas
     * @param {string} columnId - ID de la columna destino
     */
    openTaskModal(columnId) {
        document.getElementById('taskModalTitle').textContent = 'Añadir Nueva Tarea';
        document.getElementById('taskTitle').value = '';
        document.getElementById('taskDescription').value = '';
        document.getElementById('taskDueDate').value = '';
        document.getElementById('taskId').value = '';
        document.getElementById('taskColumn').value = columnId;
        
        // Resetear selector de color
        document.querySelectorAll('.color-option').forEach(option => {
            option.classList.remove('selected');
        });
        document.querySelector('.color-option[data-color="default"]').classList.add('selected');
        
        document.getElementById('taskModal').style.display = 'flex';
    },

    /**
     * Abre el modal para editar una tarea existente
     * @param {string} taskId - ID de la tarea a editar
     */
    editTask(taskId) {
        const task = kanban.getTask(taskId);
        if (!task) return;
        
        document.getElementById('taskModalTitle').textContent = 'Editar Tarea';
        document.getElementById('taskTitle').value = task.title;
        document.getElementById('taskDescription').value = task.description;
        document.getElementById('taskDueDate').value = task.date;
        document.getElementById('taskId').value = taskId;
        document.getElementById('taskColumn').value = task.column;
        
        // Establecer color actual
        document.querySelectorAll('.color-option').forEach(option => {
            option.classList.remove('selected');
            if (option.dataset.color === (task.color || 'default')) {
                option.classList.add('selected');
            }
        });
        
        document.getElementById('taskModal').style.display = 'flex';
    },

    /**
     * Cierra el modal de eventos
     */
    closeModal() {
        document.getElementById('eventModal').style.display = 'none';
    },

    /**
     * Cierra el modal de tareas
     */
    closeTaskModal() {
        document.getElementById('taskModal').style.display = 'none';
    },

    /**
     * Obtiene los datos del formulario de evento
     * @returns {object} Datos del evento
     */
    getEventFormData() {
        return {
            name: document.getElementById('eventName').value.trim(),
            date: document.getElementById('eventDate').value,
            type: document.getElementById('eventType').value
        };
    },

    /**
     * Obtiene los datos del formulario de tarea
     * @returns {object} Datos de la tarea
     */
    getTaskFormData() {
        // Obtener color seleccionado (default si no hay selección)
        const selectedColor = document.querySelector('.color-option.selected').dataset.color;
        
        return {
            title: document.getElementById('taskTitle').value.trim(),
            description: document.getElementById('taskDescription').value.trim(),
            date: document.getElementById('taskDueDate').value.trim(),
            column: document.getElementById('taskColumn').value,
            // Solo guardar color si no es el predeterminado
            color: selectedColor !== 'default' ? selectedColor : null
        };
    }
};

window.ui = ui;