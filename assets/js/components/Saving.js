export const Saving = {
    async savePDF(editor, fileName) {
        try {
            const bufferCopy = editor.pdfDestBytes.slice(0);
            const doc = await PDFLib.PDFDocument.load(bufferCopy);
            const form = doc.getForm();
            const pages = doc.getPages();
            for (const f of editor.pendingFields) {
                const page = pages[f.page - 1];
                if (f.type === 'text') {
                    const field = form.createTextField(f.name);
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
                    const field = form.createCheckBox(f.name);
                    field.addToPage(page, { x: f.x, y: f.y, width: f.w, height: f.h });
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
