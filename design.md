# Design — Shabono by Nelson Méndez

Sistema de diseño fijado para la web y la app de gestión interna. Hallmark y otras
herramientas de IA leen este archivo primero, y cada pantalla debe seguirlo. Si algo
cambia, se cambia aquí: este archivo manda.

## Sistema
- Género · atmospheric (web) · modern-minimal (app de gestión: ver § Variantes)
- Macroestructura · Split Studio (web)
- Tema · studied-DNA (refs. Amrit Palace y Graza) + paleta del local · vibe: «mediterráneo cálido, noche en oliva, línea dorada»
- Ejes · papeles claros de color / títulos serif en mayúsculas / acento terracota, con morado açaí y dorado

## Tokens (fuente: `:root` de `styles.css` en la web; en la app, `tokens.css` copiado de este bloque)
Se mantienen los nombres en español de la web para que los dos proyectos compartan variables.
```css
:root {
  /* Papeles (fondos claros) */
  --cal: #FBF7EF;              /* oklch(0.977 0.011 84.6) · fondo base */
  --beige: #E8D9BF;            /* oklch(0.891 0.038 81.5) · El concepto */
  --terracota-clara: #EDC3AA;  /* oklch(0.847 0.059 52.4) · Menú */
  --salvia-clara: #E3E8D6;     /* oklch(0.922 0.025 119.5) · Visítanos */
  --lavanda-acai: #EBDDE6;     /* oklch(0.911 0.019 338.7) · Reserva */
  --crema: #F2ECE1;            /* oklch(0.945 0.016 82.8) · texto sobre noche */
  --blanco: #FFFFFF;           /* texto de botones · superficie de tarjetas en la app */
  /* Noche */
  --verde-oliva: #4F5A2E;      /* oklch(0.447 0.067 120.7) · portada, chef, pie, menú de navegación */
  --negro-logo: #1C1B19;       /* base del velo de la portada */
  /* Tinta */
  --tinta: #262B14;            /* oklch(0.277 0.039 119.1) · texto principal */
  --tinta-suave: #545A44;      /* texto secundario */
  --tinta-tierra: #5A4436;     /* texto secundario sobre terracota claro */
  --granito: #8C8A85;          /* rayas discontinuas y bordes de campo (3,2:1 sobre cal) */
  /* Acentos */
  --terracota-boton: #B9522A;  /* oklch(0.563 0.144 40.5) · fondo del botón principal */
  --terracota-hondo: #A8461F;  /* botón principal al pasar el cursor */
  --terracota-texto: #9C4421;  /* texto de acento y contorno de foco sobre claro */
  --terracota-tierra: #7A3318; /* acento sobre terracota claro */
  --acai: #4A1E3F;             /* oklch(0.312 0.081 337.9) · bloque «La carta», categorías */
  --acai-trazo: #6E3B60;       /* dibujos sobre beige y lavanda */
  --dorado-luz: #E3B866;       /* oklch(0.804 0.112 82.1) · solo sobre noche o açaí: logo, halo, activo */
  /* Estados (propuesta para la app; siempre con palabra o icono, nunca solo color) */
  --estado-ok-fondo: var(--salvia-clara);       --estado-ok-texto: var(--verde-oliva);         /* 5,9:1 */
  --estado-aviso-fondo: #F5E2B5;                --estado-aviso-texto: #6B4A10;                 /* 6,3:1 */
  --estado-peligro-fondo: var(--terracota-clara); --estado-peligro-texto: var(--terracota-tierra); /* 5,6:1 */
  --estado-info-fondo: var(--lavanda-acai);     --estado-info-texto: var(--acai);              /* 10,3:1 */
  --linea: #D9D6CC;            /* separadores decorativos de la app (no sirve para bordes de campo) */

  --fuente-titulos: "Playfair Display", Georgia, "Times New Roman", serif;
  --fuente-texto: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
  /* Archivos woff2 propios en fonts/ (licencia OFL incluida). Sin Google Fonts. */

  /* Espaciado con nombre, escala de 4 px (nuevo: la web usa rem sueltos) */
  --espacio-3xs: .25rem; --espacio-2xs: .5rem; --espacio-xs: .75rem; --espacio-s: 1rem;
  --espacio-m: 1.5rem;   --espacio-l: 2rem;    --espacio-xl: 3rem;   --espacio-2xl: 4rem;

  --ease-out: cubic-bezier(.16, 1, .3, 1);      /* entradas y trazos */
  --ease-in: cubic-bezier(.7, 0, .84, 0);       /* salidas */
  --ease-in-out: cubic-bezier(.65, 0, .35, 1);  /* fundidos */
  --transicion: .35s cubic-bezier(.2, .7, .2, 1);

  --radio: 14px;               /* tarjetas, fotos, mapa */
  --radio-boton: 2px;          /* botones (segundo borde: 3px) */
  --radio-campo: 4px;          /* campos de formulario (app) */
  --halo: 0 0 0 1px color-mix(in srgb, var(--dorado-luz) 50%, transparent),
          0 0 22px 3px color-mix(in srgb, var(--dorado-luz) 25%, transparent),
          0 0 60px 10px color-mix(in srgb, var(--dorado-luz) 10%, transparent);
}
```

## Tipografía
- Títulos · Playfair Display 400, MAYÚSCULAS, interlineado 1.04, tracking -.015em. Nunca en cursiva.
- Texto · Inter 16 px, interlineado 1.65. Etiquetas: Inter 700, .8125rem, mayúsculas, tracking .16em.
- Cifras (app) · `font-variant-numeric: tabular-nums`, alineadas a la derecha.

## Botones
- Principal · fondo `--terracota-boton`, texto blanco 600, radio 2px, alto mínimo 48px, relleno .75em 1.6em. Lleva un segundo borde desplazado 5px que se ciñe al pasar el cursor; al pasar el cursor también cambia a `--terracota-hondo` y muestra `--halo`. Al pulsar baja 1px. Desactivado: opacidad .5 y sin halo.
- Secundario · contorno de 1px en `currentColor`, fondo transparente (tinta sobre claro, crema sobre noche). Al pasar el cursor: velo blanco al 45 % sobre claro, borde terracota.
- Foco · contorno de 2px en `--terracota-texto` sobre claro y en `--dorado-luz` sobre noche, siempre visible con teclado.

## Movimiento
- Web · los dibujos de línea se trazan una vez al llegar (1–2,4 s, `--ease-out`). La firma se repite cada 5 s, con botón de pausa. La galería aparece escalonada.
- App · sin animaciones decorativas: solo cambios de estado en ≤200 ms con `--ease-out`.
- Con `prefers-reduced-motion` todo queda dibujado y quieto, en la web y en la app.

## Motivos
- Petroglifos inspirados en el Cerro Pintado (crédito en el pie). Trazo de 2.25, extremos redondos; terracota sobre claro, dorado sobre noche.
- Línea del río con los meandros reales del Orinoco, anillo y halo dorados, y trama de tejido tenue en la tarjeta de la carta.
- En la app, solo en el acceso y en los estados vacíos; nunca dentro de tablas ni formularios.

## Voz
- Español de Venezuela, tuteo («Reserva tu mesa», «Escríbenos»). En la app, verbos directos: «Registrar compra», «Ajustar existencias».
- Números en formato venezolano: 1.234,56; fechas dd/mm/aaaa.
- No se inventan datos: lo que falta va **[ENTRE CORCHETES]** y se ve resaltado. En la demo de la app, un aviso visible: «Datos de ejemplo».

## Variantes — App de gestión interna (demo para el pitch)
- Usuarios · los dos chefs jefes y su equipo (posible administrador). Teléfono, tableta y computadora.
- Estructura · en computadora (≥64rem), barra lateral en `--verde-oliva` con texto crema y la sección activa en dorado, como el menú de navegación de la web. En teléfono, barra inferior fija con 4–5 accesos, como la barra móvil de la web.
- Fondo `--cal`; tarjetas `--blanco` con separadores `--linea`. Las tablas usan raya discontinua de 1px, como la carta de la web.
- Títulos de pantalla en Playfair mayúsculas; todo lo demás en Inter.
- Doble moneda · el importe principal en € y, debajo, en Bs (tinta suave). Arriba se ve la tasa euro BCV del día con su fecha, y cada registro guarda la tasa con la que se hizo.
- Estados · etiquetas con fondo, texto y palabra: «Suficiente» (ok), «Bajo mínimo» o «Vence pronto» (aviso), «Agotado» o «Vencido» (peligro), «Pendiente» (info).
- Componentes · los 8 estados: normal, al pasar el cursor, foco, pulsado, desactivado, cargando, error y éxito.
- Campos · borde `--granito`, radio 4px, alto ≥44px, etiqueta encima; el error se muestra en texto, no solo en color.
- Gráficos · ingresos en `--verde-oliva`, gastos en `--terracota-boton` y una tercera serie en `--acai-trazo`. Validar los colores al construir los gráficos.
- Funciona sin conexión: guarda los datos en el aparato y los sincroniza al volver internet (fase real).

## Contraste verificado (WCAG AA)
| Texto / fondo | Ratio | | Texto / fondo | Ratio |
|---|---|---|---|---|
| tinta / cal | 13,7 | | crema / verde-oliva | 6,3 |
| tinta-suave / cal | 6,7 | | dorado-luz / verde-oliva | 4,0 (solo ≥24px) |
| tinta-suave / beige | 5,2 | | crema / acai | 11,5 |
| tinta-tierra / terracota-clara | 5,6 | | dorado-luz / acai | 7,3 |
| terracota-texto / cal | 6,0 | | blanco / terracota-boton | 4,9 |
| acai / lavanda-acai | 10,3 | | granito / blanco (borde) | 3,4 |

## Exports
En la web, la fuente es el `:root` de `styles.css`. En la app, el bloque de Tokens se copia a `tokens.css`. Si se quiere Tailwind v4 `@theme` o `tokens.json` (DTCG), se pide «extend design.md with Tailwind exports».

## Notas (decisiones del cliente)
- El brillo y el halo dorados se conservan.
- La variación de color elegida fue la «2 · Fondos».
- La Guayana Esequiba va rayada como zona en reclamación.
- Los petroglifos llevan crédito.
- Sin correo del restaurante en el sitio.
