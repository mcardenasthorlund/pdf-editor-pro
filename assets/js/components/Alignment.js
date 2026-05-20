export const Alignment = {
    alignSelected(editor, type) {
        if (editor.selectedFields.length < 2) return;
        const fields = editor.selectedFields.map(idx => editor.pendingFields[idx]);
        if (type === 'left') {
            const minX = Math.min(...fields.map(f => f.x));
            fields.forEach(f => f.x = minX);
        } else if (type === 'center') {
            const centerX = fields.reduce((sum, f) => sum + f.x + f.w/2, 0) / fields.length;
            fields.forEach(f => f.x = centerX - f.w/2);
        } else if (type === 'right') {
            const maxX = Math.max(...fields.map(f => f.x + f.w));
            fields.forEach(f => f.x = maxX - f.w);
        }
        editor.render();
    },

    distributeSelected(editor) {
        if (editor.selectedFields.length < 3) return;
        
        const fields = editor.selectedFields.map(idx => editor.pendingFields[idx])
            .sort((a, b) => (b.y + b.h) - (a.y + a.h));
        
        const topField = fields[0];
        const bottomField = fields[fields.length - 1];
        
        const totalSpace = (topField.y) - (bottomField.y + bottomField.h);
        const totalFieldHeight = fields.slice(1, -1).reduce((sum, f) => sum + f.h, 0);
        const gap = (totalSpace - totalFieldHeight) / (fields.length - 1);
        
        let nextY = topField.y - gap;
        for (let i = 1; i < fields.length - 1; i++) {
            fields[i].y = nextY - fields[i].h;
            nextY = fields[i].y - gap;
        }
        
        editor.render();
    }
};
