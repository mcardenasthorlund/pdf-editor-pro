class PDFEditor {
    constructor() {
        this.pdfDestBytes = null;
        this.pdfDestJS = null;
        this.currentPage = 1;
        this.totalPages = 0;
        this.scale = 1.5;
        this.pendingFields = [];
        this.sourceFields = [];
        this.editingFieldIndex = null;
        this.activeInteraction = null;
        this.drawing = false;
        this.drawStartX = 0;
        this.drawStartY = 0;

        this.initElements();
        this.initEventListeners();
        
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }

    initElements() {
        this.elements = {
            fileDest: document.getElementById('fileDest'),
            fileSource: document.getElementById('fileSource'),
            prevBtn: document.getElementById('prev'),
            nextBtn: document.getElementById('next'),
            saveBtn: document.getElementById('saveBtn'),
            pageInfo: document.getElementById('pageInfo'),
            canvasWrapper: document.getElementById('canvasWrapper'),
            pdfCanvas: document.getElementById('pdfCanvas'),
            overlayLayer: document.getElementById('overlayLayer'),
            tempDraw: document.getElementById('tempDraw'),
            msg: document.getElementById('msg'),
            sourceFieldsArea: document.getElementById('sourceFieldsArea'),
            sourceFieldsList: document.getElementById('sourceFieldsList'),
            targetFieldsList: document.getElementById('targetFieldsList'),
            editModal: document.getElementById('editModal'),
            modalInputName: document.getElementById('modalInputName'),
            manualName: document.getElementById('manualName'),
            manualType: document.getElementById('manualType')
        };
    }

    initEventListeners() {
        this.elements.fileDest.onchange = (e) => this.handleFileDest(e);
        this.elements.fileSource.onchange = (e) => this.handleFileSource(e);
        this.elements.prevBtn.onclick = () => this.prevPage();
        this.elements.nextBtn.onclick = () => this.nextPage();
        this.elements.saveBtn.onclick = () => this.savePDF();

        this.elements.overlayLayer.onmousedown = (e) => this.startDrawing(e);
        window.onmousemove = (e) => {
            this.handleDrawing(e);
            this.handleGlobalMouseMove(e);
        };
        window.onmouseup = (e) => {
            this.stopDrawing(e);
            this.stopGlobalInteraction();
        };
    }

    async handleFileDest(e) {
        const file = e.target.files[0];
        if (!file) return;
        this.pdfDestBytes = await file.arrayBuffer();
        this.pdfDestJS = await pdfjsLib.getDocument({ data: this.pdfDestBytes.slice(0) }).promise;
        this.totalPages = this.pdfDestJS.numPages;
        this.currentPage = 1;
        this.elements.canvasWrapper.style.display = 'block';
        this.elements.msg.style.display = 'none';
        this.elements.saveBtn.disabled = false;
        this.render();
    }

    async handleFileSource(e) {
        const file = e.target.files[0];
        if (!file) return;
        const bytes = await file.arrayBuffer();
        const pdfDoc = await PDFLib.PDFDocument.load(bytes);
        const form = pdfDoc.getForm();
        const fields = form.getFields();

        this.sourceFields = [];
        fields.forEach(field => {
            const name = field.getName();
            let typeLabel = 'Texto', techType = 'text';
            if (field instanceof PDFLib.PDFCheckBox) { typeLabel = 'Checkbox'; techType = 'checkbox'; }
            else if (field instanceof PDFLib.PDFTextField) { typeLabel = 'Texto'; techType = 'text'; }

            const widgets = field.acroField.getWidgets();
            if (widgets.length > 0) {
                const rect = widgets[0].getRectangle();
                const pageNum = pdfDoc.getPages().findIndex(p => p.ref === widgets[0].P()) + 1 || 1;
                this.sourceFields.push({ name, typeLabel, techType, page: pageNum, rect: { x: rect.x, y: rect.y, w: rect.width, h: rect.height } });
            }
        });
        this.elements.sourceFieldsArea.style.display = 'block';
        this.updateSourceSidebar();
    }

    updateSourceSidebar() {
        const list = this.elements.sourceFieldsList;
        list.innerHTML = '';
        const available = this.sourceFields.filter(sf => sf.page === this.currentPage && !this.pendingFields.some(pf => pf.name === sf.name));
        if (available.length === 0) {
            list.innerHTML = '<p style="font-size:11px; color:#999;">No hay campos pendientes en esta página.</p>';
            return;
        }

        available.forEach(sf => {
            const card = document.createElement('div');
            card.className = 'source-field-card';
            card.innerHTML = `<b>${sf.name}</b> <span class="badge">${sf.typeLabel}</span>`;
            card.onclick = () => {
                this.pendingFields.push({ page: sf.page, x: sf.rect.x, y: sf.rect.y, w: sf.rect.w, h: sf.rect.h, name: sf.name, type: sf.techType });
                this.updateSourceSidebar();
                this.updateSidebar();
                this.render();
            };
            list.appendChild(card);
        });
    }

    async render() {
        if (!this.pdfDestJS) return;
        const page = await this.pdfDestJS.getPage(this.currentPage);
        const viewport = page.getViewport({ scale: this.scale });
        const canvas = this.elements.pdfCanvas;
        const ctx = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: ctx, viewport: viewport }).promise;
        this.elements.pageInfo.textContent = `Pág: ${this.currentPage} / ${this.totalPages}`;
        this.drawOverlays(page);
        this.updateSourceSidebar();
    }

    drawOverlays(pdfPageJS) {
        const overlay = this.elements.overlayLayer;
        overlay.innerHTML = '';
        const viewport = pdfPageJS.getViewport({ scale: this.scale });

        this.pendingFields.filter(f => f.page === this.currentPage).forEach((f, idx) => {
            const realIdx = this.pendingFields.indexOf(f);
            const el = document.createElement('div');
            el.className = 'placed-field';
            const [x, y, x2, y2] = viewport.convertToViewportRectangle([f.x, f.y, f.x + f.w, f.y + f.h]);
            el.style.left = x + 'px';
            el.style.top = Math.min(y, y2) + 'px';
            el.style.width = Math.abs(x2 - x) + 'px';
            el.style.height = Math.abs(y2 - y) + 'px';
            el.textContent = f.name;

            const handle = document.createElement('div');
            handle.className = 'resize-handle';
            el.onmousedown = (e) => {
                e.stopPropagation();
                if (e.target === handle) this.startInteraction('resize', realIdx, e, f);
                else this.startInteraction('move', realIdx, e, f);
            };
            el.ondblclick = (e) => {
                e.stopPropagation();
                this.openModal(realIdx);
            };
            el.appendChild(handle);
            overlay.appendChild(el);
        });
    }

    startInteraction(type, index, e, field) {
        this.activeInteraction = { type, fieldIndex: index, startX: e.clientX, startY: e.clientY, initialRect: { ...field } };
    }

    async handleGlobalMouseMove(e) {
        if (!this.activeInteraction) return;
        const dx = (e.clientX - this.activeInteraction.startX) / this.scale;
        const dy = (e.clientY - this.activeInteraction.startY) / this.scale;
        const field = this.pendingFields[this.activeInteraction.fieldIndex];
        const initial = this.activeInteraction.initialRect;
        if (this.activeInteraction.type === 'move') {
            field.x = initial.x + dx;
            field.y = initial.y - dy;
        } else if (this.activeInteraction.type === 'resize') {
            field.w = Math.max(10, initial.w + dx);
            field.h = Math.max(10, initial.h + dy);
            field.y = initial.y - dy;
        }
        const page = await this.pdfDestJS.getPage(this.currentPage);
        this.drawOverlays(page);
    }

    stopGlobalInteraction() {
        if (!this.activeInteraction) return;
        this.activeInteraction = null;
        this.updateSidebar();
    }

    openModal(index) {
        this.editingFieldIndex = index;
        this.elements.modalInputName.value = this.pendingFields[index].name;
        this.elements.editModal.style.display = 'flex';
    }

    closeModal() {
        this.elements.editModal.style.display = 'none';
    }

    saveModalChanges() {
        const newName = this.elements.modalInputName.value.trim();
        if (newName && this.editingFieldIndex !== null) {
            this.pendingFields[this.editingFieldIndex].name = newName;
            this.updateSidebar();
            this.pdfDestJS.getPage(this.currentPage).then(page => this.drawOverlays(page));
        }
        this.closeModal();
    }

    startDrawing(e) {
        if (e.target !== this.elements.overlayLayer) return;
        this.drawing = true;
        const r = this.elements.overlayLayer.getBoundingClientRect();
        this.drawStartX = e.clientX - r.left;
        this.drawStartY = e.clientY - r.top;
        this.elements.tempDraw.style.display = 'block';
        this.elements.tempDraw.style.left = this.drawStartX + 'px';
        this.elements.tempDraw.style.top = this.drawStartY + 'px';
        this.elements.tempDraw.style.width = '0px';
        this.elements.tempDraw.style.height = '0px';
    }

    handleDrawing(e) {
        if (!this.drawing) return;
        const r = this.elements.overlayLayer.getBoundingClientRect();
        const curX = Math.max(0, Math.min(e.clientX - r.left, r.width));
        const curY = Math.max(0, Math.min(e.clientY - r.top, r.height));
        this.elements.tempDraw.style.width = Math.abs(curX - this.drawStartX) + 'px';
        this.elements.tempDraw.style.height = Math.abs(curY - this.drawStartY) + 'px';
        this.elements.tempDraw.style.left = Math.min(curX, this.drawStartX) + 'px';
        this.elements.tempDraw.style.top = Math.min(curY, this.drawStartY) + 'px';
    }

    async stopDrawing(e) {
        if (!this.drawing) return;
        this.drawing = false;
        this.elements.tempDraw.style.display = 'none';
        const wCanvas = parseFloat(this.elements.tempDraw.style.width);
        const hCanvas = parseFloat(this.elements.tempDraw.style.height);
        if (wCanvas < 5 || hCanvas < 5) return;
        
        const page = await this.pdfDestJS.getPage(this.currentPage);
        const viewport = page.getViewport({ scale: this.scale });
        const p1 = viewport.convertToPdfPoint(parseFloat(this.elements.tempDraw.style.left), parseFloat(this.elements.tempDraw.style.top));
        const p2 = viewport.convertToPdfPoint(parseFloat(this.elements.tempDraw.style.left) + wCanvas, parseFloat(this.elements.tempDraw.style.top) + hCanvas);
        
        this.pendingFields.push({
            page: this.currentPage,
            x: Math.min(p1[0], p2[0]),
            y: Math.min(p1[1], p2[1]),
            w: Math.abs(p2[0] - p1[0]),
            h: Math.abs(p2[1] - p1[1]),
            name: this.elements.manualName.value || 'campo_' + Date.now(),
            type: this.elements.manualType.value
        });
        this.elements.manualName.value = '';
        this.updateSidebar();
        this.render();
    }

    updateSidebar() {
        const list = this.elements.targetFieldsList;
        list.innerHTML = '';
        this.pendingFields.forEach((f, i) => {
            const d = document.createElement('div');
            d.style.cssText = "font-size:11px; padding:8px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center;";
            d.innerHTML = `<span><b>${f.name}</b> (P${f.page})</span> <button class="remove-btn" data-index="${i}" style="color:red; background:none; border:none; cursor:pointer; font-size:16px;">✕</button>`;
            d.querySelector('.remove-btn').onclick = () => this.removeField(i);
            list.appendChild(d);
        });
    }

    removeField(i) {
        this.pendingFields.splice(i, 1);
        this.updateSourceSidebar();
        this.updateSidebar();
        this.render();
    }

    prevPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.render();
        }
    }

    nextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.render();
        }
    }

    async savePDF() {
        try {
            const bufferCopy = this.pdfDestBytes.slice(0);
            const doc = await PDFLib.PDFDocument.load(bufferCopy);
            const form = doc.getForm();
            const pages = doc.getPages();
            for (const f of this.pendingFields) {
                const page = pages[f.page - 1];
                if (f.type === 'text') {
                    const field = form.createTextField(f.name);
                    field.addToPage(page, { x: f.x, y: f.y, width: f.w, height: f.h });
                } else {
                    const field = form.createCheckBox(f.name);
                    field.addToPage(page, { x: f.x, y: f.y, width: f.w, height: f.h });
                }
            }
            const bytes = await doc.save();
            const blob = new Blob([bytes], { type: 'application/pdf' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = "PDF_Editado_Completo.pdf";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } catch (err) {
            alert("Error: " + err.message);
        }
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.pdfEditor = new PDFEditor();
});
