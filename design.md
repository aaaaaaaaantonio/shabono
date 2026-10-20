# Design — Shabono by Nelson Méndez

Sistema de diseño fijado para la web y la app de gestión interna. Hallmark y otras
herramientas de IA leen este archivo primero, y cada pantalla debe seguirlo. Si algo
cambia, se cambia aquí: este archivo manda.

## Sistema
- Género · web: atmospheric. App: modern-minimal adaptado; de ese género solo toma la sobriedad (sin animaciones decorativas ni degradados) y conserva Playfair en los títulos, los botones de 2px y la paleta. Sin píldoras, sin Geist y sin navegación flotante.
- Tema · studied-DNA (refs. Amrit Palace y Graza) + paleta del local · vibe: «mediterráneo cálido, noche en oliva, línea dorada»
- Ejes · papeles claros de color / títulos serif en mayúsculas / acento terracota, con morado açaí y dorado

## Tokens
La fuente es este bloque. La web tiene los mismos valores en `styles.css`, más sus velos translúcidos. En la app, el bloque se copia a `tokens.css`. Lo marcado «app» solo existe en la app.
```css
:root {
  /* Papeles (fondos claros) */
  --cal: #FBF7EF;              /* oklch(0.977 0.011 84.6) · fondo base */
  --beige: #E8D9BF;            /* oklch(0.891 0.038 81.5) */
  --terracota-clara: #EDC3AA;  /* oklch(0.847 0.059 52.4) */
  --salvia-clara: #E3E8D6;     /* oklch(0.922 0.025 119.5) */
  --lavanda-acai: #EBDDE6;     /* oklch(0.911 0.019 338.7) */
  --blanco: #FFFFFF;           /* texto de botones · superficie de tarjetas (app) */
  /* Noche */
  --verde-oliva: #4F5A2E;      /* oklch(0.447 0.067 120.7) · bloques oscuros, barra lateral (app) */
  --negro-logo: #1C1B19;       /* fondo de la portada web · base de --velo */
  --crema: #F2ECE1;            /* texto sobre noche (6,3:1 sobre oliva) */
  --crema-suave: color-mix(in srgb, var(--crema) 85%, transparent); /* texto secundario sobre noche (5,1:1) */
  /* Tinta */
  --tinta: #262B14;            /* oklch(0.277 0.039 119.1) · texto principal */
  --tinta-suave: #545A44;      /* texto secundario; sobre --terracota-clara usar --tinta-tierra */
  --tinta-tierra: #5A4436;     /* texto secundario sobre terracota claro */
  --granito: #8C8A85;          /* bordes de campo y rayas de tabla, solo sobre cal o blanco (≥3,2:1); nunca texto */
  --linea: #D9D6CC;            /* app · separa dentro de una tarjeta, no la delimita (1,4:1) */
  /* Acentos */
  --terracota: #C2582B;        /* color del local · borde del botón secundario al pasar el cursor; no lleva texto blanco (4,4:1) */
  --terracota-boton: #B9522A;  /* oklch(0.563 0.144 40.5) · fondo del botón principal */
  --terracota-hondo: #A8461F;  /* botón principal al pasar el cursor */
  --terracota-texto: #9C4421;  /* texto de acento y foco sobre claro */
  --terracota-trazo: #9C4421;  /* trazo de petroglifos: fijo aunque una zona cambie --terracota-texto */
  --terracota-tierra: #7A3318; /* acento y foco sobre terracota claro */
  --acai: #4A1E3F;             /* oklch(0.312 0.081 337.9) · bloques en morado, texto de info */
  --acai-trazo: #6E3B60;       /* dibujos sobre beige y lavanda */
  --dorado-luz: #E3B866;       /* oklch(0.804 0.112 82.1) · sólido solo sobre noche o açaí; sobre claro, solo translúcido (halo) */
  /* Estados · app (siempre con icono y palabra, nunca solo color) */
  --estado-ok-fondo: var(--salvia-clara);         --estado-ok-texto: var(--verde-oliva);        /* 5,9:1 */
  --estado-aviso-fondo: #F5E2B5;                  --estado-aviso-texto: #6B4A10;                /* 6,3:1 */
  --estado-peligro-fondo: var(--terracota-clara); --estado-peligro-texto: var(--terracota-tierra); /* 5,6:1 */
  --estado-info-fondo: var(--lavanda-acai);       --estado-info-texto: var(--acai);             /* 10,3:1 */
  --velo: color-mix(in srgb, var(--negro-logo) 50%, transparent); /* app · fondo de los modales */

  /* woff2 variables propios en fonts/ (Inter 100–900 y Playfair 400–900, subconjunto latino con €),
     con licencia SIL OFL 1.1. Sin Google Fonts. La app no copia la cursiva de Playfair. */
  --fuente-titulos: "Playfair Display", Georgia, "Times New Roman", serif;
  --fuente-texto: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
  --texto-xs: .8125rem; --texto-s: .875rem; --texto-m: 1rem; --texto-l: 1.25rem; --texto-xl: 1.5rem; --texto-2xl: 2rem; /* app */
  --espacio-3xs: .25rem; --espacio-2xs: .5rem; --espacio-xs: .75rem; --espacio-s: 1rem;  /* app · escala de 4 px */
  --espacio-m: 1.5rem;   --espacio-l: 2rem;    --espacio-xl: 3rem;   --espacio-2xl: 4rem;

  --ease-out: cubic-bezier(.16, 1, .3, 1);      /* entradas y trazos */
  --ease-in: cubic-bezier(.7, 0, .84, 0);       /* salidas */
  --ease-in-out: cubic-bezier(.65, 0, .35, 1);  /* fundidos */
  --transicion: .35s cubic-bezier(.2, .7, .2, 1); /* solo web */
  --duracion-app: 180ms;                        /* app · cambios de estado */

  --radio: 14px;               /* tarjetas, fotos grandes y mapa */
  --radio-boton: 2px;          /* botones; el segundo borde lleva 3px */
  --radio-campo: 4px;          /* app · campos */
  --halo: 0 0 0 1px color-mix(in srgb, var(--dorado-luz) 50%, transparent),
          0 0 22px 3px color-mix(in srgb, var(--dorado-luz) 25%, transparent),
          0 0 60px 10px color-mix(in srgb, var(--dorado-luz) 10%, transparent);
}
```

## Tipografía
- Títulos de sección o de pantalla · Playfair Display 400, MAYÚSCULAS, interlineado 1.04, tracking -.015em, `overflow-wrap: anywhere`. Subtítulos: Playfair 500, interlineado 1.15, sin mayúsculas, `lining-nums`. Nunca en cursiva.
- Texto · Inter 1rem, interlineado 1.65 en prosa y 1.4 en tablas y formularios. Etiquetas de bloque: Inter 700 .8125rem, mayúsculas, tracking .16em. Etiquetas menores: Inter 600 .75rem.
- App · título de pantalla en `--texto-xl` en el teléfono y `--texto-2xl` en la computadora. Tablas y formularios en `--texto-s` o `--texto-m`. Cifras de resumen en Inter 600 `--texto-xl`. Todas las cifras con `tabular-nums` y alineadas a la derecha.

## Botones y foco
- Principal · fondo `--terracota-boton` y texto `--blanco` en Inter 600 1rem, tracking .02em, interlineado 1.2. Radio 2px, alto 48px, relleno .75em 1.6em, separación de .6em con el icono. Al pasar el cursor: `--terracota-hondo` y `--halo`.
- Segundo borde · línea de 1px a 5px del botón, radio 3px, opacidad .7. En el principal es `--terracota-boton`; en el secundario, `currentColor`. Al pasar el cursor se ciñe (escala .985, opacidad 1), y en el principal cambia a `--dorado-luz`. Al pulsar se escala a .97.
- Secundario · contorno de 1px en `currentColor`, fondo transparente: tinta sobre claro, crema sobre noche. Al pasar el cursor muestra `--halo`. Sobre claro lleva velo `--blanco` al 45 % y borde `--terracota`; sobre noche, velo `--crema` al 10 % y borde `--dorado-luz`.
- Pulsado · el botón baja 1px.
- Desactivado · opacidad .5, sin halo, `cursor: not-allowed`, atributo `disabled` y una línea que explique por qué.
- Foco · contorno de 2px separado 3px, con radio 4px. En los botones va separado 8px para librar el segundo borde. Color: `--terracota-texto` sobre claro, `--terracota-tierra` sobre terracota claro, `--tinta` sobre salvia y `--dorado-luz` sobre noche.

## Movimiento
- App · sin animaciones decorativas. Los cambios de estado usan `--duracion-app` y `--ease-out`.
- Con `prefers-reduced-motion`, todo queda quieto y dibujado.

## Motivos y recursos
- Petroglifos inspirados en el Cerro Pintado, con crédito. Trazo de 2.25px en pantalla (`vector-effect: non-scaling-stroke`, `pathLength="1"`), extremos y uniones redondos. Van en `--terracota-trazo` sobre claro y en `--dorado-luz` sobre noche. En la app, solo en el acceso y en los estados vacíos; nunca en tablas ni formularios.
- Se copian de la web, nunca se redibujan:
  - `fonts/` con sus licencias;
  - `img/logo-oscuro.svg` (#1C1B19, para fondo claro);
  - `img/logo-claro.svg` y `img/logo-nm.svg` (crema, para fondo noche);
  - `img/favicon.svg`;
  - los SVG de los petroglifos y el meandro `#meandro` de `index.html`.

  Si falta alguno, el motivo se omite.
- Iconos · solo Lucide, con trazo de 1.75, en `currentColor`. Miden 20px en listas y 24px en la barra de navegación. Sin emojis y nunca dorados sobre claro.

## Voz
- Español de Venezuela, tuteo. En la app, verbos directos: «Registrar compra», «Ajustar existencias».
- Números en formato 1.234,56 y fechas dd/mm/aaaa.
- No se inventan datos. En la demo los registros son ficticios pero verosímiles: productos y proveedores inventados, sin marcas reales. Los nombres de los platos pueden ser los de la carta real porque son públicos. Todo total, margen o alerta se calcula a partir de esos registros, sin cifras sueltas ni comparaciones inventadas. El equipo aparece por su rol, sin nombres. Un aviso fijo dice «Datos de ejemplo».

## Variantes — App de gestión interna (demo para el pitch)
- Usuarios · los dos chefs jefes y su equipo, con un posible administrador. Se usa en teléfono, tableta y computadora. La demo guarda los datos en el navegador (localStorage), sin servidor. El modo sin conexión con sincronización queda para la fase real.
- Navegación:
  - Teléfono (<40rem): barra inferior fija en `--verde-oliva` opaco, de 64px más `env(safe-area-inset-bottom)`. Tiene 5 accesos con icono y etiqueta: Inicio, Inventario, Compras, Carta y precios, Finanzas.
  - Tableta (40–64rem): barra lateral reducida a iconos con etiqueta corta.
  - Computadora (≥64rem): barra lateral completa en `--verde-oliva`, con texto `--crema` y secundario `--crema-suave`.
  - La sección activa va en `--crema` 600, con una raya `--dorado-luz` de 3px y `aria-current="page"`. El dorado nunca es color de texto por debajo de 24px.
  - Barra superior en todos los tamaños, con el título, la tasa del día y el aviso «Datos de ejemplo».
- Superficies · fondo `--cal`, tarjetas `--blanco` y separadores `--linea`.
- Tablas · sobre `--blanco`, con raya discontinua de 1px en `--granito` y cabecera fija. Por debajo de 40rem cada fila pasa a ser una tarjeta: nombre y estado arriba; existencia, vencimiento e importe abajo. Al tocarla se abre el detalle. La página nunca se desplaza de lado.
- Doble moneda (€ y Bs., tasa euro BCV):
  - Formato con `Intl.NumberFormat('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})` y el símbolo puesto a mano: «€ 1.234,56» y «Bs. 45.678,90». Nunca `style: 'currency'`.
  - Arriba va el importe en € y debajo el de Bs. en `--tinta-suave`.
  - La tasa se guarda con todos los decimales que publica el BCV y con su fecha, y se muestra como «Tasa BCV · € 1 = Bs. 45,67 · 20/10/2026». Si no es la de hoy, lleva el aviso «Tasa del dd/mm».
  - Cada registro guarda su moneda de origen, su tasa y el equivalente. Los totales suman cada columna tal como se registró; el valor actual del inventario en Bs. usa la tasa del día.
- Estados · el producto muestra solo su estado más grave (peligro, aviso o info) y el resto va en el detalle:
  - «Agotado» o «Vencido» (peligro);
  - «Bajo mínimo», cuando la existencia es igual o menor que el mínimo (aviso);
  - «Vence pronto», a 3 días o menos por defecto, editable por producto (aviso);
  - «Pendiente» (info);
  - «Suficiente» (ok).

  Las fechas se escriben «Vence en 2 días · 22/10/2026». En Inicio se ve cuántos productos vencen esta semana, con enlace al inventario ya filtrado.
- Campos:
  - Alto 48px, igual que los botones. Borde de 1px `--granito`, solo sobre `--blanco` o `--cal`. Etiqueta encima y ayuda debajo.
  - Error: borde y mensaje en `--estado-peligro-texto`, con icono y `aria-invalid`.
  - Importes: `type="text"` con `inputmode="decimal"`; acepta coma o punto y al salir del campo se formatea a 1.234,56.
  - Fecha: `<input type="date">` nativo.
- Componentes · cada uno con sus 8 estados: normal, al pasar el cursor, foco, pulsado, desactivado, cargando, error y éxito.
- Patrones:
  - Modal · `<dialog>` de 32rem como máximo sobre `--velo`; en el teléfono ocupa toda la pantalla.
  - Borrar · si se puede deshacer, aviso «Eliminado · Deshacer» durante 8 s; si no, un modal con el nombre del registro.
  - Filtros · buscador y filtros encima de la lista, con «Limpiar» y el número de resultados.
  - Vacío · un petroglifo pequeño, una frase y una acción.
  - Cargando · esqueleto de la lista.
- Gráficos:
  - Ingresos en línea continua `--verde-oliva`, gastos en línea discontinua o barras con trama `--terracota-boton` y la tercera serie con puntos `--acai-trazo`.
  - El nombre de cada serie va junto a ella; ejes en `--granito`; debajo, la tabla con los datos. Nunca se distinguen solo por el color.
- Pitch · se enseña en el aparato real o en el modo adaptable del navegador. No se dibujan marcos de teléfono, tableta ni navegador.

## Contraste verificado (WCAG AA)
| Texto / fondo | Ratio | | Texto / fondo | Ratio |
|---|---|---|---|---|
| tinta / cal | 13,7 | | crema / verde-oliva | 6,3 |
| tinta-suave / cal | 6,7 | | crema-suave / verde-oliva | 5,1 |
| tinta-suave / beige | 5,2 | | dorado-luz / verde-oliva | 4,0 (solo ≥24px o raya) |
| tinta-tierra / terracota-clara | 5,6 | | crema / acai | 11,5 |
| terracota-texto / cal | 6,0 | | dorado-luz / acai | 7,3 |
| acai / lavanda-acai | 10,3 | | blanco / terracota-boton | 4,9 |
| granito / blanco (borde) | 3,4 | | granito / cal (borde) | 3,2 |

## Solo web (no aplica a la app)
- Macroestructura Split Studio.
- Fondos por sección: El concepto beige, Menú terracota claro, Galería cal, Visítanos salvia clara y Reserva lavanda açaí. La noche en oliva va en el chef y el pie; la portada es `--negro-logo` con halo dorado y se funde a oliva. Entre secciones hay degradados de dos tonos.
- Movimiento:
  - Los dibujos se trazan una vez al llegar, entre 0,4 y 2,4 s, con `--ease-out` y escalonados.
  - La firma se escribe en unos 2,5 s y se repite cada 5 s mientras se ve, con un botón de pausa de 44px.
  - La galería aparece escalonada.
- Notas del cliente: el brillo dorado se conserva; la variación de color elegida es la «2 · Fondos»; la Guayana Esequiba va rayada como zona en reclamación; los petroglifos llevan crédito; el sitio no tiene correo.

## Exports
Para usar Tailwind v4 `@theme` o `tokens.json` (DTCG), se pide «extend design.md with Tailwind exports».
