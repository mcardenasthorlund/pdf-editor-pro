export const EditorModal = {
    openModal(editor, index) {
        editor.editingFieldIndex = index;
        const field = editor.pendingFields[index];
        const isGroup = editor.selectedFields.length > 1;
        
        let warning = document.getElementById('modalWarning');
        if (!warning) {
            warning = document.createElement('div');
            warning.id = 'modalWarning';
            warning.style.cssText = "color: #d93025; font-size: 12px; font-weight: bold; margin-bottom: 10px; display: none;";
            warning.textContent = "⚠ Estás editando un grupo. Los cambios afectarán a todos los elementos seleccionados. El ID no se modificará.";
            editor.elements.editModal.querySelector('.modal-content').insertBefore(warning, editor.elements.editModal.querySelector('.field-group'));
        }
        warning.style.display = isGroup ? 'block' : 'none';

        editor.elements.modalInputName.value = isGroup ? '' : field.name;
        editor.elements.modalInputName.disabled = isGroup;
        editor.elements.modalInputName.placeholder = isGroup ? 'Edición de ID deshabilitada en grupo' : '';
        
        if (field.type === 'text') {
            editor.elements.textOptions.style.display = 'block';
            editor.elements.modalFontSize.value = field.fontSize || 12;
            editor.elements.modalAutoFit.checked = !!field.autoFit;
            editor.elements.modalAlignment.value = field.alignment || 'left';
        } else {
            editor.elements.textOptions.style.display = 'none';
        }
        
        editor.elements.editModal.style.display = 'flex';
    },

    saveModalChanges(editor) {
        if (editor.editingFieldIndex !== null) {
            const fieldsToUpdate = editor.selectedFields.includes(editor.editingFieldIndex) 
                ? editor.selectedFields.map(idx => editor.pendingFields[idx]) 
                : [editor.pendingFields[editor.editingFieldIndex]];

            fieldsToUpdate.forEach(field => {
                const newName = editor.elements.modalInputName.value.trim();
                if (newName) field.name = newName;
                
                if (field.type === 'text') {
                    field.fontSize = parseInt(editor.elements.modalFontSize.value) || 12;
                    field.autoFit = editor.elements.modalAutoFit.checked;
                    field.alignment = editor.elements.modalAlignment.value;
                }
            });
            
            editor.updateSidebar();
            editor.pdfDestJS.getPage(editor.currentPage).then(page => editor.drawOverlays(page));
        }
        this.closeModal(editor);
    },

    closeModal(editor) {
        editor.elements.editModal.style.display = 'none';
    }
};
