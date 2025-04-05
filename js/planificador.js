document.addEventListener('DOMContentLoaded', function() {
        // Elementos del DOM
        const toggleEditBtn = document.getElementById('toggleEdit');
        const saveBtn = document.getElementById('saveBtn');
        const resetBtn = document.getElementById('resetBtn');
        const addSectionBtn = document.getElementById('addSectionBtn');
        const addFeatureCardBtn = document.getElementById('addFeatureCard');
        const addTechCardBtn = document.getElementById('addTechCard');
        const featureList = document.getElementById('featureList');
        const techGrid = document.getElementById('techGrid');
        const editableContainer = document.getElementById('editableContainer');
        const notification = document.getElementById('notification');
        const exportBtn = document.getElementById('exportBtn');
        const importBtn = document.getElementById('importBtn');
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';
        fileInput.style.display = 'none';

        // Estado de edición
        let editMode = false;
        let draggedItem = null;
        let draggedSection = null;
        let autoSaveInterval;
        let lastSavedHash = '';
        let isSaving = false;
        let changeDetected = false;
        const SAVE_ENDPOINT = 'save_data.php';

        document.getElementById('btnVolver').addEventListener('click', function() {
            window.location.href = 'index.html';
        });

        // Cargar datos iniciales
        syncData().then(() => {
            setupInitialUI();
            if (editMode) enableEditMode();
        });

        // Habilitar/deshabilitar modo edición
        toggleEditBtn.addEventListener('click', toggleEditMode);
        saveBtn.addEventListener('click', saveData);
        resetBtn.addEventListener('click', resetData);
        addSectionBtn.addEventListener('click', addNewSection);
        addFeatureCardBtn.addEventListener('click', addNewFeatureCard);
        addTechCardBtn.addEventListener('click', addNewTechCard);
        exportBtn.addEventListener('click', exportData);
        importBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', importData);

        // Sincronizar periódicamente
        setInterval(syncData, 300000);

        // ==============================================
        // FUNCIONES PRINCIPALES
        // ==============================================

        async function syncData() {
            try {
                // 1. Obtener datos del servidor
                const serverResponse = await fetch(SAVE_ENDPOINT);
                if (serverResponse.ok) {
                    const serverData = await serverResponse.json();
                    const serverHTML = serverData?.anteproyectoHTML;
                    
                    // 2. Obtener datos locales
                    const localHTML = localStorage.getItem('anteproyectoHTML');
                    
                    // 3. Decidir qué datos usar (prioridad al servidor)
                    if (serverHTML) {
                        // Si hay diferencias, usar los del servidor
                        if (!editableContainer.innerHTML || hashString(serverHTML) !== hashString(editableContainer.innerHTML)) {
                            editableContainer.innerHTML = serverHTML;
                            showNotification('Datos sincronizados desde el servidor', 'success');
                        }
                        // Actualizar localStorage con datos del servidor
                        localStorage.setItem('anteproyectoHTML', serverHTML);
                        lastSavedHash = hashString(serverHTML);
                    } else if (localHTML) {
                        // Solo si no hay datos en el servidor, usar locales
                        editableContainer.innerHTML = localHTML;
                    }
                    
                    return true;
                }
            } catch (error) {
                console.error('Error en sincronización:', error);
                const backupHTML = localStorage.getItem('anteproyectoHTML_backup');
                if (backupHTML && !editableContainer.innerHTML) {
                    editableContainer.innerHTML = backupHTML;
                }
            }
            return false;
        }

        function saveData() {
            const currentHTML = editableContainer.innerHTML;
            localStorage.setItem('anteproyectoHTML', currentHTML);
            saveToServer();
            showNotification('Datos guardados localmente y en servidor', 'success');
            toggleEditMode();
        }

        async function saveToServer() {
            if (isSaving) return;
            
            const currentHTML = editableContainer.innerHTML;
            const currentHash = hashString(currentHTML);
            
            if (currentHash === lastSavedHash && !changeDetected) return;
            
            isSaving = true;
            changeDetected = false;
            
            try {
                const response = await fetch(SAVE_ENDPOINT, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        anteproyectoHTML: currentHTML,
                        timestamp: new Date().toISOString()
                    })
                });
                
                const data = await response.json();
                
                if (response.ok && data.success) {
                    lastSavedHash = currentHash;
                    updateLastSavedTime();
                    showNotification('Cambios guardados en servidor', 'success');
                } else {
                    throw new Error(data.error || 'Error en el servidor');
                }
            } catch (error) {
                console.error('Error al guardar:', error);
                localStorage.setItem('anteproyectoHTML_backup', currentHTML);
                showNotification('Error al guardar en servidor. Datos guardados localmente.', 'warning');
            } finally {
                isSaving = false;
            }
        }

        function setupInitialUI() {
            document.querySelectorAll('.add-list-item').forEach(btn => {
                btn.addEventListener('click', addNewListItem);
            });
            
            setupColorChangeButtons();
            setupCardColorChangeButtons();
            setupDeleteSectionButtons();
            setupDeleteCardButtons();
            
            if (editMode) {
                setupSectionDragAndDrop();
                setupDragAndDrop();
            }
        }

        function toggleEditMode() {
            editMode = !editMode;
            
            if (editMode) {
                enableEditMode();
                showNotification('Modo edición activado', 'success');
            } else {
                disableEditMode();
                showNotification('Modo edición desactivado', 'warning');
            }
        }

        function enableEditMode() {
            saveBtn.style.display = 'flex';
            resetBtn.style.display = 'flex';
            addSectionBtn.style.display = 'flex';
            addFeatureCardBtn.style.display = 'block';
            addTechCardBtn.style.display = 'block';
            exportBtn.style.display = 'flex';
            importBtn.style.display = 'flex';

            toggleEditBtn.textContent = '✖️ Cancelar';
            
            document.querySelectorAll('.editable').forEach(el => {
                el.setAttribute('contenteditable', 'true');
                el.classList.add('editable-active');
            });
            
            document.querySelectorAll('.add-btn').forEach(btn => {
                btn.style.display = 'inline-flex';
            });
            
            document.querySelectorAll('.section-controls').forEach(controls => {
                controls.style.display = 'flex';
            });
            
            document.querySelectorAll('.card-controls').forEach(controls => {
                controls.style.display = 'flex';
            });
            
            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.style.display = 'inline-flex';
            });
            
            document.querySelectorAll('#addFeatureCard, #addTechCard, .add-feature-card-btn').forEach(btn => {
                btn.style.display = 'block';
            });
            
            setupDragAndDrop();
            setupSectionDragAndDrop();
            addDeleteButtons();
            setupAutoSave();
            setupChangeDetection();
        }

        function disableEditMode() {
            saveBtn.style.display = 'none';
            resetBtn.style.display = 'none';
            addSectionBtn.style.display = 'none';
            addFeatureCardBtn.style.display = 'none';
            addTechCardBtn.style.display = 'none';
            
            toggleEditBtn.textContent = '✏️ Editar';
            
            document.querySelectorAll('.editable').forEach(el => {
                el.removeAttribute('contenteditable');
                el.classList.remove('editable-active');
            });
            
            document.querySelectorAll('.add-btn').forEach(btn => {
                btn.style.display = 'none';
            });
            
            document.querySelectorAll('.section-controls').forEach(controls => {
                controls.style.display = 'none';
            });
            
            document.querySelectorAll('.card-controls').forEach(controls => {
                controls.style.display = 'none';
            });
            
            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.style.display = 'none';
            });
            
            document.querySelectorAll('.color-palette, .card-color-palette').forEach(palette => {
                palette.classList.remove('show-palette');
            });
            
            removeDeleteButtons();
            saveToServer();
        }
        
        function resetData() {
            if (confirm('¿Estás seguro de que quieres resetear todos los cambios?')) {
                localStorage.removeItem('anteproyectoHTML');
                localStorage.removeItem('anteproyectoHTML_backup');
                
                // Opcional: También resetear en el servidor
                fetch(SAVE_ENDPOINT, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        anteproyectoHTML: '',
                        reset: true
                    })
                }).catch(e => console.error('Error al resetear en servidor:', e));
                
                location.reload();
                showNotification('Datos restablecidos', 'warning');
            }
        }
        
        function showNotification(message, type) {
            notification.textContent = message;
            notification.className = 'notification';
            notification.classList.add(type, 'show');
            
            setTimeout(() => {
                notification.classList.remove('show');
            }, 3000);
        }
        
        function setupDragAndDrop() {
            // Limpiar event listeners antiguos
            const draggables = document.querySelectorAll('[draggable="true"]:not(.section)');
            draggables.forEach(draggable => {
                draggable.removeEventListener('dragstart', handleDragStart);
                draggable.removeEventListener('dragend', handleDragEnd);
            });

            const containers = [featureList, techGrid];
            containers.forEach(container => {
                if (container) {
                    container.removeEventListener('dragover', handleDragOver);
                    container.removeEventListener('drop', handleDrop);
                }
            });

            // Configurar nuevos event listeners
            document.querySelectorAll('[draggable="true"]:not(.section)').forEach(draggable => {
                draggable.addEventListener('dragstart', handleDragStart);
                draggable.addEventListener('dragend', handleDragEnd);
            });

            containers.forEach(container => {
                if (container) {
                    container.addEventListener('dragover', handleDragOver);
                    container.addEventListener('drop', handleDrop);
                }
            });
        }

        // Handlers específicos para el drag and drop
        function handleDragStart(e) {
            draggedItem = this;
            setTimeout(() => {
                this.classList.add('dragging');
            }, 0);
            
            e.dataTransfer.setData('text/plain', this.dataset.id);
            e.dataTransfer.effectAllowed = 'move';
        }

        function handleDragEnd() {
            this.classList.remove('dragging');
            draggedItem = null;
        }

        function handleDragOver(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            
            const afterElement = getDragAfterElement(this, e.clientY);
            if (draggedItem) {
                if (afterElement == null) {
                    this.appendChild(draggedItem);
                } else {
                    this.insertBefore(draggedItem, afterElement);
                }
            }
        }

        function handleDrop(e) {
            e.preventDefault();
            // Marcar que hubo un cambio para guardar automáticamente
            changeDetected = true;
        }
        
        // Función para arrastrar secciones (NUEVA)
        function setupSectionDragAndDrop() {
            // Limpiar event listeners antiguos
            const sections = document.querySelectorAll('.section');
            sections.forEach(section => {
                section.removeEventListener('dragstart', handleSectionDragStart);
                section.removeEventListener('dragend', handleSectionDragEnd);
            });

            editableContainer.removeEventListener('dragover', handleSectionDragOver);
            editableContainer.removeEventListener('drop', handleSectionDrop);

            // Configurar nuevos event listeners
            document.querySelectorAll('.section').forEach(section => {
                section.addEventListener('dragstart', handleSectionDragStart);
                section.addEventListener('dragend', handleSectionDragEnd);
            });

            editableContainer.addEventListener('dragover', handleSectionDragOver);
            editableContainer.addEventListener('drop', handleSectionDrop);
        }

        // Handlers específicos para secciones
        function handleSectionDragStart(e) {
            draggedSection = this;
            setTimeout(() => {
                this.classList.add('dragging-section');
            }, 0);
            
            e.dataTransfer.setData('text/plain', 'section');
            e.dataTransfer.effectAllowed = 'move';
        }

        function handleSectionDragEnd() {
            this.classList.remove('dragging-section');
            draggedSection = null;
        }

        function handleSectionDragOver(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            
            const afterElement = getDragAfterSection(editableContainer, e.clientY);
            if (draggedSection) {
                if (afterElement == null) {
                    editableContainer.appendChild(draggedSection);
                } else {
                    editableContainer.insertBefore(draggedSection, afterElement);
                }
            }
        }

        function handleSectionDrop(e) {
            e.preventDefault();
            // Marcar que hubo un cambio para guardar automáticamente
            changeDetected = true;
        }
        
        function getDragAfterElement(container, y) {
            const draggableElements = [...container.querySelectorAll('[draggable="true"]:not(.dragging)')];
            
            return draggableElements.reduce((closest, child) => {
                const box = child.getBoundingClientRect();
                const offset = y - box.top - box.height / 2;
                
                if (offset < 0 && offset > closest.offset) {
                    return { offset: offset, element: child };
                } else {
                    return closest;
                }
            }, { offset: Number.NEGATIVE_INFINITY }).element;
        }
        
        // Función auxiliar para secciones (NUEVA)
        function getDragAfterSection(container, y) {
            const sections = [...container.querySelectorAll('.section:not(.dragging-section)')];
            
            return sections.reduce((closest, child) => {
                const box = child.getBoundingClientRect();
                const offset = y - box.top - box.height / 2;
                
                if (offset < 0 && offset > closest.offset) {
                    return { offset: offset, element: child };
                } else {
                    return closest;
                }
            }, { offset: Number.NEGATIVE_INFINITY }).element;
        }
        
        function addDeleteButtons() {
            document.querySelectorAll('.editable-list li').forEach(li => {
                if (!li.querySelector('.delete-btn')) {
                    const deleteBtn = document.createElement('button');
                    deleteBtn.className = 'delete-btn';
                    deleteBtn.textContent = '×';
                    deleteBtn.style.display = editMode ? 'inline-flex' : 'none';
                    deleteBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        li.remove();
                        showNotification('Elemento eliminado', 'warning');
                    });
                    li.appendChild(deleteBtn);
                }
            });
        }
        
        function removeDeleteButtons() {
            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.remove();
            });
        }
        
        function addNewListItem(e) {
            const button = e.target.closest('.add-list-item');
            if (!button) return;
            
            const card = button.closest('.feature-card, .tech-card, .pros, .cons, .next-steps');
            if (!card) return;
            
            const list = card.querySelector('ul, ol');
            if (!list) return;
            
            const newItem = document.createElement('li');
            newItem.className = 'editable';
            newItem.setAttribute('contenteditable', 'true');
            newItem.textContent = 'Nuevo elemento de lista';
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = '×';
            deleteBtn.style.display = editMode ? 'inline-flex' : 'none';
            deleteBtn.addEventListener('click', (ev) => {
                ev.stopPropagation();
                newItem.remove();
                showNotification('Elemento eliminado', 'warning');
            });
            newItem.appendChild(deleteBtn);
            
            list.appendChild(newItem);
            newItem.focus();
            
            newItem.addEventListener('keydown', function(event) {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    this.blur();
                }
            });
        }
        
        function addNewFeatureCard() {
            const newCard = document.createElement('div');
            newCard.className = 'feature-card card-bg-color-1';
            newCard.setAttribute('draggable', 'true');
            newCard.dataset.id = 'feature' + (featureList.children.length + 1);
            
            newCard.innerHTML = `
                <div class="card-controls" style="display: ${editMode ? 'flex' : 'none'}">
                    <button class="card-btn change-card-color-btn">🎨</button>
                    <div class="card-color-palette">
                        <div class="card-color-option card-bg-color-1" data-color="1"></div>
                        <div class="card-color-option card-bg-color-2" data-color="2"></div>
                        <div class="card-color-option card-bg-color-3" data-color="3"></div>
                        <div class="card-color-option card-bg-color-4" data-color="4"></div>
                        <div class="card-color-option card-bg-color-5" data-color="5"></div>
                        <div class="card-color-option card-bg-color-6" data-color="6"></div>
                        <div class="card-color-option card-bg-color-7" data-color="7"></div>
                        <div class="card-color-option card-bg-color-8" data-color="8"></div>
                    </div>
                    <button class="card-btn delete-card-btn">×</button>
                </div>
                <h4 class="editable" contenteditable="${editMode ? 'true' : 'false'}">Nueva Característica</h4>
                <ul class="editable-list">
                    <li class="editable" contenteditable="${editMode ? 'true' : 'false'}">Primer punto</li>
                </ul>
                <button class="add-btn add-list-item" style="display: ${editMode ? 'inline-flex' : 'none'}">+</button>
            `;
            
            featureList.appendChild(newCard);
            setupDragAndDrop(); // Reconectar event listeners
            
            newCard.querySelector('.add-list-item').addEventListener('click', addNewListItem);
            setupCardColorChangeButtons();
            setupDeleteCardButtons();
            
            if (editMode) {
                newCard.querySelectorAll('.editable').forEach(el => {
                    el.setAttribute('contenteditable', 'true');
                    el.classList.add('editable-active');
                });
            }
            
            showNotification('Nueva tarjeta añadida', 'success');
        }
        
        function addNewTechCard() {
            const newCard = document.createElement('div');
            newCard.className = 'tech-card card-bg-color-1';
            newCard.setAttribute('draggable', 'true');
            newCard.dataset.id = 'tech' + (techGrid.children.length + 1);
            
            newCard.innerHTML = `
                <div class="card-controls" style="display: ${editMode ? 'flex' : 'none'}">
                    <button class="card-btn change-card-color-btn">🎨</button>
                    <div class="card-color-palette">
                        <div class="card-color-option card-bg-color-1" data-color="1"></div>
                        <div class="card-color-option card-bg-color-2" data-color="2"></div>
                        <div class="card-color-option card-bg-color-3" data-color="3"></div>
                        <div class="card-color-option card-bg-color-4" data-color="4"></div>
                        <div class="card-color-option card-bg-color-5" data-color="5"></div>
                        <div class="card-color-option card-bg-color-6" data-color="6"></div>
                        <div class="card-color-option card-bg-color-7" data-color="7"></div>
                        <div class="card-color-option card-bg-color-8" data-color="8"></div>
                    </div>
                    <button class="card-btn delete-card-btn">×</button>
                </div>
                <h4 class="editable" contenteditable="${editMode ? 'true' : 'false'}">Nueva Tecnología</h4>
                <ul class="editable-list">
                    <li class="editable" contenteditable="${editMode ? 'true' : 'false'}">Primer punto</li>
                </ul>
                <button class="add-btn add-list-item" style="display: ${editMode ? 'inline-flex' : 'none'}">+</button>
            `;
            
            techGrid.appendChild(newCard);
            setupDragAndDrop(); // Reconectar event listeners
            
            newCard.querySelector('.add-list-item').addEventListener('click', addNewListItem);
            setupCardColorChangeButtons();
            setupDeleteCardButtons();
            
            if (editMode) {
                newCard.querySelectorAll('.editable').forEach(el => {
                    el.setAttribute('contenteditable', 'true');
                    el.classList.add('editable-active');
                });
            }
            
            showNotification('Nueva tarjeta tecnológica añadida', 'success');
        }
        
        function addNewSection() {
            const sectionType = prompt("Selecciona el tipo de sección:\n1. Grid con tarjetas\n2. Lista\n3. Bloques (2 por línea)", "1");
            
            if (!sectionType) return;
            
            const newSection = document.createElement('section');
            newSection.className = 'section bg-color-1';
            
            if (sectionType === "2") {
                newSection.innerHTML = `
                    <div class="section-controls" style="display: ${editMode ? 'flex' : 'none'}">
                        <button class="section-btn change-color-btn">🎨</button>
                        <div class="color-palette">
                            <div class="color-option bg-color-1" data-color="1"></div>
                            <div class="color-option bg-color-2" data-color="2"></div>
                            <div class="color-option bg-color-3" data-color="3"></div>
                            <div class="color-option bg-color-4" data-color="4"></div>
                            <div class="color-option bg-color-5" data-color="5"></div>
                            <div class="color-option bg-color-6" data-color="6"></div>
                            <div class="color-option bg-color-7" data-color="7"></div>
                            <div class="color-option bg-color-8" data-color="8"></div>
                        </div>
                        <button class="section-btn delete-section-btn">×</button>
                    </div>
                    
                    <h2 class="editable" contenteditable="${editMode ? 'true' : 'false'}">Nueva Sección de Lista</h2>
                    <ol class="editable-list">
                        <li class="editable" contenteditable="${editMode ? 'true' : 'false'}">Primer elemento de la lista</li>
                    </ol>
                    <button class="add-btn add-list-item" style="display: ${editMode ? 'inline-flex' : 'none'}">+</button>
                `;
            } else if (sectionType === "3") {
                newSection.innerHTML = `
                    <div class="section-controls" style="display: ${editMode ? 'flex' : 'none'}">
                        <button class="section-btn change-color-btn">🎨</button>
                        <div class="color-palette">
                            <div class="color-option bg-color-1" data-color="1"></div>
                            <div class="color-option bg-color-2" data-color="2"></div>
                            <div class="color-option bg-color-3" data-color="3"></div>
                            <div class="color-option bg-color-4" data-color="4"></div>
                            <div class="color-option bg-color-5" data-color="5"></div>
                            <div class="color-option bg-color-6" data-color="6"></div>
                            <div class="color-option bg-color-7" data-color="7"></div>
                            <div class="color-option bg-color-8" data-color="8"></div>
                        </div>
                        <button class="section-btn delete-section-btn">×</button>
                    </div>
                    
                    <h2 class="editable" contenteditable="${editMode ? 'true' : 'false'}">Nueva Sección de Bloques</h2>
                    <div class="blocks-section">
                        <div class="block-card card-bg-color-1">
                            <div class="card-controls" style="display: ${editMode ? 'flex' : 'none'}">
                                <button class="card-btn change-card-color-btn">🎨</button>
                                <div class="card-color-palette">
                                    <div class="card-color-option card-bg-color-1" data-color="1"></div>
                                    <div class="card-color-option card-bg-color-2" data-color="2"></div>
                                    <div class="card-color-option card-bg-color-3" data-color="3"></div>
                                    <div class="card-color-option card-bg-color-4" data-color="4"></div>
                                    <div class="card-color-option card-bg-color-5" data-color="5"></div>
                                    <div class="card-color-option card-bg-color-6" data-color="6"></div>
                                    <div class="card-color-option card-bg-color-7" data-color="7"></div>
                                    <div class="card-color-option card-bg-color-8" data-color="8"></div>
                                </div>
                                <button class="card-btn delete-card-btn">×</button>
                            </div>
                            <h4 class="editable" contenteditable="${editMode ? 'true' : 'false'}">Bloque 1</h4>
                            <p class="editable" contenteditable="${editMode ? 'true' : 'false'}">Contenido del primer bloque.</p>
                        </div>
                        <div class="block-card card-bg-color-1">
                            <div class="card-controls" style="display: ${editMode ? 'flex' : 'none'}">
                                <button class="card-btn change-card-color-btn">🎨</button>
                                <div class="card-color-palette">
                                    <div class="card-color-option card-bg-color-1" data-color="1"></div>
                                    <div class="card-color-option card-bg-color-2" data-color="2"></div>
                                    <div class="card-color-option card-bg-color-3" data-color="3"></div>
                                    <div class="card-color-option card-bg-color-4" data-color="4"></div>
                                    <div class="card-color-option card-bg-color-5" data-color="5"></div>
                                    <div class="card-color-option card-bg-color-6" data-color="6"></div>
                                    <div class="card-color-option card-bg-color-7" data-color="7"></div>
                                    <div class="card-color-option card-bg-color-8" data-color="8"></div>
                                </div>
                                <button class="card-btn delete-card-btn">×</button>
                            </div>
                            <h4 class="editable" contenteditable="${editMode ? 'true' : 'false'}">Bloque 2</h4>
                            <p class="editable" contenteditable="${editMode ? 'true' : 'false'}">Contenido del segundo bloque.</p>
                        </div>
                    </div>
                    
                `;
            } else {
                newSection.innerHTML = `
                    <div class="section-controls" style="display: ${editMode ? 'flex' : 'none'}">
                        <button class="section-btn change-color-btn">🎨</button>
                        <div class="color-palette">
                            <div class="color-option bg-color-1" data-color="1"></div>
                            <div class="color-option bg-color-2" data-color="2"></div>
                            <div class="color-option bg-color-3" data-color="3"></div>
                            <div class="color-option bg-color-4" data-color="4"></div>
                            <div class="color-option bg-color-5" data-color="5"></div>
                            <div class="color-option bg-color-6" data-color="6"></div>
                            <div class="color-option bg-color-7" data-color="7"></div>
                            <div class="color-option bg-color-8" data-color="8"></div>
                        </div>
                        <button class="section-btn delete-section-btn">×</button>
                    </div>
                    
                    <h2 class="editable" contenteditable="${editMode ? 'true' : 'false'}">Nueva Sección</h2>
                    <p class="editable" contenteditable="${editMode ? 'true' : 'false'}">Descripción de la nueva sección. Haz clic para editar.</p>
                    <button class="edit-btn add-feature-card-btn" style="display: ${editMode ? 'block' : 'none'}; margin-top: 1rem;">+ Añadir Tarjeta</button>
                    <div class="feature-list">
                        <div class="feature-card card-bg-color-1" draggable="true" data-id="feature-new">
                            <div class="card-controls" style="display: ${editMode ? 'flex' : 'none'}">
                                <button class="card-btn change-card-color-btn">🎨</button>
                                <div class="card-color-palette">
                                    <div class="card-color-option card-bg-color-1" data-color="1"></div>
                                    <div class="card-color-option card-bg-color-2" data-color="2"></div>
                                    <div class="card-color-option card-bg-color-3" data-color="3"></div>
                                    <div class="card-color-option card-bg-color-4" data-color="4"></div>
                                    <div class="card-color-option card-bg-color-5" data-color="5"></div>
                                    <div class="card-color-option card-bg-color-6" data-color="6"></div>
                                    <div class="card-color-option card-bg-color-7" data-color="7"></div>
                                    <div class="card-color-option card-bg-color-8" data-color="8"></div>
                                </div>
                                <button class="card-btn delete-card-btn">×</button>
                            </div>
                            <h4 class="editable" contenteditable="${editMode ? 'true' : 'false'}">Característica</h4>
                            <ul class="editable-list">
                                <li class="editable" contenteditable="${editMode ? 'true' : 'false'}">Primer punto</li>
                            </ul>
                            <button class="add-btn add-list-item" style="display: ${editMode ? 'inline-flex' : 'none'}">+</button>
                        </div>
                    </div>
                    
                `;
            }
            
            const sections = editableContainer.querySelectorAll('section');
            if (sections.length > 0) {
                editableContainer.insertBefore(newSection, sections[sections.length - 1].nextSibling);
            } else {
                editableContainer.appendChild(newSection);
            }
            
            if (sectionType === "2") {
                newSection.querySelector('.add-list-item').addEventListener('click', addNewListItem);
            } else if (sectionType === "3") {
                const addBlockBtn = newSection.querySelector('#addBlockCard');
                if (addBlockBtn) {
                    addBlockBtn.addEventListener('click', function() {
                        addNewBlockCard(newSection.querySelector('.blocks-section'));
                    });
                }
            } else {
                newSection.querySelector('.add-list-item').addEventListener('click', addNewListItem);
                newSection.querySelector('.add-feature-card-btn').addEventListener('click', function() {
                    const list = newSection.querySelector('.feature-list');
                    addNewFeatureCardToList(list);
                });
            }
            
            setupColorChangeButtons();
            setupDeleteSectionButtons();
            setupCardColorChangeButtons();
            setupDeleteCardButtons();
            setupSectionDragAndDrop(); // Reconectar event listeners
            
            if (editMode) {
                newSection.querySelectorAll('[draggable="true"]').forEach(card => {
                    setupDragAndDropForElement(card);
                });
            }
            
            showNotification('Nueva sección añadida', 'success');
        }
        
        function addNewBlockCard(container) {
            const newBlock = document.createElement('div');
            newBlock.className = 'block-card card-bg-color-1';
            newBlock.innerHTML = `
                <div class="card-controls" style="display: ${editMode ? 'flex' : 'none'}">
                    <button class="card-btn change-card-color-btn">🎨</button>
                    <div class="card-color-palette">
                        <div class="card-color-option card-bg-color-1" data-color="1"></div>
                        <div class="card-color-option card-bg-color-2" data-color="2"></div>
                        <div class="card-color-option card-bg-color-3" data-color="3"></div>
                        <div class="card-color-option card-bg-color-4" data-color="4"></div>
                        <div class="card-color-option card-bg-color-5" data-color="5"></div>
                        <div class="card-color-option card-bg-color-6" data-color="6"></div>
                        <div class="card-color-option card-bg-color-7" data-color="7"></div>
                        <div class="card-color-option card-bg-color-8" data-color="8"></div>
                    </div>
                    <button class="card-btn delete-card-btn">×</button>
                </div>
                <h4 class="editable" contenteditable="${editMode ? 'true' : 'false'}">Nuevo Bloque</h4>
                <p class="editable" contenteditable="${editMode ? 'true' : 'false'}">Contenido del nuevo bloque.</p>
            `;
            
            container.appendChild(newBlock);
            
            setupCardColorChangeButtons();
            setupDeleteCardButtons();
            
            if (editMode) {
                newBlock.querySelectorAll('.editable').forEach(el => {
                    el.setAttribute('contenteditable', 'true');
                    el.classList.add('editable-active');
                });
            }
            
            showNotification('Nuevo bloque añadido', 'success');
        }
        
        function addNewFeatureCardToList(list) {
            const newCard = document.createElement('div');
            newCard.className = 'feature-card card-bg-color-1';
            newCard.setAttribute('draggable', 'true');
            newCard.dataset.id = 'feature' + (list.children.length + 1);
            
            newCard.innerHTML = `
                <div class="card-controls" style="display: ${editMode ? 'flex' : 'none'}">
                    <button class="card-btn change-card-color-btn">🎨</button>
                    <div class="card-color-palette">
                        <div class="card-color-option card-bg-color-1" data-color="1"></div>
                        <div class="card-color-option card-bg-color-2" data-color="2"></div>
                        <div class="card-color-option card-bg-color-3" data-color="3"></div>
                        <div class="card-color-option card-bg-color-4" data-color="4"></div>
                        <div class="card-color-option card-bg-color-5" data-color="5"></div>
                        <div class="card-color-option card-bg-color-6" data-color="6"></div>
                        <div class="card-color-option card-bg-color-7" data-color="7"></div>
                        <div class="card-color-option card-bg-color-8" data-color="8"></div>
                    </div>
                    <button class="card-btn delete-card-btn">×</button>
                </div>
                <h4 class="editable" contenteditable="${editMode ? 'true' : 'false'}">Nueva Característica</h4>
                <ul class="editable-list">
                    <li class="editable" contenteditable="${editMode ? 'true' : 'false'}">Primer punto</li>
                </ul>
                <button class="add-btn add-list-item" style="display: ${editMode ? 'inline-flex' : 'none'}">+</button>
            `;
            
            list.appendChild(newCard);
            
            newCard.querySelector('.add-list-item').addEventListener('click', addNewListItem);
            setupCardColorChangeButtons();
            setupDeleteCardButtons();
            setupDragAndDrop();
            
            showNotification('Nueva tarjeta añadida', 'success');
        }
        
        function setupColorChangeButtons() {
            document.querySelectorAll('.change-color-btn').forEach(btn => {
                btn.replaceWith(btn.cloneNode(true));
            });
            
            document.querySelectorAll('.change-color-btn').forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    const palette = this.nextElementSibling;
                    const isShowing = palette.classList.contains('show-palette');
                    
                    document.querySelectorAll('.color-palette').forEach(p => {
                        p.classList.remove('show-palette');
                    });
                    
                    if (!isShowing) {
                        palette.classList.add('show-palette');
                    }
                });
            });
            
            document.querySelectorAll('.color-option').forEach(option => {
                option.replaceWith(option.cloneNode(true));
            });
            
            document.querySelectorAll('.color-option').forEach(option => {
                option.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    const colorClass = 'bg-color-' + this.dataset.color;
                    const section = this.closest('.section');
                    
                    if (!section) return;
                    
                    for (let i = 1; i <= 8; i++) {
                        section.classList.remove('bg-color-' + i);
                    }
                    
                    section.classList.add(colorClass);
                    this.closest('.color-palette').classList.remove('show-palette');
                    
                    showNotification('Color de sección cambiado', 'success');
                });
            });
        }
        
        function setupCardColorChangeButtons() {
            document.querySelectorAll('.change-card-color-btn').forEach(btn => {
                btn.replaceWith(btn.cloneNode(true));
            });
            
            document.querySelectorAll('.change-card-color-btn').forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    const palette = this.nextElementSibling;
                    const isShowing = palette.classList.contains('show-palette');
                    
                    document.querySelectorAll('.card-color-palette').forEach(p => {
                        p.classList.remove('show-palette');
                    });
                    
                    if (!isShowing) {
                        palette.classList.add('show-palette');
                    }
                });
            });
            
            document.querySelectorAll('.card-color-option').forEach(option => {
                option.replaceWith(option.cloneNode(true));
            });
            
            document.querySelectorAll('.card-color-option').forEach(option => {
                option.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    const colorClass = 'card-bg-color-' + this.dataset.color;
                    const card = this.closest('.feature-card, .tech-card, .block-card');
                    
                    if (!card) return;
                    
                    for (let i = 1; i <= 8; i++) {
                        card.classList.remove('card-bg-color-' + i);
                    }
                    
                    card.classList.add(colorClass);
                    this.closest('.card-color-palette').classList.remove('show-palette');
                    
                    showNotification('Color de tarjeta cambiado', 'success');
                });
            });
        }
        
        function setupDeleteSectionButtons() {
            document.querySelectorAll('.delete-section-btn').forEach(btn => {
                btn.replaceWith(btn.cloneNode(true));
            });
            
            document.querySelectorAll('.delete-section-btn').forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    const section = this.closest('.section');
                    if (confirm('¿Estás seguro de que quieres eliminar esta sección?')) {
                            section.remove();
                            showNotification('Sección eliminada', 'warning');
                        }
                    });
                });
            }
            
            function setupDeleteCardButtons() {
                document.querySelectorAll('.delete-card-btn').forEach(btn => {
                    // Eliminar event listeners existentes para evitar duplicados
                    btn.replaceWith(btn.cloneNode(true));
                });
                
                document.querySelectorAll('.delete-card-btn').forEach(btn => {
                    btn.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        const card = this.closest('.feature-card, .tech-card, .block-card');
                        if (confirm('¿Estás seguro de que quieres eliminar esta tarjeta?')) {
                            card.remove();
                            showNotification('Tarjeta eliminada', 'warning');
                        }
                    });
                });
            }
            
            function showNotification(message, type) {
                notification.textContent = message;
                notification.className = 'notification';
                notification.classList.add(type, 'show');
                
                setTimeout(() => {
                    notification.classList.remove('show');
                }, 3000);
            }

            function exportData() {
                // Obtener el HTML actual del contenedor, no solo del localStorage
                const currentHTML = editableContainer.innerHTML;
                
                const projectData = {
                    anteproyectoHTML: currentHTML, // Usar el HTML actual en lugar del localStorage
                    metadata: {
                        exportDate: new Date().toISOString(),
                        version: '1.0'
                    }
                };

                // Crear JSON
                const jsonData = JSON.stringify(projectData, null, 2);
                
                // Crear archivo descargable
                const blob = new Blob([jsonData], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `anteproyecto-${new Date().toISOString().split('T')[0]}.json`;
                
                // Trigger descarga
                document.body.appendChild(a);
                a.click();
                
                // Limpiar
                setTimeout(() => {
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }, 100);

                showNotification('Datos exportados correctamente', 'success');
            }

            function importData(event) {
                const fileInput = event.target;
                const file = fileInput.files[0];
                
                if (!file) {
                    showNotification('No se seleccionó ningún archivo', 'warning');
                    return;
                }

                const reader = new FileReader();
                
                reader.onload = function(e) {
                    try {
                        const jsonData = JSON.parse(e.target.result);
                        
                        if (!jsonData.anteproyectoHTML) {
                            throw new Error('El archivo no contiene datos válidos del anteproyecto');
                        }

                        if (confirm('¿Importar estos datos? Se perderán los cambios no guardados.')) {
                            // Limpiar el input de archivo
                            fileInput.value = '';
                            
                            // Actualizar el localStorage y el DOM
                            localStorage.setItem('anteproyectoHTML', jsonData.anteproyectoHTML);
                            document.getElementById('editableContainer').innerHTML = jsonData.anteproyectoHTML;
                            
                            // Reconfigurar eventos según el modo actual
                            if (editMode) {
                                enableEditMode();
                            } else {
                                disableEditMode();
                            }
                            
                            showNotification('Datos importados correctamente', 'success');
                        }
                    } catch (error) {
                        console.error('Error al importar:', error);
                        showNotification('Error al importar: ' + error.message, 'warning');
                    }
                };
                
                reader.onerror = function() {
                    showNotification('Error al leer el archivo', 'warning');
                };
                
                reader.readAsText(file);
            }

            /**
             * Calcula un hash simple para detectar cambios
             */
            function hashString(str) {
                let hash = 0;
                for (let i = 0; i < str.length; i++) {
                    const char = str.charCodeAt(i);
                    hash = (hash << 5) - hash + char;
                    hash |= 0;
                }
                return hash;
            }

            /**
             * Configura el auto-guardado periódico
             */
            function setupAutoSave() {
                if (autoSaveInterval) clearInterval(autoSaveInterval);
                autoSaveInterval = setInterval(() => {
                    if (changeDetected) {
                        saveToServer();
                    }
                }, 60000); // 1 minuto
            }

            /**
             * Crea el elemento de estado de guardado
             */
            function createSaveStatusElement() {
                const statusElement = document.createElement('div');
                statusElement.id = 'save-status';
                Object.assign(statusElement.style, {
                    position: 'fixed', 
                    bottom: '10px', 
                    left: '10px',
                    padding: '5px 10px', 
                    background: '#4361ee',
                    color: 'white', 
                    borderRadius: '4px', 
                    zIndex: '1000'
                });
                document.body.appendChild(statusElement);
                return statusElement;
            }

            /**
             * Configura el drag and drop para un elemento específico
             */
            function setupDragAndDropForElement(element) {
                element.setAttribute('draggable', 'true');
                
                element.addEventListener('dragstart', function(e) {
                    draggedItem = this;
                    setTimeout(() => {
                        this.classList.add('dragging');
                    }, 0);
                    
                    e.dataTransfer.setData('text/plain', this.dataset.id);
                    e.dataTransfer.effectAllowed = 'move';
                });
                
                element.addEventListener('dragend', function() {
                    this.classList.remove('dragging');
                    draggedItem = null;
                });
            }

            /**
             * Configura la detección de cambios con debounce
             */
            function setupChangeDetection() {
                const debouncedSave = debounce(() => {
                    changeDetected = true;
                    saveToServer();
                }, 2000);
                
                if (window.MutationObserver) {
                    new MutationObserver(debouncedSave).observe(editableContainer, {
                        childList: true, 
                        subtree: true, 
                        characterData: true, 
                        attributes: true
                    });
                } else {
                    editableContainer.addEventListener('input', debouncedSave, true);
                }
            }

            /**
             * Función debounce para optimizar guardados
             */
            function debounce(func, delay) {
                let timeout;
                return function() {
                    clearTimeout(timeout);
                    timeout = setTimeout(func, delay);
                };
            }
            
            // Asignar eventos a los botones principales
            if (addFeatureCardBtn) {
                addFeatureCardBtn.addEventListener('click', addNewFeatureCard);
                console.log("Evento asignado a addFeatureCard");
            } else {
                console.log("No se encontró addFeatureCard");
            }

            if (addTechCardBtn) {
                addTechCardBtn.addEventListener('click', addNewTechCard);
                console.log("Evento asignado a addTechCard");
            } else {
                console.log("No se encontró addTechCard");
            }

            // Cerrar paletas al hacer clic fuera
            document.addEventListener('click', function(e) {
                if (!e.target.closest('.change-color-btn') && !e.target.closest('.color-palette')) {
                    document.querySelectorAll('.color-palette').forEach(palette => {
                        palette.classList.remove('show-palette');
                    });
                }
                
                if (!e.target.closest('.change-card-color-btn') && !e.target.closest('.card-color-palette')) {
                    document.querySelectorAll('.card-color-palette').forEach(palette => {
                        palette.classList.remove('show-palette');
                    });
                }
            });
            
            // Delegación de eventos para los botones principales
            document.addEventListener('click', function(e) {
                if (e.target && e.target.id === 'addFeatureCard') {
                    addNewFeatureCard();
                }
                
                if (e.target && e.target.id === 'addTechCard') {
                    addNewTechCard();
                }
            });

            // Asignar eventos a los botones de añadir elementos de lista
            document.querySelectorAll('.add-list-item').forEach(btn => {
                btn.addEventListener('click', addNewListItem);
            });

            // Asegurarse de que los controles estén ocultos al inicio
            disableEditMode();
            // Inicialización final
            createSaveStatusElement();
            updateLastSavedTime();
    });
