# Marcadores pendientes: Shabono by Nelson Méndez

Lista de datos a completar con el restaurante. En la página, todo lo que está **[entre corchetes]** aparece resaltado. Al sustituirlo por el dato real, el resaltado desaparece solo.

Los textos se editan en `main.js` (objeto `TRADUCCIONES`). Cada texto necesita versión en español (`es`) y en inglés (`en`). En la versión inglesa los marcadores llevan `· EN`.

## 1. Textos

| Marcador | Sección | Dónde se edita |
|---|---|---|
| [FRASE DE CONCEPTO] | Portada | `portada.frase` |
| [BIOGRAFÍA] | El chef | `chef.bio` |
| [CITA DEL CHEF] | El chef | `chef.cita` |
| [TEXTO CONCEPTO] | El concepto, introducción | `concepto.intro` |
| [TEXTO CONCEPTO: ingredientes amazónicos] | El concepto | `concepto.ingredientesTexto` |
| [TEXTO CONCEPTO: origen] | El concepto | `concepto.origenTexto` |
| [TEXTO CONCEPTO: productores locales] | El concepto | `concepto.productoresTexto` |
| [NOMBRE PLATO 1] … [NOMBRE PLATO 6] | Menú | `menu.platos[n].nombre` |
| [DESCRIPCIÓN PLATO 1] … [DESCRIPCIÓN PLATO 6] | Menú | `menu.platos[n].descripcion` |
| [PRECIO USD] ×6 | Menú | `menu.platos[n].precio` |
| [DETALLE DEGUSTACIÓN: número de tiempos, precio USD, maridaje] | Menú | `menu.degustacionTexto` |
| [NOTA SOBRE ALERGIAS] | Menú | `menu.alergias` |
| [IMPUESTOS Y SERVICIO: indicar si los precios los incluyen] | Menú | `menu.impuestos` |
| [DIRECCIÓN] | Visítanos y pie | `visitanos.direccion` |
| [HORARIOS] | Visítanos | `visitanos.horarios` |
| [MÉTODOS] (de pago) | Visítanos | `visitanos.pago` |
| [CÓMO LLEGAR: EN AVIÓN] | Visítanos | `visitanos.avionTexto` (referencia a verificar: Aeropuerto Nacional Cacique Aramare, PYH; aerolíneas y frecuencias actuales) |
| [CÓMO LLEGAR: POR CARRETERA] | Visítanos | `visitanos.carreteraTexto` |
| [CÓMO LLEGAR: DENTRO DE LA CIUDAD] | Visítanos | `visitanos.enCiudadTexto` |
| [POLÍTICAS DE RESERVA] | Reserva | `reserva.politicas` |
| [POLÍTICAS DE CANCELACIÓN] | Reserva | `reserva.cancelacion` |

## 2. Contacto y enlaces

Se editan en `main.js`, objeto `CONFIG`.

| Marcador | Uso |
|---|---|
| [TELÉFONO] | Número de WhatsApp en formato internacional (`+58 …`). Activa el botón de reserva `wa.me/NÚMERO` y el contacto del pie. Mientras falte, el botón abre WhatsApp con el mensaje escrito pero sin destinatario. |
| [ENLACE MAPS] (enlace) | `mapsEnlace`: enlace «Compartir» de Google Maps para «Abrir en Google Maps». |
| [ENLACE MAPS] (mapa insertado) | `mapsInsertar`: el valor `src` del código «Insertar un mapa». Activa el botón «Ver mapa». |
| [INSTAGRAM] | `instagram`: URL completa del perfil. |
| [CORREO] | `correo`: correo de contacto (opcional; si no hay, se puede quitar del pie). |

## 3. Imágenes

Sustituir los archivos de `img/` manteniendo el **mismo nombre y tamaño**, en formato WebP. Las imágenes de relleno indican el tamaño en píxeles.

| Marcador | Archivo(s) | Tamaño |
|---|---|---|
| [LOGO SVG o PNG] | `img/logo-pendiente.svg` (cambiar también la ruta en `index.html`, 2 sitios) | SVG o PNG con fondo transparente |
| [FOTO PORTADA: roca y cascada, de noche] | `img/portada.webp` (horizontal) y `img/portada-movil.webp` (vertical) | 1920×1200 y 900×1400 |
| [FOTO CHEF] | `img/chef.webp` (se muestra en círculo) | 800×800 |
| [FOTOS] galería (9) | `img/galeria/01-600.webp` … `09-600.webp` (miniatura) y `01-1200.webp` … `09-1200.webp` (ampliada) | 600×600 y 1200×800 |
| Textos alternativos de la galería | `main.js` → `galeria.fotos` (ES y EN), describiendo cada foto | — |
| [IMAGEN PARA COMPARTIR / OPEN GRAPH] | `img/og-imagen.jpg` (JPG para que WhatsApp la muestre) | 1200×630 |
| Favicon | `img/favicon.svg` (ahora es provisional; hacerlo a partir del logo) | SVG cuadrado |

## 4. Reconocimientos (sección oculta)

Solo con datos verificados, con fuente enlazable. En `index.html`, sección `#reconocimientos`:

- [AÑO], [NOMBRE DEL PREMIO], [ENLACE] por cada premio
- [AÑO], [MEDIO Y TÍTULO DEL ARTÍCULO], [ENLACE] por cada nota de prensa
- Borrar [PENDIENTE DE VERIFICAR] una vez verificado cada elemento
- Para mostrar la sección: quitar la clase `seccion--oculta`. El enlace del menú aparece solo.

## 5. Publicación y SEO

| Marcador | Dónde |
|---|---|
| [DOMINIO] | `index.html` (canonical, hreflang, Open Graph, JSON-LD), `robots.txt`, `sitemap.xml` |
| [LATITUD] y [LONGITUD] | JSON-LD en `index.html` (se obtienen de Google Maps) |
| [RANGO DE PRECIOS] | JSON-LD (p. ej. `$$$`) |
| [HORARIOS] en JSON-LD | Formato schema.org, p. ej. `Tu-Su 19:00-23:00` |
| [TELÉFONO], [CORREO], [MÉTODOS], [ENLACE MAPS], [INSTAGRAM], [LOGO SVG o PNG] | También dentro del JSON-LD de `index.html` |
| `noindex` | **Quitar** `<meta name="robots" content="noindex, nofollow">` de `index.html` al publicar la versión definitiva. Está puesto para que la demo no aparezca en Google. |

## 6. Textos redactados para la demo (aprobar con el cliente)

No son marcadores, pero conviene que el restaurante los apruebe, en español y en inglés:

- Titulares: «Cocina de autor con raíz amazónica», «La carta», «Shabono por dentro», «Te esperamos en Puerto Ayacucho», «Reserva tu mesa».
- «Chef y propietario · Chef venezolano con reconocimiento internacional».
- «Una selección de nuestra carta. Precios en dólares estadounidenses (USD).» (confirmar que los 6 platos son una selección y que los precios se publican en USD).
- Nombre «Menú degustación».
- Mensaje de WhatsApp en inglés: «Hello, I would like to book a table at Shabono on [date] for [number] people».
