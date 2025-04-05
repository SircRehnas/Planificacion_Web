/**
 * Módulo de almacenamiento y persistencia de datos
 * Maneja localStorage con validación y auto-guardado
 */
const storage = {
    STORAGE_KEY: 'kanban_app_data_v4',
    autoSaveInterval: null,
    saveQueue: [],
    isSaving: false,

    /**
     * Inicializa el almacenamiento y carga datos
     * @returns {object} Datos cargados o por defecto
     */
    init() {
        try {
            const data = this.loadData();
            if (!data) {
                utils.NotificationSystem.show('Cargando datos por defecto', 'info');
                const defaultData = this.getDefaultData();
                this.saveData(defaultData);
                return defaultData;
            }
            this.startAutoSave();
            return data;
        } catch (error) {
            console.error('Error inicializando storage:', error);
            return this.getDefaultData();
        }
    },

    /**
     * Inicia el auto-guardado cada 30 segundos
     */
    startAutoSave() {
        if (this.autoSaveInterval) clearInterval(this.autoSaveInterval);
        this.autoSaveInterval = setInterval(() => {
            this.saveData({
                tasks: kanban.tasks,
                events: calendar.events
            }, true);
        }, 30000);
    },

    /**
     * Carga datos desde localStorage con validación
     * @returns {object|null} Datos validados o null si hay error
     */
    loadData() {
        try {
            const savedData = localStorage.getItem(this.STORAGE_KEY);
            if (!savedData) return null;
            
            const parsedData = JSON.parse(savedData);
            
            // Validación básica de estructura
            if (!parsedData || typeof parsedData !== 'object') {
                throw new Error('Estructura de datos inválida');
            }
            
            // Validación y filtrado de datos
            return this.validateData(parsedData);
        } catch (error) {
            utils.NotificationSystem.show(`Error al cargar datos: ${error.message}`, 'error');
            console.error("Error loading data:", error);
            return null;
        }
    },

    /**
     * Valida y filtra los datos antes de guardar/cargar
     * @param {object} data - Datos a validar
     * @returns {object} Datos validados
     */
    validateData(data) {
        const result = {
            tasks: [],
            events: [],
            lastSaved: data.lastSaved || null,
            version: '1.0.0'
        };
        
        // Validar tareas
        if (Array.isArray(data.tasks)) {
            result.tasks = data.tasks.filter(task => {
                try {
                    return utils.validateTask(task);
                } catch (error) {
                    console.warn('Tarea inválida descartada:', task, error);
                    return false;
                }
            });
        }
        
        // Validar eventos
        if (Array.isArray(data.events)) {
            result.events = data.events.filter(event => {
                try {
                    return utils.validateEvent(event);
                } catch (error) {
                    console.warn('Evento inválido descartado:', event, error);
                    return false;
                }
            });
        }
        
        return result;
    },

    /**
     * Guarda datos con throttling y cola de operaciones
     * @param {object} data - Datos a guardar
     * @param {boolean} isAutoSave - Si es un auto-guardado
     */
    saveData: utils.throttle(function(data, isAutoSave = false) {
        try {
            const validatedData = this.validateData(data);
            this.queueSave(validatedData);
            
            if (!isAutoSave) {
                utils.NotificationSystem.show('Guardando cambios...', 'info');
            }
        } catch (error) {
            utils.NotificationSystem.show(`Error al guardar: ${error.message}`, 'error');
            console.error("Error saving data:", error);
        }
    }, 1000),

    /**
     * Añade operación de guardado a la cola
     * @param {object} data - Datos a guardar
     */
    queueSave(data) {
        this.saveQueue.push(data);
        this.processSaveQueue();
    },

    /**
     * Procesa la cola de guardado con throttling
     */
    processSaveQueue: utils.throttle(function() {
        if (this.isSaving || this.saveQueue.length === 0) return;
        
        this.isSaving = true;
        const dataToSave = this.saveQueue.pop();
        this.saveQueue = [];
        
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataToSave));
            app.updateLastSavedTime();
        } catch (error) {
            console.error('Error al procesar cola de guardado:', error);
        } finally {
            this.isSaving = false;
            if (this.saveQueue.length > 0) {
                setTimeout(() => this.processSaveQueue(), 500);
            }
        }
    }, 1000),

    /**
     * Genera datos por defecto para nueva instalación
     * @returns {object} Datos iniciales
     */
    getDefaultData() {
        const today = new Date().toISOString().split('T')[0];
        return {
            events: [{
                id: `event-${Date.now()}`,
                name: "Reunión inicial",
                date: today,
                type: "normal",
                inKanban: false
            }],
            tasks: [{
                id: `task-${Date.now()}`,
                title: "Tarea de ejemplo",
                description: "Esta es una tarea de demostración",
                date: utils.formatDate(today),
                column: "backlog",
                completed: false
            }],
            lastSaved: new Date().toISOString()
        };
    },

    /**
     * Devuelve los datos por defecto para nueva instalación
     * @returns {object} Objeto con datos iniciales
     */
    getDefaultData() {
        const today = new Date().toISOString().split('T')[0];
        return {
            events: [
                {
                    "id": "event-default1",
                    "name": "Reunión inicial",
                    "date": today,
                    "type": "normal",
                    "inKanban": false
                }
            ],
            tasks: [
                {
                    "id": "task-default1",
                    "title": "Tarea de ejemplo",
                    "description": "Esta es una tarea de demostración",
                    "date": "1-3 " + new Date().toLocaleDateString('es-ES', {month: 'short'}),
                    "column": "backlog",
                    "completed": false,
                    "color": null // Color inicial es null (usará el predeterminado)
                }
            ]
        };
    }
};

window.storage = storage;