export const Resizing = {
    matchSize(editor, dimension) {
        if (editor.selectedFields.length < 2) return;
        
        // El primer campo seleccionado es la referencia
        const referenceField = editor.pendingFields[editor.selectedFields[0]];
        const targetFields = editor.selectedFields.slice(1).map(idx => editor.pendingFields[idx]);
        
        targetFields.forEach(f => {
            if (dimension === 'width' || dimension === 'both') {
                f.w = referenceField.w;
            }
            if (dimension === 'height' || dimension === 'both') {
                // En el sistema de coordenadas del PDF, si cambiamos el alto (h), 
                // debemos ajustar la y para que el campo no se mueva de su base (o techo, dependiendo de la implementación)
                // Aquí mantendremos la esquina inferior izquierda (x, y) fija si es posible, o simplemente igualamos h.
                f.h = referenceField.h;
            }
        });
        
        editor.render();
    }
};
