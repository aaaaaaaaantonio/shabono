# Marcadores pendientes: Shabono by Nelson Méndez

Lista de datos a completar con el restaurante. En la página, todo lo que está **[entre corchetes]** aparece resaltado. Al sustituirlo por el dato real, el resaltado desaparece solo.

Los textos se editan en `main.js` (objeto `TRADUCCIONES`), en español (`es`) y en inglés (`en`). En la versión inglesa los marcadores llevan `· EN`.

## Ya resuelto

- WhatsApp: +58 416-685-2153 (`CONFIG.telefono`).
- Dirección: Av. La Raza, al lado de Protección Civil Amazonas, Puerto Ayacucho 7101.
- Google Maps: enlace de la ficha, mapa insertado y ruta en carro con las coordenadas 5.653224172431118, -67.61533716709262.
- Métodos de pago: bolívares y divisas.
- Frase de portada, texto del concepto y sus tres apartados (redactados y aprobados).
- Instagram y correo: el restaurante no tiene; se quitaron del sitio. Si los crean, hay que volver a añadirlos (pie de página y JSON-LD).

## 1. Textos

| Marcador | Sección | Dónde se edita |
|---|---|---|
| Biografía (texto provisional) | El chef | `chef.bio`. Ahora hay un texto provisional solo con datos confirmados; sustituir por la biografía real. |
| Cita del chef | El chef | `chef.cita`. Vacía y oculta hasta tener una cita real; al escribirla, el bloque aparece solo. |
| [NOMBRE PLATO 1] … [NOMBRE PLATO 6] | Menú | `menu.platos[n].nombre` |
| [DESCRIPCIÓN PLATO 1] … [DESCRIPCIÓN PLATO 6] | Menú | `menu.platos[n].descripcion` |
| [PRECIO USD] ×6 | Menú | `menu.platos[n].precio` |
| [DETALLE DEGUSTACIÓN: número de tiempos, precio USD, maridaje] | Menú | `menu.degustacionTexto` |
| [NOTA SOBRE ALERGIAS] | Menú | `menu.alergias` |
| [IMPUESTOS Y SERVICIO: indicar si los precios los incluyen] | Menú | `menu.impuestos` |
| [HORARIOS] | Visítanos | `visitanos.horarios` |
| [POLÍTICAS DE RESERVA] | Reserva | `reserva.politicas` |
| [POLÍTICAS DE CANCELACIÓN] | Reserva | `reserva.cancelacion` |

## 2. Imágenes

Sustituir los archivos de `img/` manteniendo el **mismo nombre y tamaño**, en formato WebP. Las imágenes de relleno indican el tamaño en píxeles.

| Marcador | Archivo(s) | Tamaño |
|---|---|---|
| [LOGO SVG o PNG] | `img/logo-pendiente.svg` (cambiar también la ruta en `index.html`, 2 sitios) | SVG o PNG con fondo transparente |
| [FOTO PORTADA: roca y cascada, de noche] | `img/portada.webp` (horizontal) y `img/portada-movil.webp` (vertical) | 1920×1200 y 900×1400 |
| [FOTO CHEF] | `img/chef.webp` (se muestra en círculo) | 800×800 |
| [FOTO PLATO DESTACADO] | `img/menu-destacado.webp` (junto a la carta) | 1000×1250 |
| [FOTOS] galería (9) | `img/galeria/01-600.webp` … `09-600.webp` (miniatura) y `01-1200.webp` … `09-1200.webp` (ampliada) | 600×600 y 1200×800 |
| Textos alternativos de la galería | `main.js` → `galeria.fotos` (ES y EN), describiendo cada foto | — |
| [IMAGEN PARA COMPARTIR / OPEN GRAPH] | `img/og-imagen.jpg` (JPG para que WhatsApp la muestre) | 1200×630 |
| Favicon | `img/favicon.svg` (ahora es provisional; hacerlo a partir del logo) | SVG cuadrado |

## 3. Reconocimientos (sección oculta)

Solo con datos verificados, con fuente enlazable. En `index.html`, sección `#reconocimientos`:

- [AÑO], [NOMBRE DEL PREMIO], [ENLACE] por cada premio
- [AÑO], [MEDIO Y TÍTULO DEL ARTÍCULO], [ENLACE] por cada nota de prensa
- Borrar [PENDIENTE DE VERIFICAR] una vez verificado cada elemento
- Para mostrar la sección: quitar la clase `seccion--oculta`. El enlace del menú aparece solo.

## 4. Publicación y SEO

| Marcador | Dónde |
|---|---|
| [DOMINIO] | `index.html` (canonical, hreflang, Open Graph, JSON-LD), `robots.txt`, `sitemap.xml` |
| [RANGO DE PRECIOS] | JSON-LD (p. ej. `$$$`), cuando esté el menú |
| [HORARIOS] en JSON-LD | Formato schema.org, p. ej. `Tu-Su 19:00-23:00` |
| [LOGO SVG o PNG] | También dentro del JSON-LD de `index.html` |
| `noindex` | **Quitar** `<meta name="robots" content="noindex, nofollow">` de `index.html` al publicar la versión definitiva. Está puesto para que la demo no aparezca en Google. |

## 5. Para revisar con el cliente

- Titulares: «Cocina de autor con raíz amazónica», «La carta», «Shabono por dentro», «Te esperamos en Puerto Ayacucho», «Reserva tu mesa».
- «Chef y propietario · Chef venezolano con reconocimiento internacional» (se repite con la biografía provisional).
- «Una selección de nuestra carta. Precios en dólares estadounidenses (USD).» (confirmar que los 6 platos son una selección y que los precios se publican en USD).
- Nombre «Menú degustación» (y el botón «Reservar degustación»).
- Nombre de la ficha de Google Maps: aparece como «Shabono By Nelson mendez»; conviene corregirlo en el perfil del negocio a «Nelson Méndez».
- Traducción al inglés de todos los textos.
