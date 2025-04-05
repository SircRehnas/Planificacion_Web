/**
 * Utilidades generales para la aplicación
 * Incluye polyfills, helpers y validaciones
 */

// Polyfill para showPicker() para navegadores que no lo soportan
if (!HTMLInputElement.prototype.showPicker) {
    HTMLInputElement.prototype.showPicker = function() {
        this.click(); // Fallback básico para navegadores sin soporte nativo
    };
}

// Sistema de notificaciones visuales
const NotificationSystem = {
    /**
     * Muestra una notificación al usuario
     * @param {string} message - Texto a mostrar
     * @param {string} type - Tipo de notificación (info, success, warning, error)
     * @param {number} duration - Tiempo en ms que se muestra (default 3000)
     */
    show(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 500);
        }, duration);
    }
};

// Función throttle para limitar la frecuencia de ejecución
function throttle(func, limit) {
    let lastFunc;
    let lastRan;
    return function() {
        const context = this;
        const args = arguments;
        if (!lastRan) {
            func.apply(context, args);
            lastRan = Date.now();
        } else {
            clearTimeout(lastFunc);
            lastFunc = setTimeout(function() {
                if ((Date.now() - lastRan) >= limit) {
                    func.apply(context, args);
                    lastRan = Date.now();
                }
            }, limit - (Date.now() - lastRan));
        }
    };
}

// Funciones de validación de datos
const validateEvent = (event) => {
    return event && 
           typeof event === 'object' &&
           typeof event.id === 'string' &&
           typeof event.name === 'string' &&
           typeof event.date === 'string' &&
           ['normal', 'milestone', 'phase'].includes(event.type) &&
           typeof event.inKanban === 'boolean';
};

const validateTask = (task) => {
    return task && 
           typeof task === 'object' &&
           typeof task.id === 'string' &&
           typeof task.title === 'string' &&
           typeof task.description === 'string' &&
           typeof task.date === 'string' &&
           ['backlog', 'in-progress', 'testing', 'completed'].includes(task.column) &&
           typeof task.completed === 'boolean';
};

// Funciones de formato y parseo de fechas
const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
};

const parseTaskDate = (dateStr) => {
    if (!dateStr || !dateStr.match(/\d{1,2}-\d{1,2} [A-Za-z]{3}/)) return null;
    
    const [dayRange, monthAbbr] = dateStr.split(' ');
    const [startDay] = dayRange.split('-').map(Number);
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const monthIndex = months.findIndex(m => m === monthAbbr);
    
    if (monthIndex === -1) return null;
    
    const year = new Date().getFullYear();
    return `${year}-${(monthIndex + 1).toString().padStart(2, '0')}-${startDay.toString().padStart(2, '0')}`;
};

// Exportar todas las utilidades
window.utils = {
    NotificationSystem,
    throttle,
    validateEvent,
    validateTask,
    formatDate,
    parseTaskDate
};