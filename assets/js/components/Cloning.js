export const Cloning = {
    cloneSelected(editor) {
        if (editor.selectedFields.length === 0) return;
        
        const newSelected = [];
        editor.selectedFields.forEach(idx => {
            const f = editor.pendingFields[idx];
            const clone = { ...f, name: f.name + '_copy', x: f.x + 10, y: f.y - 10 };
            editor.pendingFields.push(clone);
            newSelected.push(editor.pendingFields.length - 1);
        });
        
        editor.selectedFields = newSelected;
        editor.updateSidebar();
        editor.render();
    }
};
