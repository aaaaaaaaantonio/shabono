/* Comprueba dist/vista-previa.html abierto como archivo, sin servidor. */
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  const errores = [];
  p.on('pageerror', (e) => errores.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error') errores.push(m.text()); });
  await p.goto('file://' + path.join(__dirname, '..', 'dist', 'vista-previa.html'));
  await p.waitForTimeout(300);
  const logo = await p.evaluate(() => { const i = document.querySelector('.acceso__logo'); return i.complete && i.naturalWidth > 0; });
  await p.click('[data-rol="admin"]');
  await p.waitForTimeout(300);
  const datos = await p.evaluate(() => ({
    titulo: document.querySelector('#titulo-pantalla').textContent,
    alertas: document.querySelectorAll('.alerta').length,
    fuente: document.fonts.check('16px Inter') && document.fonts.check('16px "Playfair Display"'),
    marca: (() => { const i = document.querySelector('.marca__logo'); return i.complete && i.naturalWidth > 0; })()
  }));
  console.log({ logo, ...datos, errores });
  await b.close();
  process.exit(errores.length || !logo || !datos.alertas ? 1 : 0);
})();
