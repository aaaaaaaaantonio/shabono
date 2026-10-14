# Shabono by Nelson Méndez: sitio web (demo)

Sitio de una sola página para **Shabono by Nelson Méndez**, restaurante de alta cocina de autor en Puerto Ayacucho, estado Amazonas, Venezuela.

Es una **demo**. Todo dato no confirmado aparece **[entre corchetes]** y resaltado en la página. La lista completa está en [`PENDIENTES.md`](PENDIENTES.md).

## Estructura

```
index.html      Página (HTML semántico, Open Graph, JSON-LD)
styles.css      Estilos (mobile-first, paleta en :root)
main.js         Datos de contacto (CONFIG), textos ES/EN (TRADUCCIONES) y funciones
img/            Imágenes WebP (de relleno, «Foto pendiente»)
fonts/          Playfair Display e Inter (woff2, solo latín, licencia OFL)
_headers        Cabeceras de caché y seguridad para Cloudflare Pages
robots.txt, sitemap.xml
```

Sin frameworks ni proceso de compilación.

## Cómo editar

- **Textos (español e inglés):** `main.js` → `TRADUCCIONES`. Las claves coinciden con los atributos `data-i18n` del HTML. `index.html` lleva una copia del texto en español como respaldo sin JavaScript.
- **Teléfono, mapa, Instagram, correo:** `main.js` → `CONFIG`. Los botones y enlaces se activan solos cuando el valor deja de tener corchetes.
- **Imágenes:** sustituir los archivos de `img/` con el mismo nombre y tamaño (ver `PENDIENTES.md`).
- **Reconocimientos:** la sección está oculta con la clase `seccion--oculta`. Para mostrarla, quitar esa clase en `index.html`; el enlace del menú aparece solo.
- **Idioma:** español por defecto. El inglés se activa con el selector ES/EN o con `?lang=en`, y se recuerda en el navegador.

## Rendimiento

- Imágenes WebP con `loading="lazy"`. La foto de portada es la excepción: carga con prioridad alta porque es lo primero que se ve. Hay una versión vertical para móvil.
- Galería con miniaturas de 600 px; la versión de 1200 px solo se descarga al ampliar.
- El mapa de Google no se carga hasta que el visitante pulsa «Ver mapa» (ahorra más de 1 MB en conexiones lentas).
- Dos familias tipográficas alojadas en el propio sitio (unos 125 KB en total), con `font-display: swap`. No hay videos ni librerías externas.

## Publicar en Cloudflare Pages

1. En Cloudflare: **Workers & Pages → Crear → Pages → Conectar con Git** y elegir este repositorio (o «Subir recursos» y arrastrar la carpeta).
2. Configuración de compilación: framework **Ninguno**, comando de compilación **vacío**, directorio de salida **`/`**.
3. Antes de la versión definitiva: sustituir `[DOMINIO]` y quitar la etiqueta `noindex` de `index.html` (ver `PENDIENTES.md`, apartado 5).

Para probar en local: `python3 -m http.server` en esta carpeta y abrir `http://localhost:8000`.
