/* Revisión automática: axe-core (WCAG 2.2 A/AA + buenas prácticas) y desbordamiento lateral
   de 320 a 2560 px, en las tres funciones y con los diálogos abiertos.
   node pruebas/revisar.js [url]   (necesita playwright y pruebas/node_modules/axe-core) */
const { chromium } = require('playwright');
const path = require('path');
const URL = process.argv[2] || 'http://127.0.0.1:8765/index.html';
const AXE = path.join(__dirname, 'node_modules/axe-core/axe.min.js');
const ANCHOS = [320, 375, 768, 1024, 1440, 2560];
const RUTAS = ['inicio', 'inventario', 'inventario?estado=bajo-minimo', 'compras', 'compras/proveedores', 'compras/precios', 'carta',
  'finanzas', 'finanzas/ingresos', 'finanzas/gastos', 'finanzas/por-pagar'];
const ROLES = ['admin', 'chef', 'equipo'];
/* Diálogos: [ruta, selector que lo abre, nombre] */
const DIALOGOS = [
  ['inventario', '[data-accion="detalle"][data-id="crema"]', 'detalle de producto'],
  ['inventario', '[data-accion="ajustar"]', 'ajustar existencias'],
  ['inventario', '[data-accion="nuevo"]', 'nuevo producto'],
  ['compras', '[data-accion="nueva-compra"]', 'registrar compra'],
  ['compras?estado=pendiente', '[data-accion="compra"]', 'detalle de compra'],
  ['compras/proveedores', '[data-accion="proveedor"]', 'detalle de proveedor'],
  ['compras/proveedores', '[data-accion="nuevo-proveedor"]', 'nuevo proveedor'],
  ['compras/precios', '[data-accion="precio"][data-id="centro-lomito"]', 'historial de precio'],
  ['carta', '[data-accion="plato"][data-id="plato-centro-lomito"]', 'detalle de plato'],
  ['carta', '[data-accion="nuevo"]', 'nuevo plato'],
  ['carta', '[data-accion="objetivo"]', 'objetivo de costo'],
  ['finanzas', '[data-accion="ingreso"]', 'registrar ingreso'],
  ['finanzas/gastos', '[data-accion="gasto"]', 'registrar gasto'],
  ['finanzas/por-pagar', '[data-accion="cuenta"]', 'detalle de cuenta'],
  ['inicio', '.tasa--franja, .tasa--cabecera', 'actualizar tasa']
];

async function visible(p, sel) {
  return p.evaluate((s) => Array.from(document.querySelectorAll(s)).find((x) => x.getClientRects().length > 0) ? true : false, sel);
}
async function clicVisible(p, sel) {
  await p.evaluate((s) => Array.from(document.querySelectorAll(s)).find((x) => x.getClientRects().length > 0).click(), sel);
}
async function axe(p) {
  await p.addScriptTag({ path: AXE });
  return p.evaluate(async () => {
    const r = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] } });
    return r.violations.map((v) => ({ id: v.id, impacto: v.impact, n: v.nodes.length, ejemplo: v.nodes.slice(0, 3).map((n) => n.target.join(' ') + ' → ' + (n.failureSummary || '').split('\n').slice(1, 2).join('')) }));
  });
}
async function desborde(p) {
  return p.evaluate(() => {
    const d = document.documentElement;
    const ancho = d.clientWidth;
    if (d.scrollWidth <= ancho + 0) return null;
    const culpables = Array.from(document.querySelectorAll('body *')).filter((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && (r.right > ancho + 1 || r.left < -1) && getComputedStyle(el).position !== 'fixed';
    }).slice(0, 4).map((el) => el.tagName.toLowerCase() + '.' + (el.className && el.className.baseVal === undefined ? el.className : '').toString().split(' ').join('.') + ' ' + Math.round(el.getBoundingClientRect().right));
    return { scroll: d.scrollWidth, ancho, culpables };
  });
}

(async () => {
  const b = await chromium.launch();
  const fallos = [];
  const avisos = new Map();
  const anotar = (donde, vs) => vs.forEach((v) => {
    const k = v.id;
    if (!avisos.has(k)) avisos.set(k, { impacto: v.impacto, donde: [], ejemplo: v.ejemplo });
    avisos.get(k).donde.push(donde);
  });
  for (const rol of ROLES) {
    for (const ancho of ANCHOS) {
      const ctx = await b.newContext({ viewport: { width: ancho, height: ancho < 700 ? 780 : 900 } });
      const p = await ctx.newPage();
      p.on('pageerror', (e) => fallos.push(`${rol} ${ancho}: error JS ${e.message}`));
      await p.goto(URL);
      if (rol === ROLES[0]) {
        const d0 = await desborde(p); if (d0) fallos.push(`acceso ${ancho}: desborda ${JSON.stringify(d0)}`);
        if (ancho === 375 || ancho === 1440) anotar(`acceso ${ancho}`, await axe(p));
      }
      await p.click(`[data-rol="${rol}"]`);
      for (const r of RUTAS) {
        await p.goto(URL + '#/' + r);
        await p.waitForTimeout(60);
        const d = await desborde(p);
        if (d) fallos.push(`${rol} ${ancho} ${r}: desborda ${JSON.stringify(d)}`);
        if (ancho === 375 || ancho === 1440 || (ancho === 768 && rol === 'admin')) anotar(`${rol} ${ancho} ${r}`, await axe(p));
      }
      if (ancho === 320 || ancho === 375 || ancho === 1440 || ancho === 768) {
        for (const [ruta, sel, nombre] of DIALOGOS) {
          await p.goto(URL + '#/' + ruta);
          await p.waitForTimeout(60);
          if (!(await visible(p, sel))) continue;   // ese rol no tiene el botón
          await clicVisible(p, sel);
          await p.waitForTimeout(80);
          const abierto = await p.evaluate(() => !!document.querySelector('dialog[open]'));
          if (!abierto) { fallos.push(`${rol} ${ancho}: no se abrió «${nombre}»`); continue; }
          const d = await desborde(p);
          if (d) fallos.push(`${rol} ${ancho} diálogo ${nombre}: desborda ${JSON.stringify(d)}`);
          const dd = await p.evaluate(() => { const x = document.querySelector('dialog[open] .dialogo__cuerpo'); return x.scrollWidth > x.clientWidth + 1 ? [x.scrollWidth, x.clientWidth] : null; });
          if (dd) fallos.push(`${rol} ${ancho} diálogo ${nombre}: el cuerpo se desplaza de lado ${dd}`);
          if (ancho !== 768) anotar(`${rol} ${ancho} diálogo ${nombre}`, await axe(p));
          await p.keyboard.press('Escape');
          await p.waitForTimeout(40);
        }
      }
      await ctx.close();
    }
  }
  await b.close();
  console.log('== Desbordamiento y errores ==');
  console.log(fallos.length ? fallos.join('\n') : 'Ninguno.');
  console.log('\n== axe ==');
  if (!avisos.size) console.log('Sin fallos de accesibilidad.');
  for (const [id, v] of avisos) console.log(`${id} (${v.impacto}) en ${v.donde.length} pantallas, p. ej. ${v.donde.slice(0, 3).join(' | ')}\n   ${v.ejemplo.join('\n   ')}`);
  process.exit(fallos.length || avisos.size ? 1 : 0);
})();
