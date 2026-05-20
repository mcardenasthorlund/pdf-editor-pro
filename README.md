# PDF Editor Pro 📄🖋️

**PDF Editor Pro** es una herramienta web interactiva y potente diseñada para editar formularios PDF de manera visual. Permite a los usuarios cargar un documento base y gestionar sus campos de formulario de forma intuitiva, ya sea editando los existentes, clonándolos de una plantilla o dibujándolos manualmente.

La herramienta está disponible para su uso inmediato en: **[https://apppdf.ideasypruebas2.es](https://apppdf.ideasypruebas2.es)**

---

## ✨ Funcionalidades Principales

-   **📝 Modo Edición Completa:** Carga cualquier PDF con campos de formulario existentes y edítalos directamente. El sistema extrae automáticamente nombres, posiciones, tamaños y estilos para que puedas moverlos, redimensionarlos o eliminarlos.
-   **🎯 Clonación de Plantillas:** Carga un PDF adicional como plantilla y clona sus campos en tu documento de destino manteniendo las dimensiones originales.
-   **✍️ Dibujo Manual:** Utiliza el ratón para dibujar nuevos campos de texto o checkboxes en cualquier lugar del documento.
-   **⌨️ Movimiento de Precisión:** Ajusta la posición de los campos seleccionados píxel a píxel usando las flechas del teclado (o de 5 en 5 píxeles manteniendo `Shift`).
-   **📏 Herramientas de Dimensionado:** Nuevos controles para igualar el ancho, el alto o ambas dimensiones de todos los campos seleccionados respecto al primero.
-   **🖱️ Selección y Edición Grupal:** Selecciona múltiples campos (usando `Shift + Clic`) para moverlos, alinearlos o distribuirlos uniformemente. Edita propiedades como fuente y alineación de todo el grupo simultáneamente.
-   **📐 Redimensionamiento Avanzado:** Manejadores en los 8 puntos para ajustes precisos con sincronización grupal.
-   **👯 Clonación Rápida:** Duplica instantáneamente los elementos seleccionados para crear formularios repetitivos en segundos.
-   **🆔 Gestión de IDs:** Doble clic en cualquier campo para cambiar su identificador técnico.
-   **🚫 Campos sin Bordes:** Los PDFs generados incluyen campos interactivos totalmente funcionales pero sin bordes visibles para una estética más limpia y profesional.
-   **💾 Guardado Flexible:** Personaliza el nombre del archivo antes de exportar el resultado final.
-   **📱 Soporte PWA:** Instalable en dispositivos móviles y escritorio para un acceso rápido y funcional sin conexión.

---

## 🚀 Tecnologías Utilizadas

-   **[pdf-lib](https://pdf-lib.js.org/):** Para la manipulación y generación de documentos PDF en el lado del cliente (incluyendo manipulación de bajo nivel de diccionarios).
-   **[PDF.js](https://mozilla.github.io/pdf.js/):** Para el renderizado de alta fidelidad de los documentos en el navegador.
-   **Vanilla JS (ES6+):** Arquitectura modular basada en componentes para facilitar el mantenimiento y la extensibilidad.
-   **CSS3 Custom Properties:** Diseño moderno y fluido con interfaz optimizada para evitar parpadeos durante la edición.

---

## 🛠️ Instalación y Uso Local

1.  Clona este repositorio.
2.  Abre `index.html` en tu navegador preferido.
3.  ¡Empieza a editar tus PDFs de forma profesional!

---

## 📄 Licencia

Este proyecto está bajo la [Licencia MIT](LICENSE).

&copy; 2026 Manuel Cárdenas Thorlund - [nuevasideas.es](https://nuevasideas.es)
