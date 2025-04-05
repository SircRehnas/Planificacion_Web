/**
 * Módulo Kanban para gestión de tareas
 * Maneja columnas, tareas y operaciones relacionadas
 */
const kanban = {
    tasks: [],

    /**
     * Inicializa el tablero Kanban
     */
    init() {
        this.setupDragAndDrop();
        this.render();
    },

    /**
     * Configura el sistema de drag and drop
     */
    setupDragAndDrop() {
        // Evento cuando comienza el arrastre
        document.addEventListener('dragstart', e => {
            if (e.target.classList.contains('task-card')) {
                e.dataTransfer.setData('text/plain', e.target.dataset.id);
            }
        });
        
        // Configurar eventos para cada columna
        document.querySelectorAll('.kanban-column').forEach(column => {
            // Permitir soltar en la columna
            column.addEventListener('dragover', e => e.preventDefault());
            
            // Manejar cuando se suelta un elemento
            column.addEventListener('drop', e => {
                e.preventDefault();
                const itemId = e.dataTransfer.getData('text/plain');
                
                // Manejar tareas movidas
                if (itemId.startsWith('task')) {
                    this.handleTaskDrop(itemId, column.id);
                } 
                // Manejar eventos convertidos en tareas
                else if (itemId.startsWith('event')) {
                    this.handleEventDrop(itemId, column.id);
                }
            });
        });
    },

    /**
     * Maneja el drop de una tarea en una columna
     * @param {string} taskId - ID de la tarea
     * @param {string} columnId - ID de la columna destino
     */
    handleTaskDrop(taskId, columnId) {
        const taskCard = document.querySelector(`.task-card[data-id="${taskId}"]`);
        if (!taskCard) return;
        
        const column = document.getElementById(columnId);
        column.appendChild(taskCard);
        
        // Actualizar estado de la tarea
        const isCompleted = columnId === 'completed';
        const taskIndex = this.tasks.findIndex(t => t.id === taskId);
        
        if (taskIndex !== -1) {
            // Actualizar tanto la columna como el estado completado
            this.tasks[taskIndex].column = columnId;
            this.tasks[taskIndex].completed = isCompleted;
            
            // Actualizar clases CSS de la tarjeta
            if (isCompleted) {
                taskCard.classList.add('completed');
            } else {
                taskCard.classList.remove('completed');
            }
            
            // Actualizar el ícono de fecha
            const dateIcon = taskCard.querySelector('.task-date');
            if (dateIcon) {
                dateIcon.innerHTML = `${isCompleted ? '✅' : '📅'} ${this.tasks[taskIndex].date}`;
            }
            
            storage.saveData({
                tasks: this.tasks,
                events: calendar.events
            });
        }
    },

    /**
     * Maneja el drop de un evento en una columna
     * @param {string} eventId - ID del evento
     * @param {string} columnId - ID de la columna destino
     */
    handleEventDrop(eventId, columnId) {
        const event = calendar.events.find(ev => ev.id === eventId);
        if (event && !event.inKanban) {
            this.addTaskFromEvent(event, columnId);
            storage.saveData({
                tasks: this.tasks,
                events: calendar.events
            });
        }
    },

    /**
     * Renderiza todo el tablero Kanban
     */
    render() {
        document.querySelectorAll('.kanban-column').forEach(column => {
            const columnId = column.id;
            const header = column.querySelector('h3');
            column.innerHTML = '';
            column.appendChild(header);
            
            // Botón para añadir tarea
            const addBtn = document.createElement('button');
            addBtn.className = 'task-btn';
            addBtn.innerHTML = '+ Añadir tarea';
            addBtn.onclick = () => app.openTaskModal(columnId);
            column.appendChild(addBtn);
            
            // Obtener y renderizar tareas ordenadas
            this.getSortedTasksForColumn(columnId).forEach(task => {
                column.appendChild(this.createTaskCard(task));
            });
        });
    },

    /**
     * Obtiene tareas ordenadas por fecha para una columna
     * @param {string} columnId - ID de la columna
     * @returns {array} Tareas ordenadas
     */
    getSortedTasksForColumn(columnId) {
        return this.tasks
            .filter(task => task.column === columnId)
            .sort((a, b) => {
                const dateA = utils.parseTaskDate(a.date) || '9999-99-99';
                const dateB = utils.parseTaskDate(b.date) || '9999-99-99';
                return dateA.localeCompare(dateB);
            });
    },

    /**
     * Crea el elemento HTML para una tarea
     * @param {object} task - Datos de la tarea
     * @returns {HTMLElement} Elemento de la tarea
     */
    createTaskCard(task) {
        const taskCard = document.createElement('div');
        // Determinar clase de color (default si no hay)
        const colorClass = task.color ? `color-${task.color}` : 'color-default';
        taskCard.className = `task-card ${colorClass} ${task.completed ? 'completed' : ''}`;
        taskCard.draggable = true;
        taskCard.dataset.id = task.id;
        
        // Ícono de fecha (cambia si está completada)
        const dateIcon = task.completed ? '✅' : '📅';
        
        // Estructura HTML de la tarjeta
        taskCard.innerHTML = `
            <div class="task-actions">
                <button class="task-btn complete-btn" title="Completar">✓</button>
                <button class="task-btn edit-btn" title="Editar">✎</button>
                <button class="task-btn delete-btn" title="Eliminar">✕</button>
            </div>
            <h4>${task.title}</h4>
            <p>${task.description}</p>
            <div class="task-date">${dateIcon} ${task.date}</div>
        `;
        
        return taskCard;
    },

    /**
     * Añade una nueva tarea
     * @param {object} taskData - Datos de la tarea
     * @returns {object} Tarea creada
     */
    addTask(taskData) {
        const newTask = {
            id: `task-${Date.now()}`, // ID único basado en timestamp
            ...taskData, // Incluir todas las propiedades
            completed: taskData.column === 'completed' // Marcar si está completada
        };
        
        this.tasks.push(newTask);
        this.render();
        storage.saveData({
            tasks: this.tasks,
            events: calendar.events
        });
        return newTask;
    },

    /**
     * Añade una tarea desde un evento del calendario
     * @param {object} event - Evento origen
     * @param {string} columnId - Columna destino
     * @returns {object} Tarea creada
     */
    addTaskFromEvent(event, columnId = 'backlog') {
        const newTask = {
            id: `task-${event.id}`,
            title: event.name,
            description: "Descripción del evento (editar)",
            date: utils.formatDate(event.date),
            column: columnId,
            completed: columnId === 'completed',
            linkedEvent: event.id
        };
        
        this.tasks.push(newTask);
        // Marcar evento como vinculado en Kanban
        calendar.events = calendar.events.map(ev => 
            ev.id === event.id ? {...ev, inKanban: true} : ev
        );
        
        this.render();
        calendar.render(calendar.currentMonth, calendar.currentYear);
        return newTask;
    },

    /**
     * Actualiza una tarea existente
     * @param {string} taskId - ID de la tarea
     * @param {object} taskData - Nuevos datos de la tarea
     * @returns {boolean} True si se actualizó correctamente
     */
    updateTask(taskId, taskData) {
        const index = this.tasks.findIndex(t => t.id === taskId);
        if (index !== -1) {
            // Actualizar datos de la tarea
            this.tasks[index] = { ...this.tasks[index], ...taskData };
            
            // Obtener y actualizar la tarjeta existente
            const existingCard = document.querySelector(`.task-card[data-id="${taskId}"]`);
            if (existingCard) {
                const newCard = this.createTaskCard(this.tasks[index]);
                existingCard.replaceWith(newCard);
            }
            
            // Actualizar evento asociado si existe
            if (taskId.startsWith('task-event-')) {
                const eventId = taskId.replace('task-', '');
                const event = calendar.getEvent(eventId);
                if (event) {
                    event.name = taskData.title;
                    calendar.render(calendar.currentMonth, calendar.currentYear);
                }
            }
            
            storage.saveData({
                tasks: this.tasks,
                events: calendar.events
            });
            return true;
        }
        return false;
    },

    /**
     * Elimina una tarea
     * @param {string} taskId - ID de la tarea a eliminar
     */
    deleteTask(taskId) {
        // Eliminar evento asociado si existe
        if (taskId.startsWith('task-event-')) {
            const eventId = taskId.replace('task-', '');
            calendar.deleteEvent(eventId);
        }
        
        this.tasks = this.tasks.filter(t => t.id !== taskId);
        storage.saveData({
            tasks: this.tasks,
            events: calendar.events
        });
        this.render();
    },

    /**
     * Marca/desmarca una tarea como completada
     * @param {string} taskId - ID de la tarea
     */
    completeTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            task.column = task.completed ? 'completed' : 'backlog';
            
            const taskCard = document.querySelector(`.task-card[data-id="${taskId}"]`);
            if (taskCard) {
                taskCard.classList.toggle('completed', task.completed);
                
                const dateIcon = taskCard.querySelector('.task-date');
                if (dateIcon) {
                    dateIcon.innerHTML = `${task.completed ? '✅' : '📅'} ${task.date}`;
                }
            }
            
            storage.saveData({
                tasks: this.tasks,
                events: calendar.events
            });
        }
    },

    /**
     * Obtiene una tarea por ID
     * @param {string} taskId - ID de la tarea
     * @returns {object|null} Tarea encontrada o null
     */
    getTask(taskId) {
        return this.tasks.find(t => t.id === taskId);
    }
};

window.kanban = kanban;