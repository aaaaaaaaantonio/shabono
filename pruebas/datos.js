/* Comprueba los datos de ejemplo sin navegador: node pruebas/datos.js [aaaa-mm-dd] */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const raiz = path.join(__dirname, '..');
const ctx = { window: {}, Intl, Math, Date, Number, String, Object, Array, JSON, console };
ctx.window = ctx;
vm.createContext(ctx);
['formato', 'semilla', 'calculos'].forEach((n) => vm.runInContext(fs.readFileSync(path.join(raiz, 'js', n + '.js'), 'utf8'), ctx));
const SB = ctx.SB, f = SB.f, c = SB.calc;
const hoy = process.argv[2] || f.hoyISO();
const e = SB.semilla.generar(hoy);
const fallos = [];
const ok = (cond, msg) => { if (!cond) fallos.push(msg); };

console.log('Hoy', hoy, '· tasa', c.tasaActual(e).valor, c.tasaActual(e).fecha);
console.log('Registros:', Object.fromEntries(Object.entries(e).filter(([, v]) => Array.isArray(v)).map(([k, v]) => [k, v.length])));

// Estados de productos
const por = {};
e.productos.forEach((p) => {
  const est = c.estadosProducto(e, p, hoy);
  (por[est[0].clave] = por[est[0].clave] || []).push(p.nombre + ' (' + f.cantidad(c.existencia(e, p.id, hoy).util, p.unidad) + ')');
});
console.log('\nEstado principal de cada producto:');
Object.entries(por).forEach(([k, v]) => console.log(' ', k.padEnd(13), v.length, v.join(' · ')));
const semana = e.productos.filter((p) => c.venceEnDias(e, p.id, hoy, 7)).map((p) => p.nombre + ' ' + f.vence(c.proximoVence(e, p.id, hoy), hoy));
console.log('\nVencen esta semana:', semana.length, '\n  ' + semana.join('\n  '));

// Coherencia: existencia = entradas - salidas
e.productos.forEach((p) => {
  const mov = e.movimientos.filter((m) => m.productoId === p.id);
  const ent = mov.filter((m) => m.tipo === 'entrada').reduce((s, m) => s + m.cantidad, 0);
  const sal = mov.filter((m) => m.tipo !== 'entrada').reduce((s, m) => s + m.cantidad, 0);
  const lotes = e.lotes.filter((l) => l.productoId === p.id).reduce((s, l) => s + l.cantidad, 0);
  ok(Math.abs(ent - sal - lotes) < 0.001, 'Movimientos no cuadran: ' + p.nombre + ' ' + ent + ' - ' + sal + ' != ' + lotes);
  ok(mov.every((m) => m.fecha <= hoy), 'Movimiento en el futuro: ' + p.nombre);
});
// Compras: total = suma de líneas
e.compras.forEach((co) => {
  const s = co.lineas.reduce((a, l) => a + f.redondear(l.precio * l.cantidad, 2), 0);
  ok(Math.abs(s - co.total.monto) < 0.01, 'Total de compra no cuadra ' + co.id);
});

// Platos
console.log('\nPlatos (costo actual · costo hace 8 semanas · precio · costo%):');
e.platos.forEach((pl) => {
  const ahora = c.costoPlato(e, pl).total;
  const antes = c.costoPlato(e, pl, f.sumarDias(hoy, -49)).total;
  const est = c.estadoPlato(e, pl, hoy);
  console.log(' ', pl.nombre.padEnd(32), f.eur(ahora).padStart(9), f.eur(antes).padStart(9), f.eur(pl.precio).padStart(9),
    f.pct(ahora / pl.precio).padStart(8), f.pct(antes / pl.precio).padStart(8), est.texto);
});

// Cuentas
console.log('\nCuentas por pagar abiertas:');
e.cuentas.filter((x) => !x.pagada).forEach((x) => console.log(' ', c.estadoCuenta(x, hoy).texto.padEnd(13), x.acreedor.padEnd(28), f.fecha(x.vence), f.eur(x.dinero.eur)));

// Finanzas
console.log('\nMeses:');
c.mesesConDatos(e).forEach((m) => {
  const t = c.totalesMes(e, m);
  console.log(' ', m, 'días', t.dias, 'ingresos', f.eur(t.ingresos.eur), 'gastos', f.eur(t.gastos.eur), 'resultado', f.eur(t.resultado.eur),
    '(' + (t.ingresos.eur ? f.pct(t.resultado.eur / t.ingresos.eur) : '-') + ')');
  t.porCategoria.forEach((g) => console.log('     ', g.categoria.padEnd(24), f.eur(g.eur)));
});
console.log('\nSemanas:'); c.semanas(e, hoy, 8).forEach((s) => console.log(' ', s.desde, f.eur(s.ingresos), f.eur(s.gastos), f.eur(s.resultado)));
console.log('\nValor del inventario', c.valorInventario(e, hoy));
console.log('\nAlertas:'); c.alertas(e, hoy, () => true).forEach((a) => console.log(' ', a.nivel.padEnd(8), a.titulo, '·', a.detalle));
console.log('\nPrecios del centro de lomito:', c.preciosPorProveedor(e, 'centro-lomito').map((x) => [f.eur(x.primero.eur), f.eur(x.ultimo.eur), f.pct(x.variacionPeriodo)]));
console.log('Precios del pollo:', c.preciosPorProveedor(e, 'pollo').map((x) => [x.proveedorId, f.eur(x.ultimo.eur), x.mejor]));
console.log('Tamaño JSON', JSON.stringify(e).length, 'bytes');

if (fallos.length) { console.log('\nFALLOS:\n' + fallos.join('\n')); process.exit(1); }
console.log('\nSin fallos de coherencia.');
