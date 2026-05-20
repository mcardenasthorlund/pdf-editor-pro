export const Saving = {
    async savePDF(editor, fileName) {
        try {
            const bufferCopy = editor.pdfDestBytes.slice(0);
            const doc = await PDFLib.PDFDocument.load(bufferCopy);
            const form = doc.getForm();
            
            // Eliminar campos existentes para recrearlos con las modificaciones del editor
            const existingFields = form.getFields();
            existingFields.forEach(ef => {
                try { form.removeField(ef); } catch(e) {}
            });

            const pages = doc.getPages();
            const PDFName = PDFLib.PDFName;

            for (const f of editor.pendingFields) {
                const page = pages[f.page - 1];
                let field;
                if (f.type === 'text') {
                    field = form.createTextField(f.name);
                    field.addToPage(page, { x: f.x, y: f.y, width: f.w, height: f.h });
                    
                    if (f.autoFit) {
                        field.setFontSize(0);
                    } else if (f.fontSize) {
                        field.setFontSize(f.fontSize);
                    }

                    if (f.alignment) {
                        const alignMap = {
                            'left': PDFLib.TextAlignment.Left,
                            'center': PDFLib.TextAlignment.Center,
                            'right': PDFLib.TextAlignment.Right
                        };
                        field.setAlignment(alignMap[f.alignment] || PDFLib.TextAlignment.Left);
                    }
                } else {
                    field = form.createCheckBox(f.name);
                    field.addToPage(page, { x: f.x, y: f.y, width: f.w, height: f.h });
                }

                // MANIPULACIÓN DE BAJO NIVEL PARA QUITAR BORDES DEFINITIVAMENTE
                try {
                    const widgets = field.acroField.getWidgets();
                    widgets.forEach((widget) => {
                        const dict = widget.dict;
                        
                        // 1. Eliminar Border Style y Border
                        dict.delete(PDFName.of('BS'));
                        dict.delete(PDFName.of('Border'));
                        
                        // 2. Limpiar MK (Appearance Characteristics)
                        const mk = dict.get(PDFName.of('MK'));
                        if (mk instanceof PDFLib.PDFDictionary) {
                            mk.delete(PDFName.of('BC')); // Border Color
                            mk.set(PDFName.of('W'), doc.context.obj(0)); // Width 0
                        }

                        // 3. Forzar flags (opcional, pero ayuda)
                        // Limpiar el bit de borde si existe en algún flag extendido
                    });
                    
                    // Asegurar métodos de alto nivel también
                    if (typeof field.setBorderWidth === 'function') field.setBorderWidth(0);
                    if (typeof field.setBorderColor === 'function') field.setBorderColor(undefined);
                } catch(e) {
                    console.warn("Error en manipulación de bajo nivel:", e);
                }
            }
            
            const bytes = await doc.save();
            const blob = new Blob([bytes], { type: 'application/pdf' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } catch (err) {
            alert("Error: " + err.message);
        }
    }
};
