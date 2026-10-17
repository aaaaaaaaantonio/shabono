# Marcadores pendientes: Shabono by Nelson Méndez

Lista de datos a completar con el restaurante. En la página, todo lo que está **[entre corchetes]** aparece resaltado. Al sustituirlo por el dato real, el resaltado desaparece solo.

Los textos se editan en `main.js` (objeto `TRADUCCIONES`), en español (`es`) y en inglés (`en`). En la versión inglesa los marcadores llevan `· EN`.

## Ya resuelto

- WhatsApp: +58 416-685-2153 (`CONFIG.telefono`).
- Instagram: [@shabonobynelsonmendez](https://www.instagram.com/shabonobynelsonmendez/) (pie de página y JSON-LD).
- Dirección: Av. La Raza, al lado de Protección Civil Amazonas, Puerto Ayacucho 7101.
- Google Maps: enlace de la ficha, mapa insertado y ruta en carro con las coordenadas 5.653224172431118, -67.61533716709262.
- Métodos de pago: bolívares y divisas.
- Horario: de 7:00 a. m. a 11:00 p. m.
- Frase de portada, texto del concepto y sus tres apartados (redactados y aprobados).
- Logo: versión clara (crema y dorado), versión oscura, monograma NM y favicon, redibujados a partir de la imagen del logo.
- Firma «Nelson Mendez» que se escribe sola en la portada (en código, sin vídeo).
- Carta completa en orden, con índice; en escritorio la columna derecha acompaña la lectura con fotos por categoría.
- Panel de navegación con la foto del letrero, el horario, la dirección y el WhatsApp.
- Dibujos de línea: río Orinoco (separador, mapa), anillo del chef, racimo de açaí, Cerro Autana (validado por el chef, según el cliente), línea de la mesa y trama tenue del tejido de los individuales en la tarjeta de la carta.
- Foto del chef (chaqueta blanca), plato destacado (paella) y las 9 fotos de la galería. Se recortaron los comensales que aparecían al fondo.
- Menú: 6 platos de la casa, sin precios, y carta completa desplegable transcrita de la carta impresa (ortografía corregida).
- Biografía provisional con el dato de que el chef es dueño del Instituto Culinario de Investigación Amazonas.
- Correo: el restaurante no tiene; no aparece en el sitio.

## 1. Textos

| Marcador | Sección | Dónde se edita |
|---|---|---|
| Biografía (texto provisional) | El chef | `chef.bio`. Sustituir por la biografía real cuando la haya. |
| Cita del chef | El chef | `chef.cita`. Vacía y oculta hasta tener una cita real; al escribirla, el bloque aparece solo. |
| Descripciones de 5 platos destacados | Menú | `menu.platos[n].descripcion`. Vacías y ocultas; solo la Pasta Shabono tiene descripción. |
| Precios | Menú | No se muestran. Si se quieren publicar, hay que volver a añadir la columna de precios. |
| Menú degustación | Menú | Bloque oculto (`hidden` en `index.html`) hasta confirmar que existe. Textos en `menu.degustacionTexto`. |
| Alergias, impuestos y servicio | Menú | Bloque oculto (`hidden` en `index.html`). Textos en `menu.alergias` y `menu.impuestos`. |
| Días de apertura | Visítanos y pie | El horario no dice qué días abre. Si no es todos los días, añadirlo en `visitanos.horarios`. |
| [POLÍTICAS DE RESERVA] | Reserva | `reserva.politicas` |
| [POLÍTICAS DE CANCELACIÓN] | Reserva | `reserva.cancelacion` |

## 2. Imágenes

| Pendiente | Archivo(s) | Nota |
|---|---|---|
| [FOTO PORTADA: roca y cascada, de noche] | `img/portada.webp` (1920×1200) y `img/portada-movil.webp` (900×1400) | La portada muestra ahora el logo grande. En `index.html` hay un comentario con el bloque `<picture>` listo para pegar. |
| Logo original del diseñador | `img/logo-claro.svg`, `img/logo-oscuro.svg`, `img/logo-nm.svg`, `img/favicon.svg` | Los actuales están redibujados desde una imagen de 325 px. Con el archivo original (SVG, AI, PDF o PNG grande) quedan perfectos. |
| Fotos en alta resolución | `img/chef.webp`, `img/menu-destacado.webp`, `img/galeria/` | Las actuales vienen de Instagram (unos 550 px). En pantallas grandes se ven algo suaves. Para la versión final: mínimo 1200 px de ancho. |

## 3. Animaciones y dibujos

- Probar la firma animada en un **iPhone real (Safari)** y en un **Android económico**. Si en Safari la máscara no se repinta bien, la alternativa es mostrar la firma con un fundido.
- Opcional: un vídeo corto, grabado con el teléfono, del chef firmando su nombre, para copiar el orden real de sus trazos (hoy el orden de la «s», la «d» y el centro de la «M» es una interpretación).
- Pies de foto de la carta: hoy solo dicen la categoría. Si se confirma qué plato es cada foto (`img/carta/`), se puede añadir el nombre.
- Segunda fase: raudales de Atures, palmas y otros dibujos generados en Higgsfield (con los prompts acordados) para convertirlos a línea dorada animada. Si alguno se inspira en el diseño de un pueblo concreto, indicarlo en la página (p. ej. «inspirado en la cestería ye'kwana») y evitar símbolos sagrados.

## 4. Permisos de imagen (antes de publicar)

- Autorización escrita de las personas que aparecen en la foto con la comunidad indígena (`img/galeria/07`), **en especial de los representantes de los menores**.
- Confirmar que el restaurante autoriza el uso de las fotos tomadas de su Instagram.
- Si se conocen el nombre de la comunidad y el evento, mejorar la descripción de esa foto en `galeria.fotos` (ES y EN).

## 5. Reconocimientos (sección oculta)

Solo con datos verificados, con fuente enlazable. En `index.html`, sección `#reconocimientos`:

- [AÑO], [NOMBRE DEL PREMIO], [ENLACE] por cada premio
- [AÑO], [MEDIO Y TÍTULO DEL ARTÍCULO], [ENLACE] por cada nota de prensa
- Borrar [PENDIENTE DE VERIFICAR] una vez verificado cada elemento
- Para mostrar la sección: quitar la clase `seccion--oculta`. El enlace del menú aparece solo.

## 6. Publicación y SEO

| Marcador | Dónde |
|---|---|
| [DOMINIO] | `index.html` (canonical, hreflang, Open Graph, JSON-LD), `robots.txt`, `sitemap.xml` |
| [RANGO DE PRECIOS] | JSON-LD (p. ej. `$$`), cuando haya precios |
| [DÍAS] en JSON-LD | `openingHours`, formato schema.org: p. ej. `Mo-Su 07:00-23:00` si abre todos los días |
| `noindex` | **Quitar** `<meta name="robots" content="noindex, nofollow">` de `index.html` al publicar la versión definitiva. Está puesto para que la demo no aparezca en Google. |

## 7. Para revisar con el cliente

- Titulares: «Alta cocina de autor» (portada), «Cocina de autor con raíz amazónica», «La carta», «Shabono por dentro», «Te esperamos en Puerto Ayacucho», «Reserva tu mesa».
- Nombre exacto del instituto: en la chaqueta se lee «Instituto Culinario de Investigación Amazonas».
- Nombres de la carta que se dejaron como en la carta impresa porque no se pudo confirmar su significado: «Manier», «Medallones al Galten», «Bon Fan», «Club Husero».
- Interpretaciones de la carta impresa: el «(O)» se leyó como «o» («Cazuela de mariscos o pescado mixto», «Pulpo a la gallega o al ajillo»). «Paella x2» se dejó tal cual.
- Ortografía corregida respecto a la carta impresa: Amatriciana, Cordon bleu, Nuggets, César, Rebozados, BBQ, Boloñesa, Puttanesca.
- Nombre de la ficha de Google Maps: aparece como «Shabono By Nelson mendez»; conviene corregirlo en el perfil del negocio a «Nelson Méndez».
- Traducción al inglés de todos los textos. En inglés, los nombres de la carta completa se muestran en español (lo indica una nota).
