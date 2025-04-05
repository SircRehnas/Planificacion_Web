/**
 * Módulo de calendario interactivo
 * Maneja visualización y gestión de eventos
 */
const calendar = {
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear(),
    events: [],
    visibleDays: [],
    observer: null,

    /**
     * Inicializa el calendario y configura eventos
     */
    init() {
        document.getElementById('prev-month').addEventListener('click', () => this.prevMonth());
        document.getElementById('next-month').addEventListener('click', () => this.nextMonth());
        
        document.getElementById('current-month').addEventListener('click', (e) => {
            this.handleMonthTitleClick();
        });

        // Configurar drag and drop
        document.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('calendar-event')) {
                e.dataTransfer.setData('text/plain', e.target.dataset.id);
                e.dataTransfer.setData('text/event-type', 'calendar-event');
            }
        });

        // Renderizar calendario inicial
        this.render(this.currentMonth, this.currentYear);
    },

    /**
     * Renderiza el calendario para un mes y año específicos
     * @param {number} month - Mes (0-11)
     * @param {number} year - Año completo
     */
    render(month, year) {
        // Limpiar días visibles y desconectar observador
        this.visibleDays = [];
        if (this.observer) {
            this.observer.disconnect();
        }

        const calendarGrid = document.getElementById('calendar-grid');
        calendarGrid.innerHTML = '';
        
        // Mostrar mes y año actual
        const monthName = new Date(year, month).toLocaleDateString('es-ES', { 
            month: 'long', 
            year: 'numeric' 
        });
        document.getElementById('current-month').textContent = monthName;
        
        // Crear encabezados de días
        const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
        days.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'calendar-day-header';
            dayHeader.textContent = day;
            calendarGrid.appendChild(dayHeader);
        });
        
        // Calcular primer día del mes y día de la semana
        const firstDay = new Date(year, month, 1);
        const firstDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
        
        // Añadir días vacíos para alinear el primer día
        for (let i = 0; i < firstDayOfWeek; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day empty';
            calendarGrid.appendChild(emptyDay);
        }
        
        // Añadir días del mes
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();
        
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.dataset.date = dateStr;
            
            // Resaltar día actual
            if (date.getDate() === today.getDate() && 
                date.getMonth() === today.getMonth() && 
                date.getFullYear() === today.getFullYear()) {
                dayElement.classList.add('today');
            }
            
            // Añadir número del día
            const dayNumber = document.createElement('div');
            dayNumber.className = 'calendar-day-number';
            dayNumber.textContent = day;
            dayElement.appendChild(dayNumber);
            
            // Configurar drag and drop
            this.setupDayDropHandlers(dayElement);
            
            calendarGrid.appendChild(dayElement);
        }

        // Configurar observador después de crear los días
        this.setupIntersectionObserver();
        
        // Forzar renderizado de eventos para el mes actual
        this.renderAllVisibleEvents();
    },

    /**
     * Configura IntersectionObserver para virtualización
     */
    setupIntersectionObserver() {
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const date = entry.target.dataset.date;
                    if (date && !this.visibleDays.includes(date)) {
                        this.visibleDays.push(date);
                        this.renderEventsForDay(entry.target, date);
                    }
                }
            });
        }, {
            root: document.getElementById('calendar-grid'),
            rootMargin: '100px',
            threshold: 0.1
        });

        // Observar todos los días del mes actual
        document.querySelectorAll('.calendar-day:not(.empty)').forEach(day => {
            this.observer.observe(day);
        });
    },

    /**
     * Renderiza todos los eventos visibles del mes actual
     */
    renderAllVisibleEvents() {
        const currentMonthStart = new Date(this.currentYear, this.currentMonth, 1);
        const currentMonthEnd = new Date(this.currentYear, this.currentMonth + 1, 0);
        
        this.events.forEach(event => {
            const eventDate = new Date(event.date);
            if (eventDate >= currentMonthStart && eventDate <= currentMonthEnd) {
                const dateStr = event.date;
                const dayElement = document.querySelector(`.calendar-day[data-date="${dateStr}"]`);
                if (dayElement) {
                    this.renderEventsForDay(dayElement, dateStr);
                }
            }
        });
    },

    /**
     * Configura manejadores de drop para un día del calendario
     * @param {HTMLElement} dayElement - Elemento del día
     */
    setupDayDropHandlers(dayElement) {
        dayElement.addEventListener('dragover', (e) => {
            e.preventDefault();
            dayElement.classList.add('drag-over');
        });
        
        dayElement.addEventListener('dragleave', () => {
            dayElement.classList.remove('drag-over');
        });
        
        dayElement.addEventListener('drop', (e) => {
            e.preventDefault();
            dayElement.classList.remove('drag-over');
            
            const eventId = e.dataTransfer.getData('text/plain');
            if (eventId && e.dataTransfer.getData('text/event-type') === 'calendar-event') {
                this.moveEvent(eventId, dayElement.dataset.date);
                storage.saveData({
                    tasks: kanban.tasks,
                    events: this.events
                });
            }
        });
    },

    /**
     * Renderiza eventos para un día específico
     * @param {HTMLElement} dayElement - Elemento del día
     * @param {string} dateStr - Fecha en formato YYYY-MM-DD
     */
    renderEventsForDay(dayElement, dateStr) {
        const dayEvents = this.events.filter(event => event.date === dateStr);
        
        // Limpiar contenedor existente
        const existingContainer = dayElement.querySelector('.calendar-events-container');
        if (existingContainer) {
            dayElement.removeChild(existingContainer);
        }
        
        // Crear nuevo contenedor si hay eventos
        if (dayEvents.length > 0) {
            const eventsContainer = document.createElement('div');
            eventsContainer.className = 'calendar-events-container';
            
            dayEvents.forEach(event => {
                const eventElement = document.createElement('div');
                eventElement.className = `calendar-event ${event.type} ${event.inKanban ? 'in-kanban' : ''}`;
                eventElement.textContent = event.name;
                eventElement.draggable = true;
                eventElement.dataset.id = event.id;
                
                const eventActions = document.createElement('div');
                eventActions.className = 'calendar-event-actions';
                eventActions.innerHTML = `
                    <button class="task-btn edit-btn">✎</button>
                    <button class="task-btn delete-btn">✕</button>
                `;
                
                eventElement.appendChild(eventActions);
                eventsContainer.appendChild(eventElement);
            });
            
            dayElement.insertBefore(eventsContainer, dayElement.lastElementChild);
        }
    },

    /**
     * Navega al mes anterior
     */
    prevMonth() {
        this.currentMonth--;
        if (this.currentMonth < 0) {
            this.currentMonth = 11;
            this.currentYear--;
        }
        this.visibleDays = [];
        this.render(this.currentMonth, this.currentYear);
    },

    /**
     * Navega al mes siguiente
     */
    nextMonth() {
        this.currentMonth++;
        if (this.currentMonth > 11) {
            this.currentMonth = 0;
            this.currentYear++;
        }
        this.visibleDays = [];
        this.render(this.currentMonth, this.currentYear);
    },

    /**
     * Maneja clic en el título del mes para selección de fecha
     */
    handleMonthTitleClick() {
        const input = document.createElement('input');
        input.type = 'date';
        input.style.position = 'fixed';
        input.style.opacity = 0;
        
        input.valueAsDate = new Date(this.currentYear, this.currentMonth, 1);
        
        input.addEventListener('change', () => {
            if (input.valueAsDate) {
                const selectedDate = new Date(input.valueAsDate);
                this.currentYear = selectedDate.getFullYear();
                this.currentMonth = selectedDate.getMonth();
                this.visibleDays = [];
                this.render(this.currentMonth, this.currentYear);
            }
            document.body.removeChild(input);
        });
        
        input.addEventListener('blur', () => {
            document.body.removeChild(input);
        });
        
        document.body.appendChild(input);
        input.showPicker();
    },

    /**
     * Añade un nuevo evento al calendario
     * @param {object} eventData - Datos del evento
     * @returns {object} Evento creado
     */
    addEvent(eventData) {
        const newEvent = {
            id: `event-${Date.now()}`,
            ...eventData,
            inKanban: false
        };
        this.events.push(newEvent);
        this.render(this.currentMonth, this.currentYear);
        return newEvent;
    },

    /**
     * Actualiza un evento existente
     * @param {string} eventId - ID del evento
     * @param {object} eventData - Nuevos datos del evento
     * @returns {boolean} True si se actualizó correctamente
     */
    updateEvent(eventId, eventData) {
        const index = this.events.findIndex(e => e.id === eventId);
        if (index !== -1) {
            this.events[index] = { ...this.events[index], ...eventData };
            this.render(this.currentMonth, this.currentYear);
            return true;
        }
        return false;
    },

    /**
     * Elimina un evento
     * @param {string} eventId - ID del evento a eliminar
     */
    deleteEvent(eventId) {
        this.events = this.events.filter(e => e.id !== eventId);
        
        // Eliminar tarea asociada en kanban si existe
        const taskId = `task-${eventId}`;
        if (kanban.getTask(taskId)) {
            kanban.deleteTask(taskId);
        }
        
        this.render(this.currentMonth, this.currentYear);
    },

    /**
     * Mueve un evento a otra fecha
     * @param {string} eventId - ID del evento
     * @param {string} newDate - Nueva fecha en formato YYYY-MM-DD
     */
    moveEvent(eventId, newDate) {
        const event = this.getEvent(eventId);
        if (event) {
            event.date = newDate;
            
            // Actualizar fecha en tarea asociada si existe
            if (event.inKanban) {
                const taskId = `task-${eventId}`;
                const task = kanban.getTask(taskId);
                if (task) {
                    task.date = utils.formatDate(newDate);
                    kanban.render();
                }
            }
            
            this.render(this.currentMonth, this.currentYear);
        }
    },

    /**
     * Obtiene un evento por ID
     * @param {string} eventId - ID del evento
     * @returns {object|null} Evento encontrado o null
     */
    getEvent(eventId) {
        return this.events.find(e => e.id === eventId);
    }
};

window.calendar = calendar;