import { Alignment } from './components/Alignment.js';
import { Cloning } from './components/Cloning.js';
import { EditorModal } from './components/EditorModal.js';
import { Saving } from './components/Saving.js';
import { Resizing } from './components/Resizing.js';

class PDFEditor {
    constructor() {
        this.pdfDestBytes = null;
        this.pdfDestJS = null;
        this.currentPage = 1;
        this.totalPages = 0;
        this.scale = 1.5;
        this.pendingFields = [];
        this.selectedFields = [];
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

    // ... initElements, initEventListeners ...

    performSave() {
        const fileName = this.elements.saveFileName.value || 'PDF_Editado.pdf';
        Saving.savePDF(this, fileName);
        this.elements.saveModal.style.display = 'none';
    }

    // Métodos delegados
    alignSelected(type) { Alignment.alignSelected(this, type); }
    distributeSelected() { Alignment.distributeSelected(this); }
    matchSize(dim) { Resizing.matchSize(this, dim); }
    cloneSelected() { Cloning.cloneSelected(this); }
    openModal(idx) { EditorModal.openModal(this, idx); }
    closeModal() { EditorModal.closeModal(this); }
    saveModalChanges() { EditorModal.saveModalChanges(this); }
    savePDF() { Saving.savePDF(this); }

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
            saveModal: document.getElementById('saveModal'),
            saveFileName: document.getElementById('saveFileName'),
            modalInputName: document.getElementById('modalInputName'),
            modalFontSize: document.getElementById('modalFontSize'),
            modalAutoFit: document.getElementById('modalAutoFit'),
            modalAlignment: document.getElementById('modalAlignment'),
            textOptions: document.getElementById('textOptions'),
            manualName: document.getElementById('manualName'),
            manualType: document.getElementById('manualType')
        };
    }

    initEventListeners() {
        this.elements.fileDest.onchange = (e) => this.handleFileDest(e);
        this.elements.fileSource.onchange = (e) => this.handleFileSource(e);
        this.elements.prevBtn.onclick = () => this.prevPage();
        this.elements.nextBtn.onclick = () => this.nextPage();
        this.elements.saveBtn.onclick = () => this.elements.saveModal.style.display = 'flex';

        this.elements.overlayLayer.onmousedown = (e) => this.startDrawing(e);
        window.onmousemove = (e) => {
            this.handleDrawing(e);
            this.handleGlobalMouseMove(e);
        };
        window.onmouseup = (e) => {
            this.stopDrawing(e);
            this.stopGlobalInteraction();
        };
        window.onkeydown = (e) => this.handleKeyDown(e);
    }

    handleKeyDown(e) {
        if (this.selectedFields.length === 0) return;
        
        const arrows = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
        if (!arrows.includes(e.key)) return;

        // Evitar scroll de la página al usar flechas si hay campos seleccionados
        e.preventDefault();

        const step = e.shiftKey ? 5 : 1;
        
        this.selectedFields.forEach(idx => {
            const f = this.pendingFields[idx];
            if (e.key === 'ArrowUp') f.y += step;
            if (e.key === 'ArrowDown') f.y -= step;
            if (e.key === 'ArrowLeft') f.x -= step;
            if (e.key === 'ArrowRight') f.x += step;
        });
        
        this.render();
    }

    async handleFileDest(e) {
        const file = e.target.files[0];
        if (!file) return;
        this.pdfDestBytes = await file.arrayBuffer();
        
        // Cargar para extracción de campos existentes (Modo Edición)
        try {
            const pdfDoc = await PDFLib.PDFDocument.load(this.pdfDestBytes);
            const form = pdfDoc.getForm();
            const fields = form.getFields();
            
            this.pendingFields = [];
            fields.forEach(field => {
                const name = field.getName();
                let techType = 'text';
                if (field instanceof PDFLib.PDFCheckBox) techType = 'checkbox';
                else if (field instanceof PDFLib.PDFTextField) techType = 'text';
                
                const widgets = field.acroField.getWidgets();
                if (widgets.length > 0) {
                    const widget = widgets[0];
                    const rect = widget.getRectangle();
                    const pageNum = pdfDoc.getPages().findIndex(p => p.ref === widget.P()) + 1 || 1;
                    
                    let fontSize = 0;
                    let alignment = 'left';
                    if (field instanceof PDFLib.PDFTextField) {
                        try { fontSize = field.getFontSize() || 0; } catch(e) {}
                        try {
                            const quadding = field.acroField.getQuadding();
                            if (quadding === 1) alignment = 'center';
                            else if (quadding === 2) alignment = 'right';
                        } catch(e) {}
                    }

                    this.pendingFields.push({
                        page: pageNum, x: rect.x, y: rect.y, w: rect.width, h: rect.height,
                        name, type: techType, fontSize, autoFit: fontSize === 0, alignment
                    });
                }
            });
            this.updateSidebar();
        } catch (err) {
            console.error("Error al extraer campos:", err);
        }

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
                this.pendingFields.push({ 
                    page: sf.page, x: sf.rect.x, y: sf.rect.y, w: sf.rect.w, h: sf.rect.h, 
                    name: sf.name, type: sf.techType,
                    fontSize: 0, autoFit: true, alignment: 'left'
                });
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

        overlay.onmousedown = (e) => {
            if (e.target === overlay) {
                this.clearSelection();
                this.startDrawing(e);
            }
        };

        this.pendingFields.filter(f => f.page === this.currentPage).forEach((f, idx) => {
            const realIdx = this.pendingFields.indexOf(f);
            const el = document.createElement('div');
            el.className = 'placed-field' + (this.selectedFields.includes(realIdx) ? ' selected' : '');
            const [x, y, x2, y2] = viewport.convertToViewportRectangle([f.x, f.y, f.x + f.w, f.y + f.h]);
            el.style.left = x + 'px';
            el.style.top = Math.min(y, y2) + 'px';
            el.style.width = Math.abs(x2 - x) + 'px';
            el.style.height = Math.abs(y2 - y) + 'px';
            el.textContent = f.name;

            if (this.selectedFields.includes(realIdx)) {
                ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'].forEach(pos => {
                    const handle = document.createElement('div');
                    handle.className = 'resize-handle handle-' + pos;
                    handle.onmousedown = (e) => {
                        e.stopPropagation();
                        this.startInteraction('resize-' + pos, realIdx, e, f);
                    };
                    el.appendChild(handle);
                });
            }

            el.onmousedown = (e) => {
                e.stopPropagation();
                if (e.shiftKey) this.toggleSelection(realIdx);
                else if (!this.selectedFields.includes(realIdx)) {
                    this.selectedFields = [realIdx];
                    this.drawOverlays(pdfPageJS);
                }
                if (!e.target.classList.contains('resize-handle')) this.startInteraction('move', realIdx, e, f);
            };
            el.ondblclick = (e) => { e.stopPropagation(); this.openModal(realIdx); };
            overlay.appendChild(el);
        });
    }

    toggleSelection(idx) {
        const i = this.selectedFields.indexOf(idx);
        if (i > -1) this.selectedFields.splice(i, 1);
        else this.selectedFields.push(idx);
        this.render();
    }

    clearSelection() {
        this.selectedFields = [];
        this.render();
    }

    startInteraction(type, index, e, field) {
        this.activeInteraction = { type, fieldIndex: index, startX: e.clientX, startY: e.clientY, initialRect: { ...field } };
    }

    async handleGlobalMouseMove(e) {
        if (!this.activeInteraction) return;
        const dx = (e.clientX - this.activeInteraction.startX) / this.scale;
        const dy = (e.clientY - this.activeInteraction.startY) / this.scale;
        
        // Actualizar referencia de inicio para el próximo evento de movimiento
        this.activeInteraction.startX = e.clientX;
        this.activeInteraction.startY = e.clientY;

        const field = this.pendingFields[this.activeInteraction.fieldIndex];
        const isGroup = this.selectedFields.includes(this.activeInteraction.fieldIndex);
        const group = isGroup ? this.selectedFields.map(idx => this.pendingFields[idx]) : [field];
        
        if (this.activeInteraction.type === 'move') {
            // Mover el campo actual
            field.x += dx;
            field.y -= dy;
            
            // Mover todos los seleccionados si el actual es parte de la selección
            if (this.selectedFields.includes(this.activeInteraction.fieldIndex)) {
                this.selectedFields.forEach(idx => {
                    if (idx !== this.activeInteraction.fieldIndex) {
                        this.pendingFields[idx].x += dx;
                        this.pendingFields[idx].y -= dy;
                    }
                });
            }
        } else if (this.activeInteraction.type.startsWith('resize-')) {
            const pos = this.activeInteraction.type.split('-')[1];
            group.forEach(f => {
                // Resize lateral
                if (pos.includes('e')) f.w = Math.max(10, f.w + dx);
                if (pos.includes('w')) { f.w = Math.max(10, f.w - dx); f.x += dx; }
                
                // Resize vertical (invirtiendo dy porque el eje Y crece hacia arriba en PDF)
                if (pos.includes('s')) { f.h = Math.max(10, f.h + dy); f.y -= dy; }
                if (pos.includes('n')) { f.h = Math.max(10, f.h - dy); }
            });
        }
        
        this.updateOverlays();
    }

    stopGlobalInteraction() {
        if (!this.activeInteraction) return;
        this.activeInteraction = null;
        this.updateSidebar();
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
            type: this.elements.manualType.value,
            fontSize: this.elements.manualType.value === 'text' ? 0 : 12,
            autoFit: this.elements.manualType.value === 'text' ? true : false,
            alignment: 'left'
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
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.pdfEditor = new PDFEditor();
});
