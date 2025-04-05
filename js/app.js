/**
 * Módulo principal de la aplicación
 * Coordina los diferentes componentes
 */
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Inicializar componentes
        storage.init();
        kanban.init();
        calendar.init();
        ui.init();
        
        // Cargar datos iniciales
        const data = storage.loadData() || storage.getDefaultData();
        kanban.tasks = data.tasks;
        calendar.events = data.events;
        
        // Renderizar componentes
        calendar.render(calendar.currentMonth, calendar.currentYear);
        kanban.render();
        
        // Configurar importación de JSON
        document.getElementById('jsonFileInput').addEventListener('change', (e) => {
            try {
                app.importData(e);
            } catch (error) {
                utils.NotificationSystem.show(`Error al importar: ${error.message}`, 'error');
                console.error('Import error:', error);
            }
        });
        
        // Mostrar última hora de guardado
        app.updateLastSavedTime();
        
        utils.NotificationSystem.show('Aplicación cargada correctamente', 'success');
    } catch (error) {
        utils.NotificationSystem.show(`Error al iniciar: ${error.message}`, 'error');
        console.error('Initialization error:', error);
    }
});

const app = {
    currentEventId: null,
    currentTaskId: null,
    lastSavedTime: null,

    /**
     * Abre el modal para editar/añadir eventos
     * @param {string|null} eventId - ID del evento o null para nuevo
     */
    openEventModal(eventId = null) {
        ui.openEventModal(eventId);
    },

    /**
     * Abre el modal para añadir tareas a una columna
     * @param {string} columnId - ID de la columna destino
     */
    openTaskModal(columnId) {
        ui.openTaskModal(columnId);
    },

    /**
     * Prepara el modal para añadir evento a un día específico
     * @param {string} dateStr - Fecha en formato YYYY-MM-DD
     */
    addEventToDay(dateStr) {
        this.currentEventId = null;
        document.getElementById('eventName').value = '';
        document.getElementById('eventDate').value = dateStr;
        document.getElementById('eventType').value = 'normal';
        document.getElementById('eventModal').style.display = 'flex';
    },

    /**
     * Prepara el modal para editar un evento existente
     * @param {string} eventId - ID del evento
     */
    editCalendarEvent(eventId) {
        this.currentEventId = eventId;
        const event = calendar.getEvent(eventId);
        
        if (event) {
            document.getElementById('eventName').value = event.name;
            document.getElementById('eventDate').value = event.date;
            document.getElementById('eventType').value = event.type;
            document.getElementById('eventModal').style.display = 'flex';
        }
    },

    /**
     * Elimina un evento del calendario con confirmación
     * @param {string} eventId - ID del evento
     */
    deleteCalendarEvent(eventId) {
        if (confirm('¿Eliminar este evento y su tarea asociada?')) {
            calendar.deleteEvent(eventId);
            storage.saveData({
                tasks: kanban.tasks,
                events: calendar.events
            });
        }
    },

    /**
     * Guarda un evento (nuevo o existente)
     */
    saveEvent() {
        try {
            const eventData = ui.getEventFormData();
            
            // Validación
            if (!eventData.name || !eventData.date) {
                throw new Error('Complete todos los campos');
            }
            
            if (this.currentEventId) {
                calendar.updateEvent(this.currentEventId, eventData);
            } else {
                calendar.addEvent(eventData);
            }
            
            storage.saveData({
                tasks: kanban.tasks,
                events: calendar.events
            });
            
            ui.closeModal();
        } catch (error) {
            utils.NotificationSystem.show(error.message, 'error');
        }
    },

    /**
     * Guarda una tarea (nueva o existente)
     */
    saveTask() {
        try {
            const taskData = ui.getTaskFormData();
            
            // Validación
            if (!taskData.title) {
                throw new Error('Ingrese un título');
            }
            
            const taskId = document.getElementById('taskId').value;
            if (taskId) {
                // Actualizar tarea existente
                kanban.updateTask(taskId, taskData);
            } else {
                // Crear nueva tarea
                kanban.addTask(taskData);
                
                // Crear evento asociado si tiene fecha válida
                if (taskData.date && utils.parseTaskDate(taskData.date)) {
                    calendar.addEvent({
                        name: taskData.title,
                        date: utils.parseTaskDate(taskData.date),
                        type: 'normal',
                        inKanban: true
                    });
                }
            }
            
            storage.saveData({
                tasks: kanban.tasks,
                events: calendar.events
            });
            
            ui.closeTaskModal();
        } catch (error) {
            utils.NotificationSystem.show(error.message, 'error');
        }
    },

    /**
     * Restablece la aplicación a valores por defecto
     */
    resetToDefault() {
        if (confirm('⚠️ ¿Estás seguro de restablecer todos los valores?\n\nSe perderán todos los datos actuales.')) {
            const defaultData = storage.getDefaultData();
            
            kanban.tasks = defaultData.tasks;
            calendar.events = defaultData.events;
            
            storage.saveData(defaultData);
            
            calendar.render(calendar.currentMonth, calendar.currentYear);
            kanban.render();
            this.updateLastSavedTime();
            
            utils.NotificationSystem.show('Valores restablecidos', 'success');
        }
    },

    /**
     * Exporta los datos actuales a un archivo JSON
     */
    exportData() {
        try {
            const data = {
                events: calendar.events,
                tasks: kanban.tasks,
                meta: {
                    exportedAt: new Date().toISOString(),
                    version: '1.0.0'
                }
            };
            
            const jsonStr = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `kanban-export-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.updateLastSavedTime();
            utils.NotificationSystem.show('Datos exportados', 'success');
        } catch (error) {
            utils.NotificationSystem.show(`Error al exportar: ${error.message}`, 'error');
        }
    },

    /**
     * Importa datos desde un archivo JSON
     * @param {Event} event - Evento de cambio de input file
     */
    importData(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                // Validación básica
                if (!Array.isArray(data.events) || !Array.isArray(data.tasks)) {
                    throw new Error('Formato de archivo inválido');
                }
                
                // Contar datos inválidos
                const invalidEvents = data.events.filter(event => !utils.validateEvent(event));
                const invalidTasks = data.tasks.filter(task => !utils.validateTask(task));
                
                if (invalidEvents.length > 0 || invalidTasks.length > 0) {
                    if (!confirm(`Archivo contiene ${invalidEvents.length} eventos y ${invalidTasks.length} tareas inválidos. ¿Importar solo los válidos?`)) {
                        return;
                    }
                }
                
                if (confirm('¿Reemplazar todos los datos actuales?')) {
                    calendar.events = data.events.filter(utils.validateEvent);
                    kanban.tasks = data.tasks.filter(utils.validateTask);
                    
                    storage.saveData({
                        tasks: kanban.tasks,
                        events: calendar.events
                    });
                    
                    calendar.render(calendar.currentMonth, calendar.currentYear);
                    kanban.render();
                    this.updateLastSavedTime();
                    
                    utils.NotificationSystem.show('Datos importados', 'success');
                }
            } catch (error) {
                utils.NotificationSystem.show(`Error al importar: ${error.message}`, 'error');
                console.error('Import error:', error);
            }
        };
        
        reader.onerror = () => {
            utils.NotificationSystem.show('Error al leer el archivo', 'error');
        };
        
        reader.readAsText(file);
        event.target.value = '';
    },

    /**
     * Actualiza la visualización de última hora de guardado
     */
    updateLastSavedTime() {
        const now = new Date();
        const options = {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        const formatted = now.toLocaleString('es-ES', options);
        document.getElementById('last-saved').textContent = `Último guardado: ${formatted}`;
        this.lastSavedTime = now;
    },

    /**
     * Muestra información del sistema
     */
    showSystemInfo() {
        const info = {
            tasks: kanban.tasks.length,
            events: calendar.events.length,
            completed: kanban.tasks.filter(t => t.completed).length,
            storageUsage: JSON.stringify(storage.loadData()).length / 1024 + ' KB'
        };
        
        alert(`Información del sistema:\n
Tareas: ${info.tasks} (${info.completed} completadas)\n
Eventos: ${info.events}\n
Uso almacenamiento: ${info.storageUsage}`);
    }
};

window.app = app;