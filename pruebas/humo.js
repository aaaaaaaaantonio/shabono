/* Prueba rápida: errores de consola y capturas. node pruebas/humo.js [url] */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const URL = process.argv[2] || 'http://127.0.0.1:8765/index.html';
const salida = path.join(__dirname, 'capturas');
fs.mkdirSync(salida, { recursive: true });
(async () => {
  const b = await chromium.launch();
  const errores = [];
  for (const [nombre, vp] of [['tel', { width: 375, height: 812 }], ['pc', { width: 1440, height: 900 }]]) {
    const ctx = await b.newContext({ viewport: vp });
    const p = await ctx.newPage();
    p.on('console', (m) => { if (m.type() === 'error') errores.push(nombre + ' consola: ' + m.text()); });
    p.on('pageerror', (e) => errores.push(nombre + ' página: ' + e.message));
    await p.goto(URL);
    await p.screenshot({ path: path.join(salida, nombre + '-acceso.png'), fullPage: process.env.COMPLETA === '1' });
    await p.click('[data-rol="admin"]');
    for (const r of ['inicio', 'inventario', 'compras', 'compras/proveedores', 'compras/precios', 'carta', 'finanzas', 'finanzas/ingresos', 'finanzas/gastos', 'finanzas/por-pagar']) {
      await p.goto(URL + '#/' + r);
      await p.waitForTimeout(150);
      await p.screenshot({ path: path.join(salida, nombre + '-' + r.replace('/', '-') + '.png'), fullPage: process.env.COMPLETA === '1' });
    }
    await ctx.close();
  }
  await b.close();
  console.log(errores.length ? errores.join('\n') : 'Sin errores.');
})();
