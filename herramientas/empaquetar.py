"""Empaqueta la demo.

  python3 herramientas/empaquetar.py

Crea en dist/ (no se sube al repositorio):
  - shabono-gestion.zip: lo que se sube a Cloudflare Pages (index.html en la raíz del zip).
  - vista-previa.html: un solo archivo con todo dentro (CSS, JS, fuentes e imágenes) para verla sin servidor.
"""
import base64
import pathlib
import re
import zipfile

RAIZ = pathlib.Path(__file__).resolve().parent.parent
DIST = RAIZ / 'dist'
PUBLICAR = ['index.html', 'manifest.webmanifest', 'tokens.css', 'app.css', '_headers', 'robots.txt', 'js', 'img', 'fonts', 'licencias']


def archivos():
    for nombre in PUBLICAR:
        ruta = RAIZ / nombre
        if ruta.is_dir():
            yield from sorted(p for p in ruta.rglob('*') if p.is_file())
        elif ruta.exists():
            yield ruta


def zip_cloudflare():
    destino = DIST / 'shabono-gestion.zip'
    with zipfile.ZipFile(destino, 'w', zipfile.ZIP_DEFLATED) as z:
        for p in archivos():
            z.write(p, p.relative_to(RAIZ).as_posix())
    return destino


def data_uri(ruta, tipo):
    return f'data:{tipo};base64,' + base64.b64encode(ruta.read_bytes()).decode('ascii')


def vista_previa():
    html = (RAIZ / 'index.html').read_text(encoding='utf-8')

    def css(nombre):
        texto = (RAIZ / nombre).read_text(encoding='utf-8')
        return re.sub(r'url\("(fonts/[^"]+)"\)', lambda m: f'url("{data_uri(RAIZ / m.group(1), "font/woff2")}")', texto)

    html = re.sub(r'\s*<link rel="preload"[^>]*>', '', html)
    # Instalación en el teléfono: solo tiene sentido publicada; en el archivo suelto se quita
    html = re.sub(r'\s*<link rel="(manifest|apple-touch-icon)"[^>]*>', '', html)
    html = re.sub(r'<link rel="stylesheet" href="([^"]+)">', lambda m: '<style>\n' + css(m.group(1)) + '\n</style>', html)
    html = re.sub(r'<script src="([^"]+)" defer></script>',
                  lambda m: '<script>\n' + (RAIZ / m.group(1)).read_text(encoding='utf-8').replace('</script', '<\\/script') + '\n</script>', html)
    # Los scripts en línea no esperan al DOM: se mueven al final del body
    scripts = re.findall(r'<script>\n.*?\n</script>', html, flags=re.S)
    for s in scripts:
        html = html.replace(s, '', 1)
    html = html.replace('</body>', '\n'.join(scripts) + '\n</body>')
    # Imágenes que pide el JS o el HTML
    for img in sorted((RAIZ / 'img').glob('*.svg')):
        html = html.replace(f'img/{img.name}', data_uri(img, 'image/svg+xml'))
    destino = DIST / 'vista-previa.html'
    destino.write_text(html, encoding='utf-8')
    return destino


if __name__ == '__main__':
    DIST.mkdir(exist_ok=True)
    for r in (zip_cloudflare(), vista_previa()):
        print(f'{r.relative_to(RAIZ)}  {r.stat().st_size / 1024:.0f} KB')
