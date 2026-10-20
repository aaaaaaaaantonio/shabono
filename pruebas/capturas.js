/* Capturas para revisar a ojo: node pruebas/capturas.js [url] → pruebas/capturas/ */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const URL = process.argv[2] || 'http://127.0.0.1:8765/index.html';
const salida = path.join(__dirname, 'capturas');
fs.mkdirSync(salida, { recursive: true });
const PLAN = [
  [320, 'admin', 'inicio'], [320, 'admin', 'compras/precios'], [768, 'admin', 'inicio'], [768, 'chef', 'inventario'], [768, 'admin', 'carta'],
  [1024, 'admin', 'finanzas/por-pagar'], [1024, 'admin', 'inventario'], [1440, 'admin', 'inicio'], [2560, 'admin', 'inventario'], [375, 'equipo', 'inicio'], [375, 'admin', 'finanzas'], [375, 'admin', 'inventario']
];
const DIALOGOS = [
  [375, 'admin', 'inventario', '[data-accion="detalle"][data-id="crema"]', 'tel-dlg-producto'],
  [375, 'admin', 'compras', '[data-accion="nueva-compra"]', 'tel-dlg-compra'],
  [1440, 'admin', 'carta', '[data-accion="plato"][data-id="plato-centro-lomito"]', 'pc-dlg-plato'],
  [1440, 'admin', 'compras/precios', '[data-accion="precio"][data-id="centro-lomito"]', 'pc-dlg-precio'],
  [1440, 'admin', 'inicio', '.tasa--franja', 'pc-dlg-tasa']
];
(async () => {
  const b = await chromium.launch();
  for (const [ancho, rol, ruta] of PLAN) {
    const p = await b.newPage({ viewport: { width: ancho, height: ancho < 700 ? 780 : 900 } });
    await p.goto(URL); await p.evaluate((r) => localStorage.setItem('shabono-gestion-rol', r), rol);
    await p.goto(URL + '#/' + ruta); await p.reload(); await p.waitForTimeout(150);
    await p.screenshot({ path: path.join(salida, `${ancho}-${rol}-${ruta.replace(/\W/g, '-')}.png`), fullPage: process.env.COMPLETA === '1' });
    await p.close();
  }
  for (const [ancho, rol, ruta, sel, nombre] of DIALOGOS) {
    const p = await b.newPage({ viewport: { width: ancho, height: ancho < 700 ? 780 : 900 } });
    await p.goto(URL); await p.evaluate((r) => localStorage.setItem('shabono-gestion-rol', r), rol);
    await p.goto(URL + '#/' + ruta); await p.reload(); await p.waitForTimeout(150);
    await p.evaluate((s) => Array.from(document.querySelectorAll(s)).find((x) => x.getClientRects().length).click(), sel);
    await p.waitForTimeout(200);
    await p.screenshot({ path: path.join(salida, nombre + '.png') });
    await p.close();
  }
  await b.close();
  console.log('Capturas en', salida);
})();
