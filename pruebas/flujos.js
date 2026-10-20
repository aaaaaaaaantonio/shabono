/* Flujos de la demo de punta a punta. node pruebas/flujos.js [url] */
const { chromium } = require('playwright');
const URL = process.argv[2] || 'http://127.0.0.1:8765/index.html';
const fallos = [];
const ok = (c, m) => { if (!c) fallos.push(m); else console.log('  ✓ ' + m); };

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => fallos.push('Error JS: ' + e.message));
  const estado = () => p.evaluate(() => window.SB.almacen.estado);
  const existencia = (id) => p.evaluate((id) => window.SB.calc.existencia(window.SB.almacen.estado, id, window.SB.f.hoyISO()).util, id);
  const estados = (id) => p.evaluate((id) => { const e = window.SB.almacen.estado; return window.SB.calc.estadosProducto(e, e.productos.find((x) => x.id === id), window.SB.f.hoyISO()).map((s) => s.clave); }, id);
  const abrir = async (ruta) => { await p.goto(URL + '#/' + ruta); await p.waitForTimeout(80); };
  const clic = (sel) => p.evaluate((s) => Array.from(document.querySelectorAll(s)).find((x) => x.getClientRects().length).click(), sel);

  await p.goto(URL);
  await p.evaluate(() => localStorage.clear());
  await p.reload();
  await p.click('[data-rol="admin"]');
  console.log('Administración');

  // 1. Validación de la compra vacía
  await abrir('compras');
  await clic('[data-accion="nueva-compra"]');
  await p.click('dialog[open] button[type="submit"]');
  ok(await p.evaluate(() => document.querySelectorAll('dialog[open] [aria-invalid="true"]').length >= 3), 'Compra vacía: marca los campos con error');
  ok(await p.evaluate(() => document.activeElement && document.activeElement.id === 'nc-prov'), 'Compra vacía: el foco va al primer error');

  // 2. Registrar compra recibida de contado (Hortalizas, tomate)
  const tomateAntes = await existencia('tomate');
  const gastosAntes = (await estado()).gastos.length;
  await p.selectOption('#nc-prov', 'prov-saman');
  await p.selectOption('[name="prod-0"]', 'tomate');
  await p.fill('[name="cant-0"]', '10');
  await p.fill('[name="precio-0"]', '1.800');
  await p.locator('[name="precio-0"]').blur();
  ok((await p.inputValue('[name="precio-0"]')) === '1.800,00', 'Importe «1.800» se lee como mil ochocientos');
  await p.fill('[name="cant-0"]', '2.5');
  await p.locator('[name="cant-0"]').blur();
  ok((await p.inputValue('[name="cant-0"]')) === '2,5', 'Cantidad «2.5» con punto se lee como 2,5');
  await p.fill('[name="cant-0"]', '10');
  await p.fill('[name="precio-0"]', '1780,50');
  await p.locator('[name="precio-0"]').blur();
  ok((await p.inputValue('[name="precio-0"]')) === '1.780,50', 'Importe se formatea 1.780,50 al salir del campo');
  await p.check('[name="estado"][value="recibida"]');
  await p.click('dialog[open] button[type="submit"]');
  await p.waitForTimeout(80);
  ok(!(await p.evaluate(() => !!document.querySelector('dialog[open]'))), 'Compra recibida: se cierra el diálogo');
  ok(Math.abs((await existencia('tomate')) - tomateAntes - 10) < 0.001, 'Compra recibida: suma 10 kg de tomate');
  ok((await estado()).gastos.length === gastosAntes + 1, 'Compra de contado: anota el gasto');

  // 3. Recibir el pedido pendiente de mariscos (camarón y pulpo)
  ok((await estados('pulpo')).includes('agotado'), 'Antes: pulpo agotado');
  const cuentasAntes = (await estado()).cuentas.length;
  await abrir('compras?estado=pendiente&proveedor=prov-litoral');
  await clic('[data-accion="compra"]');
  await p.click('dialog[open] [data-recibir]');
  await p.waitForTimeout(60);
  await p.fill('[name="cant-1"]', '5');
  await p.click('dialog[open] button[type="submit"]');
  await p.waitForTimeout(80);
  ok(Math.abs((await existencia('pulpo')) - 5) < 0.001, 'Recepción: entran 5 kg de pulpo (cantidad cambiada)');
  ok(!(await estados('pulpo')).includes('agotado'), 'Recepción: el pulpo deja de estar agotado');
  ok((await estado()).cuentas.length === cuentasAntes + 1, 'Recepción a crédito: abre la cuenta por pagar');
  ok(await p.evaluate(() => { const e = window.SB.almacen.estado; return window.SB.calc.estadoPlato(e, e.platos.find((x) => x.id === 'plato-pulpo'), window.SB.f.hoyISO()).clave !== 'no-disponible'; }), 'El plato de pulpo vuelve a estar disponible');

  // 4. Ajuste (merma) y deshacer
  await abrir('inventario');
  const doradoAntes = await existencia('dorado');
  await clic('[data-accion="detalle"][data-id="dorado"]');
  await p.click('dialog[open] [data-ajustar]');
  await p.waitForTimeout(60);
  await p.check('[name="tipo"][value="merma"]');
  await p.fill('#aj-cantidad', '99');
  await p.click('dialog[open] button[type="submit"]');
  ok(await p.evaluate(() => /Solo hay/.test(document.querySelector('#aj-cantidad-error')?.textContent || '')), 'Merma mayor que la existencia: da error');
  await p.fill('#aj-cantidad', '1,5');
  await p.click('dialog[open] button[type="submit"]');
  ok(await p.evaluate(() => /motivo/i.test(document.querySelector('#aj-motivo-error')?.textContent || '')), 'Merma sin motivo: pide el motivo');
  await p.fill('#aj-motivo', 'Se cayó al piso');
  await p.click('dialog[open] button[type="submit"]');
  await p.waitForTimeout(80);
  ok(Math.abs(doradoAntes - (await existencia('dorado')) - 1.5) < 0.001, 'Merma: resta 1,5 kg de dorado');
  ok(await p.evaluate(() => document.activeElement && document.activeElement.matches('[data-accion="detalle"][data-id="dorado"]')), 'Al cerrar, el foco vuelve a la fila del producto');
  await p.click('#avisos .aviso:last-child .btn--sutil');
  await p.waitForTimeout(60);
  ok(Math.abs((await existencia('dorado')) - doradoAntes) < 0.001, 'Deshacer: el dorado vuelve a su existencia');

  // 5. Dar de baja el lote vencido de crema
  ok((await estados('crema')).includes('vencido'), 'Antes: crema con lote vencido');
  await clic('[data-accion="detalle"][data-id="crema"]');
  await p.click('dialog[open] [data-baja]');
  await p.waitForTimeout(60);
  ok(!(await estados('crema')).includes('vencido'), 'Baja: la crema ya no sale vencida');

  // 6. Filtro desde Inicio
  await abrir('inventario?estado=bajo-minimo');
  ok(await p.evaluate(() => { const e = window.SB.almacen.estado; const n = e.productos.filter((x) => window.SB.calc.estadosProducto(e, x, window.SB.f.hoyISO()).some((s) => s.clave === 'bajo-minimo')).length;
    return new RegExp('^' + n + ' productos?').test(document.querySelector('[data-cuenta]').textContent) && n === 3; }), 'Filtro bajo mínimo: 3 productos (el camarón ya llegó)');
  await clic('[data-accion="limpiar"]');
  ok(await p.evaluate(() => /^50 productos/.test(document.querySelector('[data-cuenta]').textContent) && location.hash === '#/inventario'), 'Limpiar filtros');

  // 7. Tasa
  await abrir('inicio');
  await clic('[data-tasa]');
  await p.fill('#tasa-valor', '1001,23456789');
  await p.click('dialog[open] button[type="submit"]');
  await p.waitForTimeout(60);
  ok(await p.evaluate(() => /€ 1 = Bs\. 1\.001,23/.test(document.querySelector('.franja').textContent)), 'Tasa nueva en la barra superior');
  ok(await p.evaluate(() => window.SB.calc.tasaActual(window.SB.almacen.estado).valor === 1001.23456789), 'La tasa se guarda con todos sus decimales');

  // 8. Precio de un plato
  await abrir('carta');
  await clic('[data-accion="plato"][data-id="plato-centro-lomito"]');
  await p.click('dialog[open] [data-sugerido]');
  await p.click('dialog[open] [data-simulador] button[type="submit"]');
  await p.waitForTimeout(60);
  ok(await p.evaluate(() => { const e = window.SB.almacen.estado; return window.SB.calc.estadoPlato(e, e.platos.find((x) => x.id === 'plato-centro-lomito'), window.SB.f.hoyISO()).clave === 'correcto'; }), 'Precio sugerido: el lomito vuelve a margen correcto');

  // 9. Ingreso del día y pago de una cuenta vencida
  const ingAntes = (await estado()).ingresos.length;
  await abrir('finanzas');
  await clic('[data-accion="ingreso"]');
  await p.fill('#in-bs', '450000');
  await p.fill('#in-eur', '210');
  await p.click('dialog[open] button[type="submit"]');
  await p.waitForTimeout(60);
  ok((await estado()).ingresos.length === ingAntes + 2, 'Ingreso del día: dos registros (Bs. y divisas)');
  await abrir('finanzas/por-pagar?estado=vencida');
  await clic('[data-accion="cuenta"]');
  await p.click('dialog[open] [data-pagar]');
  await p.waitForTimeout(60);
  await p.click('dialog[open] button[type="submit"]');
  await p.waitForTimeout(60);
  ok(await p.evaluate(() => window.SB.calc.porPagar(window.SB.almacen.estado, window.SB.f.hoyISO()).vencidas.length === 0), 'Pago: no quedan cuentas vencidas');

  // 10. Proveedor nuevo y eliminar con deshacer
  await abrir('compras/proveedores');
  await clic('[data-accion="nuevo-proveedor"]');
  await p.fill('#pv-nombre', 'Panadería de prueba');
  await p.fill('#pv-credito', '0');
  await p.click('dialog[open] button[type="submit"]');
  await p.waitForTimeout(60);
  const nuevo = (await estado()).proveedores.find((x) => x.nombre === 'Panadería de prueba');
  ok(!!nuevo, 'Proveedor nuevo agregado');
  await clic(`[data-accion="proveedor"][data-id="${nuevo.id}"]`);
  await p.click('dialog[open] [data-eliminar]');
  await p.waitForTimeout(60);
  ok(!(await estado()).proveedores.some((x) => x.id === nuevo.id), 'Proveedor eliminado');
  await p.click('#avisos .aviso:last-child .btn--sutil');
  await p.waitForTimeout(60);
  ok((await estado()).proveedores.some((x) => x.id === nuevo.id), 'Deshacer: el proveedor vuelve');

  // 11. Persistencia tras recargar
  await p.reload();
  await p.waitForTimeout(100);
  ok((await estado()).proveedores.some((x) => x.id === nuevo.id), 'Los cambios siguen tras recargar');

  // 12. Escape cierra y el foco vuelve
  await abrir('carta');
  await clic('[data-accion="plato"][data-id="plato-ajicero"]');
  await p.keyboard.press('Escape');
  await p.waitForTimeout(60);
  ok(await p.evaluate(() => document.activeElement.matches('[data-id="plato-ajicero"]')), 'Escape cierra el diálogo y devuelve el foco');

  // 13. Equipo de cocina: sin finanzas ni precios
  await clic('[data-menu-rol-boton]');
  await p.click('[data-cambiar-rol]');
  await p.click('[data-rol="equipo"]');
  await p.waitForTimeout(60);
  ok(!(await p.evaluate(() => !!document.querySelector('.nav-principal a[href="#/finanzas"]'))), 'Equipo: sin Finanzas en la navegación');
  await abrir('finanzas');
  ok(await p.evaluate(() => location.hash === '#/inicio'), 'Equipo: la ruta de finanzas lo devuelve a Inicio');
  await abrir('inventario');
  ok(await p.evaluate(() => !/€/.test(document.querySelector('[data-lista]').textContent)), 'Equipo: el inventario no muestra importes');
  await abrir('carta');
  ok(await p.evaluate(() => !/€|Margen/.test(document.querySelector('[data-lista]').textContent)), 'Equipo: la carta no muestra costos ni márgenes');

  // 14. Restablecer
  await clic('[data-menu-rol-boton]');
  await p.click('[data-restablecer]');
  await p.click('dialog[open] [data-si]');
  await p.waitForTimeout(100);
  ok(!(await estado()).proveedores.some((x) => x.id === nuevo.id), 'Restablecer: vuelven los datos de ejemplo');

  // 15. Sin almacenamiento (vista previa): funciona en memoria
  const ctx2 = await b.newContext();
  await ctx2.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new Error('bloqueado'); } }); });
  const p2 = await ctx2.newPage();
  p2.on('pageerror', (e) => fallos.push('Sin almacenamiento, error JS: ' + e.message));
  await p2.goto(URL);
  await p2.click('[data-rol="chef"]');
  await p2.waitForTimeout(80);
  ok(await p2.evaluate(() => /INICIO|Inicio/.test(document.querySelector('#titulo-pantalla').textContent)), 'Sin localStorage: entra y funciona en memoria');

  await b.close();
  console.log(fallos.length ? '\nFALLOS:\n' + fallos.join('\n') : '\nTodos los flujos pasan.');
  process.exit(fallos.length ? 1 : 0);
})();
