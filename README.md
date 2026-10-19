# Shabono by Nelson Méndez: sitio web (demo)

Sitio de una sola página para **Shabono by Nelson Méndez**, restaurante de alta cocina de autor en Puerto Ayacucho, estado Amazonas, Venezuela.

Es una **demo**. Todo dato no confirmado aparece **[entre corchetes]** y resaltado en la página. La lista completa está en [`PENDIENTES.md`](PENDIENTES.md).

## Estructura

```
index.html      Página (HTML semántico, Open Graph, JSON-LD)
styles.css      Estilos (mobile-first, paleta en :root)
main.js         Datos de contacto (CONFIG), textos ES/EN (TRADUCCIONES) y funciones
img/            Logo (SVG), favicon, foto del chef, plato destacado, galería e imagen para compartir
fonts/          Playfair Display e Inter (woff2, solo latín, licencia OFL)
_headers        Cabeceras de caché y seguridad para Cloudflare Pages
robots.txt, sitemap.xml
```

Sin frameworks ni proceso de compilación.

## Cómo editar

- **Textos (español e inglés):** `main.js` → `TRADUCCIONES`. Las claves coinciden con los atributos `data-i18n` del HTML. `index.html` lleva una copia del texto en español como respaldo sin JavaScript.
- **WhatsApp y enlace de Google Maps:** `main.js` → `CONFIG`.
- **Mapa insertado y ruta «Cómo llegar»:** directamente en `index.html`, sección Visítanos (el `<iframe>` de Google y el enlace con las coordenadas).
- **Cita del chef:** `TRADUCCIONES.es.chef.cita` y `TRADUCCIONES.en.chef.cita`. Mientras estén vacías, el bloque de la cita no se muestra.
- **Platos destacados y carta completa:** los 6 destacados están en `TRADUCCIONES.*.menu.platos` (nombre, categoría y descripción; si la descripción está vacía, no se muestra). La carta completa está escrita en `index.html` (bloque `carta-completa`); allí se añaden o quitan platos.
- **Menú degustación y avisos de alergias e impuestos:** están ocultos con el atributo `hidden` en `index.html`. Para mostrarlos, quitar `hidden` y completar los textos en `TRADUCCIONES`.
- **Imágenes:** sustituir los archivos de `img/` con el mismo nombre (ver `PENDIENTES.md`).
- **Logo en la página:** las letras están en vector dentro de `index.html` (bloque `sprite` al principio del `<body>`) y la firma dorada es `img/firma.webp`. La barra, la portada y el pie reutilizan ese mismo logo. `img/logo-claro.svg`, `img/logo-oscuro.svg` y `img/logo-nm.svg` quedan para usos externos (redes, prensa). Todo está redibujado a partir de una imagen pequeña del logo; con el archivo original del diseñador se vería más nítido.
- **Portada:** ahora muestra el logo grande sin foto. Cuando llegue la foto de la roca con la cascada, en `index.html` hay un comentario en la portada con el bloque `<picture>` listo para pegar.
- **Fotos de la carta completa:** en escritorio, la columna derecha muestra `img/carta/pollo.webp`, `carnes.webp`, `pescados.webp` y `pastas.webp` (480×600) al leer esas categorías; en el teléfono, las de carnes y pastas aparecen entre la lista. Se relacionan con la categoría por el atributo `data-foto` / `data-categoria`. Solo se descargan al abrir la carta.
- **Panel de navegación:** en escritorio muestra `img/panel-letrero.webp` (480×600), que se descarga la primera vez que se abre.
- **Reconocimientos:** la sección está oculta con la clase `seccion--oculta`. Para mostrarla, quitar esa clase en `index.html`; el enlace del menú aparece solo.
- **Idioma:** español por defecto. El inglés se activa con el selector ES/EN o con `?lang=en`, y se recuerda en el navegador.

## Animaciones

- **Firma que se escribe sola (portada):** una máscara SVG recorre la firma real en 6 trazos, en orden de escritura. La primera vez entran también las letras y se encienden los anillos de luz. Se vuelve a escribir **cada 5 segundos** mientras la portada está a la vista y cada vez que se regresa a ella; se detiene fuera de la vista o en otra pestaña. Un botón pequeño bajo el logo permite pausarla (lo pide la norma de accesibilidad para animaciones que se repiten). Los tiempos están en el script que va justo después del `<h1>` en `index.html` (`CICLO = 5000`).
- **Dibujos que se trazan una sola vez al llegar** (atributo `data-trazo`): el anillo del chef, el racimo de açaí (concepto), el mapa de Venezuela con Puerto Ayacucho y el río Orinoco del mapa de Google mientras carga (Visítanos), el Cerro Autana y la línea de la mesa (Reserva), los petroglifos y la aparición escalonada de la galería. Para quitar uno, borrar su atributo `data-trazo`: se queda dibujado y quieto.
- **Colores:** fondos claros con color (beige en El concepto, terracota claro en el Menú, cal en la Galería, salvia claro en Visítanos y lavanda açaí en Reserva: `--beige`, `--terracota-clara`, `--cal`, `--salvia-clara`, `--lavanda-acai`), con la noche en oliva solo en la portada, el chef y el pie. La tarjeta «La carta» y las categorías de la carta completa van en morado açaí (`--acai`), y el racimo del açaí y el Autana en `--acai-trazo`. Para cambiar el color de una sección se edita su `--fondo` y la mezcla con sus vecinas (`--desde` / `--hacia`) en «Transiciones entre secciones» de `styles.css`.
- **Transiciones entre secciones:** cada sección se funde con la anterior en su margen superior y con la siguiente en el inferior (variables `--fondo`, `--desde` y `--hacia` de cada sección en `styles.css`), sin texto encima.
- **Petroglifos:** 13 dibujos propios inspirados en los del Cerro Pintado (crédito en el pie): en las transiciones (bloques `petroglifo`), junto al açaí (una figura que intenta alcanzar los frutos) y, en pantallas muy anchas, en los costados (bloques `petroglifo-costado`).
- **Pantallas grandes:** desde unos 1760 px el contenido se ensancha y la letra crece un poco.
- **Mapa de Venezuela:** contorno de Natural Earth (dominio público), simplificado; la Guayana Esequiba va rayada como zona en reclamación. Va centrado sobre la columna de datos de Visítanos.
- **Línea del río (pie y mapa mientras carga):** los meandros reales del Orinoco (Natural Earth), de su nacimiento al delta, puestos en horizontal y suavizados (`#meandro` en el sprite de `index.html`). En el pie se dibuja sola al llegar.
- **Procesión de Visítanos:** seis figuras humanas que aparecen una a una desde la izquierda hasta el hombre del centro (en el teléfono, cuatro).
- **Carta completa:** con la carta abierta en escritorio, la columna derecha queda fija, cambia de foto según la categoría y una línea dorada fina marca el avance de lectura (en Firefox se ve quieta).
- Con «reducir movimiento» activado en el teléfono o el ordenador, o sin JavaScript, todo se ve completo y quieto.

## Rendimiento

- Imágenes WebP con `loading="lazy"`. La firma del logo (`img/firma.webp`, 35 KB) es la excepción: se precarga con prioridad alta porque es lo primero que se ve.
- Las animaciones no usan librerías ni vídeo: CSS, SVG y un único IntersectionObserver.
- Galería con miniaturas cuadradas (`NN-mini.webp`, máx. 600 px); la foto completa (`NN.webp`) solo se descarga al ampliar.
- El mapa de Google usa carga diferida (`loading="lazy"`): solo se descarga cuando el visitante se acerca a la sección Visítanos. Mientras carga se ve «Cargando mapa…».
- Dos familias tipográficas alojadas en el propio sitio (unos 125 KB en total), con `font-display: swap`. No hay videos ni librerías externas.

## Publicar en Cloudflare Pages

1. En Cloudflare: **Workers & Pages → Crear → Pages → Conectar con Git** y elegir este repositorio (o «Subir recursos» y arrastrar la carpeta).
2. Configuración de compilación: framework **Ninguno**, comando de compilación **vacío**, directorio de salida **`/`**.
3. Antes de la versión definitiva: sustituir `[DOMINIO]` y quitar la etiqueta `noindex` de `index.html` (ver `PENDIENTES.md`, apartado 6).

Para probar en local: `python3 -m http.server` en esta carpeta y abrir `http://localhost:8000`.
