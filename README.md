# PDF Editor Pro 📄🖋️

**PDF Editor Pro** es una herramienta web interactiva y potente diseñada para editar formularios PDF de manera visual. Permite a los usuarios cargar un documento base y añadir campos de texto o checkboxes, ya sea clonándolos de una plantilla existente o dibujándolos manualmente sobre el documento.

La herramienta está disponible para su uso inmediato en: **[https://apppdf.ideasypruebas2.es](https://apppdf.ideasypruebas2.es)**

---

## ✨ Funcionalidades Principales

-   **🎯 Clonación de Campos:** Carga un PDF como plantilla y clona sus campos de formulario directamente en tu documento de destino manteniendo sus dimensiones originales.
-   **✍️ Dibujo Manual:** Utiliza el ratón para dibujar nuevos campos de texto o checkboxes en cualquier lugar del documento.
-   **🖱️ Interacción Intuitiva:** Arrastra para mover los campos y utiliza los manejadores para redimensionarlos visualmente.
-   **🖱️ Selección y Edición Grupal:** Selecciona múltiples campos (usando `Shift + Clic`) para moverlos, alinearlos o distribuirlos uniformemente. Edita propiedades como fuente y alineación de todo el grupo simultáneamente (el ID se bloquea en edición grupal).
-   **👯 Clonación de Campos:** Clona rápidamente los elementos seleccionados para crear duplicados instantáneos y moverlos en bloque.
-   **🆔 Edición de IDs:** Haz doble clic en cualquier campo para cambiar su identificador técnico.
-   **📱 Soporte PWA:** Instalable en dispositivos móviles y escritorio para un acceso rápido y funcional.
-   **💾 Exportación Directa:** Genera y descarga el nuevo PDF con todos los campos incrustados técnicamente mediante `pdf-lib`.

---

## 🚀 Tecnologías Utilizadas

-   **[pdf-lib](https://pdf-lib.js.org/):** Para la manipulación y generación de documentos PDF en el lado del cliente.
-   **[PDF.js](https://mozilla.github.io/pdf.js/):** Para el renderizado de alta fidelidad de los documentos en el navegador.
-   **Vanilla JS (ES6+):** Lógica encapsulada en clases para un rendimiento óptimo sin dependencias pesadas.
-   **CSS3 Custom Properties:** Diseño moderno y responsive con soporte para temas.

---

## 🛠️ Instalación y Uso Local

1.  Clona este repositorio.
2.  Abre `index.html` en tu navegador preferido (se recomienda un servidor local para el correcto funcionamiento del Service Worker).
3.  ¡Empieza a editar tus PDFs!

---

## 📄 Licencia

Este proyecto está bajo la [Licencia MIT](LICENSE).

&copy; 2026 Manuel Cárdenas Thorlund - [nuevasideas.es](https://nuevasideas.es)
