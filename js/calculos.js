/* Cálculos: todo total, estado, margen o alerta sale de los registros guardados. */
(function (SB) {
  'use strict';

  var f = SB.f;
  var PESO = { peligro: 3, aviso: 2, info: 1, ok: 0 };

  function porId(lista, id) { return lista.find(function (x) { return x.id === id; }); }
  function suma(lista, fn) { return lista.reduce(function (s, x) { return s + fn(x); }, 0); }

  /* ---------- Tasa ---------- */
  function tasaActual(e) {
    var t = e.tasas[0];
    e.tasas.forEach(function (x) { if (x.fecha >= t.fecha) t = x; });
    return t;
  }

  /* ---------- Inventario ---------- */
  function diasAviso(e, p) { return p.diasAviso === null || p.diasAviso === undefined ? e.config.diasAviso : p.diasAviso; }

  function lotesDe(e, pid) {
    return e.lotes.filter(function (l) { return l.productoId === pid && l.cantidad > 0; })
      .sort(function (a, b) {
        if (a.vence && b.vence && a.vence !== b.vence) return a.vence < b.vence ? -1 : 1;
        if (a.vence && !b.vence) return -1;
        if (!a.vence && b.vence) return 1;
        return a.entrada < b.entrada ? -1 : 1;
      });
  }
  function loteVencido(l, hoy) { return !!l.vence && l.vence < hoy; }

  function existencia(e, pid, hoy) {
    var util = 0;
    var vencida = 0;
    lotesDe(e, pid).forEach(function (l) { if (loteVencido(l, hoy)) vencida += l.cantidad; else util += l.cantidad; });
    return { util: f.redondear(util, 3), vencida: f.redondear(vencida, 3) };
  }

  function proximoVence(e, pid, hoy) {
    var lotes = lotesDe(e, pid).filter(function (l) { return l.vence && !loteVencido(l, hoy); });
    return lotes.length ? lotes[0].vence : null;
  }

  function comprasPendientesDe(e, pid) {
    return e.compras.filter(function (c) {
      return c.estado === 'pendiente' && c.lineas.some(function (l) { return l.productoId === pid; });
    });
  }

  var ORDEN = ['agotado', 'vencido', 'bajo-minimo', 'vence-pronto', 'pendiente', 'suficiente'];

  function estadosProducto(e, p, hoy) {
    var ex = existencia(e, p.id, hoy);
    var r = [];
    var u = p.unidad;
    if (ex.util <= 0) {
      r.push({ clave: 'agotado', nivel: 'peligro', texto: 'Agotado', detalle: 'No quedan existencias utilizables.' });
    }
    if (ex.vencida > 0) {
      var lv = lotesDe(e, p.id).filter(function (l) { return loteVencido(l, hoy); });
      r.push({ clave: 'vencido', nivel: 'peligro', texto: 'Vencido',
        detalle: f.cantidad(ex.vencida, u) + ' vencido' + (lv.length ? ' · ' + f.vence(lv[0].vence, hoy) : '') + '. Hay que darlo de baja.' });
    }
    if (ex.util > 0 && ex.util <= p.minimo) {
      r.push({ clave: 'bajo-minimo', nivel: 'aviso', texto: 'Bajo mínimo',
        detalle: 'Quedan ' + f.cantidad(ex.util, u) + '; el mínimo es ' + f.cantidad(p.minimo, u) + '.' });
    }
    var pv = proximoVence(e, p.id, hoy);
    if (pv && f.diasEntre(hoy, pv) <= diasAviso(e, p)) {
      r.push({ clave: 'vence-pronto', nivel: 'aviso', texto: 'Vence pronto', detalle: f.vence(pv, hoy) + '.' });
    }
    var pend = comprasPendientesDe(e, p.id);
    if (pend.length) {
      var c = pend[0];
      var prov = porId(e.proveedores, c.proveedorId);
      var linea = c.lineas.find(function (l) { return l.productoId === p.id; });
      r.push({ clave: 'pendiente', nivel: 'info', texto: 'Pendiente',
        detalle: 'Pedido de ' + f.cantidad(linea.cantidad, u) + ' a ' + (prov ? prov.nombre : 'un proveedor') + ' el ' + f.fecha(c.fecha) + ', sin recibir.' });
    }
    if (!r.length) r.push({ clave: 'suficiente', nivel: 'ok', texto: 'Suficiente', detalle: 'Existencias por encima del mínimo.' });
    r.sort(function (a, b) { return PESO[b.nivel] - PESO[a.nivel] || ORDEN.indexOf(a.clave) - ORDEN.indexOf(b.clave); });
    return r;
  }

  function venceEnDias(e, pid, hoy, dias) {
    var pv = proximoVence(e, pid, hoy);
    return !!pv && f.diasEntre(hoy, pv) <= dias;
  }

  function valorProducto(e, pid, hoy) {
    return suma(lotesDe(e, pid).filter(function (l) { return !loteVencido(l, hoy); }), function (l) { return l.cantidad * l.costoEUR; });
  }
  function valorInventario(e, hoy) {
    var eur = f.redondear(suma(e.productos, function (p) { return valorProducto(e, p.id, hoy); }), 2);
    return { eur: eur, bs: f.redondear(eur * tasaActual(e).valor, 2) };
  }

  /* Resta del inventario empezando por lo que vence antes (salidas, mermas) */
  function descontar(e, pid, cantidad, hoy, incluirVencidos) {
    var resto = cantidad;
    var tocados = [];
    lotesDe(e, pid).forEach(function (l) {
      if (resto <= 0) return;
      if (!incluirVencidos && loteVencido(l, hoy)) return;
      var usa = Math.min(l.cantidad, resto);
      l.cantidad = f.redondear(l.cantidad - usa, 3);
      resto = f.redondear(resto - usa, 3);
      tocados.push({ loteId: l.id, cantidad: usa });
    });
    return tocados;
  }

  /* ---------- Precios de proveedores (salen de las compras recibidas) ---------- */
  function historialPrecios(e, pid) {
    var r = [];
    e.compras.forEach(function (c) {
      if (c.estado !== 'recibida') return;
      c.lineas.forEach(function (l) {
        if (l.productoId !== pid) return;
        r.push({ fecha: c.recibida, proveedorId: c.proveedorId, moneda: c.moneda, precio: l.precio, tasa: c.tasa,
          eur: c.moneda === 'EUR' ? l.precio : l.precio / c.tasa, compraId: c.id });
      });
    });
    return r.sort(function (a, b) { return a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0; });
  }

  function ultimoPrecio(e, pid, hasta) {
    var h = historialPrecios(e, pid).filter(function (x) { return !hasta || x.fecha <= hasta; });
    return h.length ? h[h.length - 1] : null;
  }

  function preciosPorProveedor(e, pid) {
    var h = historialPrecios(e, pid);
    var grupos = {};
    h.forEach(function (x) { (grupos[x.proveedorId] = grupos[x.proveedorId] || []).push(x); });
    var lista = Object.keys(grupos).map(function (k) {
      var g = grupos[k];
      var ultimo = g[g.length - 1];
      var primero = g[0];
      var anterior = g.length > 1 ? g[g.length - 2] : null;
      return {
        proveedorId: k, ultimo: ultimo, anterior: anterior, primero: primero, registros: g.length,
        variacion: anterior ? (ultimo.eur - anterior.eur) / anterior.eur : null,
        variacionPeriodo: g.length > 1 ? (ultimo.eur - primero.eur) / primero.eur : null
      };
    });
    if (lista.length > 1) {
      var mejor = lista.reduce(function (a, b) { return b.ultimo.eur < a.ultimo.eur ? b : a; });
      mejor.mejor = true;
    }
    return lista.sort(function (a, b) { return a.ultimo.eur - b.ultimo.eur; });
  }

  /* ---------- Platos ---------- */
  function costoPlato(e, plato, hasta) {
    var lineas = plato.receta.map(function (r) {
      var p = porId(e.productos, r.productoId);
      var up = ultimoPrecio(e, r.productoId, hasta);
      var costoUnit = up ? up.eur : null;
      return { producto: p, productoId: r.productoId, cantidad: r.cantidad, costoUnit: costoUnit,
        subtotal: costoUnit === null ? 0 : costoUnit * r.cantidad, sinPrecio: costoUnit === null };
    });
    return { total: f.redondear(suma(lineas, function (l) { return l.subtotal; }), 4), lineas: lineas,
      completo: lineas.every(function (l) { return !l.sinPrecio; }) };
  }

  function margen(costo, precio) {
    if (!precio) return { costoPct: null, margen: null, margenPct: null };
    return { costoPct: costo / precio, margen: precio - costo, margenPct: (precio - costo) / precio };
  }

  function precioSugerido(costo, objetivo) { return Math.ceil(costo / objetivo * 2) / 2; }

  function estadoPlato(e, plato, hoy) {
    if (!plato.receta.length) return { clave: 'sin-ficha', nivel: 'info', texto: 'Sin ficha', detalle: 'Falta la ficha técnica para calcular el costo.' };
    var agotados = plato.receta.map(function (r) { return porId(e.productos, r.productoId); })
      .filter(function (p) { return p && existencia(e, p.id, hoy).util <= 0; });
    if (agotados.length) {
      return { clave: 'no-disponible', nivel: 'peligro', texto: 'No disponible',
        detalle: 'Falta ' + agotados.map(function (p) { return p.nombre.toLowerCase(); }).join(', ') + ' (agotado).' };
    }
    if (!plato.precio) return { clave: 'sin-precio', nivel: 'info', texto: 'Sin precio', detalle: 'Falta el precio de venta.' };
    var c = costoPlato(e, plato);
    var m = margen(c.total, plato.precio);
    if (m.costoPct > e.config.objetivoCosto) {
      return { clave: 'margen-bajo', nivel: 'aviso', texto: 'Margen bajo',
        detalle: 'El costo es el ' + f.pct(m.costoPct) + ' del precio; el objetivo es ' + f.pct(e.config.objetivoCosto) + ' o menos.' };
    }
    return { clave: 'correcto', nivel: 'ok', texto: 'Margen correcto', detalle: 'El costo está dentro del objetivo.' };
  }

  function evolucionCosto(e, plato, hoy, semanas) {
    var r = [];
    for (var i = semanas - 1; i >= 0; i -= 1) {
      var fecha = f.sumarDias(hoy, -7 * i);
      r.push({ fecha: fecha, costo: costoPlato(e, plato, fecha).total });
    }
    return r;
  }

  /* ---------- Cuentas por pagar ---------- */
  function estadoCuenta(c, hoy) {
    if (c.pagada) return { clave: 'pagada', nivel: 'ok', texto: 'Pagada' };
    var d = f.diasEntre(hoy, c.vence);
    if (d < 0) return { clave: 'vencida', nivel: 'peligro', texto: 'Vencida' };
    if (d <= 7) return { clave: 'vence-pronto', nivel: 'aviso', texto: 'Vence pronto' };
    return { clave: 'pendiente', nivel: 'info', texto: 'Pendiente' };
  }

  function porPagar(e, hoy) {
    var abiertas = e.cuentas.filter(function (c) { return !c.pagada; });
    return {
      n: abiertas.length,
      eur: f.redondear(suma(abiertas, function (c) { return c.dinero.eur; }), 2),
      bs: f.redondear(suma(abiertas, function (c) { return c.dinero.bs; }), 2),
      vencidas: abiertas.filter(function (c) { return estadoCuenta(c, hoy).clave === 'vencida'; }),
      semana: abiertas.filter(function (c) { return estadoCuenta(c, hoy).clave === 'vence-pronto'; })
    };
  }

  /* ---------- Finanzas ---------- */
  function sumaDinero(lista) {
    return { eur: f.redondear(suma(lista, function (x) { return x.dinero.eur; }), 2),
      bs: f.redondear(suma(lista, function (x) { return x.dinero.bs; }), 2), n: lista.length };
  }

  function totalesPeriodo(e, desde, hasta) {
    var enRango = function (x) { return x.fecha >= desde && x.fecha <= hasta; };
    var ing = e.ingresos.filter(enRango);
    var gas = e.gastos.filter(enRango);
    var ingresos = sumaDinero(ing);
    var gastos = sumaDinero(gas);
    var cats = {};
    gas.forEach(function (g) { (cats[g.categoria] = cats[g.categoria] || []).push(g); });
    var porCategoria = Object.keys(cats).map(function (k) { var s = sumaDinero(cats[k]); s.categoria = k; return s; })
      .sort(function (a, b) { return b.eur - a.eur; });
    return {
      ingresos: ingresos,
      ingresosBs: sumaDinero(ing.filter(function (x) { return x.dinero.moneda === 'VES'; })),
      ingresosDivisas: sumaDinero(ing.filter(function (x) { return x.dinero.moneda === 'EUR'; })),
      gastos: gastos,
      resultado: { eur: f.redondear(ingresos.eur - gastos.eur, 2), bs: f.redondear(ingresos.bs - gastos.bs, 2) },
      porCategoria: porCategoria,
      dias: Object.keys(ing.reduce(function (o, x) { o[x.fecha] = 1; return o; }, {})).length
    };
  }

  function rangoMes(mes) {
    var desde = mes + '-01';
    var d = f.aFecha(desde);
    var fin = f.iso(new Date(d.getFullYear(), d.getMonth() + 1, 0));
    return [desde, fin];
  }
  function totalesMes(e, mes) { var r = rangoMes(mes); return totalesPeriodo(e, r[0], r[1]); }

  function mesesConDatos(e) {
    var m = {};
    e.ingresos.concat(e.gastos).forEach(function (x) { m[x.fecha.slice(0, 7)] = 1; });
    return Object.keys(m).sort().reverse();
  }

  /* Semanas de lunes a domingo; la última es la semana en curso */
  function semanas(e, hoy, n) {
    var d = f.aFecha(hoy);
    var lunes = f.sumarDias(hoy, -((d.getDay() + 6) % 7));
    var r = [];
    for (var i = n - 1; i >= 0; i -= 1) {
      var desde = f.sumarDias(lunes, -7 * i);
      var hasta = f.sumarDias(desde, 6);
      var t = totalesPeriodo(e, desde, hasta);
      r.push({ desde: desde, hasta: hasta, ingresos: t.ingresos.eur, gastos: t.gastos.eur, resultado: t.resultado.eur, enCurso: i === 0 });
    }
    return r;
  }

  /* ---------- Alertas de Inicio ---------- */
  function alertas(e, hoy, puede) {
    var r = [];
    var conEstado = e.productos.map(function (p) { return { p: p, estados: estadosProducto(e, p, hoy) }; });
    function cuenta(clave) { return conEstado.filter(function (x) { return x.estados.some(function (s) { return s.clave === clave; }); }); }
    function nombres(lista) {
      var n = lista.map(function (x) { return (x.p || x).nombre; });
      return n.length > 3 ? n.slice(0, 3).join(', ') + ' y ' + (n.length - 3) + ' más' : n.join(', ');
    }
    function plural(n, uno, varios) { return n + ' ' + (n === 1 ? uno : varios); }

    var agotados = cuenta('agotado');
    if (agotados.length) r.push({ nivel: 'peligro', texto: 'Agotado', titulo: plural(agotados.length, 'producto agotado', 'productos agotados'), detalle: nombres(agotados), enlace: '#/inventario?estado=agotado' });
    var vencidos = cuenta('vencido');
    if (vencidos.length) r.push({ nivel: 'peligro', texto: 'Vencido', titulo: plural(vencidos.length, 'producto con un lote vencido', 'productos con lotes vencidos'), detalle: nombres(vencidos) + ' · hay que darlo de baja', enlace: '#/inventario?estado=vencido' });

    var platosEstado = e.platos.map(function (pl) { return { p: pl, estado: estadoPlato(e, pl, hoy) }; });
    var noDisp = platosEstado.filter(function (x) { return x.estado.clave === 'no-disponible'; });
    if (noDisp.length) r.push({ nivel: 'peligro', texto: 'No disponible', titulo: plural(noDisp.length, 'plato no disponible', 'platos no disponibles'), detalle: nombres(noDisp) + ' · le falta un insumo agotado', enlace: '#/carta?estado=no-disponible' });

    var pp = porPagar(e, hoy);
    if (puede('verFinanzas') && pp.vencidas.length) r.push({ nivel: 'peligro', texto: 'Vencida', titulo: plural(pp.vencidas.length, 'cuenta por pagar vencida', 'cuentas por pagar vencidas'), detalle: pp.vencidas.map(function (c) { return c.acreedor; }).join(', '), enlace: '#/finanzas/por-pagar?estado=vencida' });

    var bajo = cuenta('bajo-minimo');
    if (bajo.length) r.push({ nivel: 'aviso', texto: 'Bajo mínimo', titulo: plural(bajo.length, 'producto bajo mínimo', 'productos bajo mínimo'), detalle: nombres(bajo), enlace: '#/inventario?estado=bajo-minimo' });
    var semana = conEstado.filter(function (x) { return venceEnDias(e, x.p.id, hoy, 7); });
    if (semana.length) {
      var pronto = semana.filter(function (x) { return x.estados.some(function (s) { return s.clave === 'vence-pronto'; }); }).length;
      r.push({ nivel: 'aviso', texto: 'Vence pronto', titulo: plural(semana.length, 'producto vence esta semana', 'productos vencen esta semana'),
        detalle: nombres(semana) + (pronto ? ' · ' + plural(pronto, 'vence', 'vencen') + ' en ' + e.config.diasAviso + ' días o menos' : ''), enlace: '#/inventario?vence=semana' });
    }
    if (puede('verCostos')) {
      var bajos = platosEstado.filter(function (x) { return x.estado.clave === 'margen-bajo'; });
      if (bajos.length) r.push({ nivel: 'aviso', texto: 'Margen bajo', titulo: plural(bajos.length, 'plato con margen bajo', 'platos con margen bajo'), detalle: nombres(bajos) + ' · el costo supera el ' + f.pct(e.config.objetivoCosto), enlace: '#/carta?estado=margen-bajo' });
    }
    if (puede('verFinanzas') && pp.semana.length) r.push({ nivel: 'aviso', texto: 'Vence pronto', titulo: plural(pp.semana.length, 'cuenta vence esta semana', 'cuentas vencen esta semana'), detalle: pp.semana.map(function (c) { return c.acreedor; }).join(', '), enlace: '#/finanzas/por-pagar?estado=vence-pronto' });

    var pend = e.compras.filter(function (c) { return c.estado === 'pendiente'; });
    if (pend.length) r.push({ nivel: 'info', texto: 'Pendiente', titulo: plural(pend.length, 'compra por recibir', 'compras por recibir'), detalle: pend.map(function (c) { return porId(e.proveedores, c.proveedorId).nombre; }).join(', '), enlace: '#/compras?estado=pendiente' });
    return r;
  }

  SB.calc = {
    PESO: PESO, porId: porId, suma: suma, tasaActual: tasaActual, diasAviso: diasAviso, lotesDe: lotesDe, loteVencido: loteVencido,
    existencia: existencia, proximoVence: proximoVence, comprasPendientesDe: comprasPendientesDe, estadosProducto: estadosProducto,
    venceEnDias: venceEnDias, valorProducto: valorProducto, valorInventario: valorInventario, descontar: descontar,
    historialPrecios: historialPrecios, ultimoPrecio: ultimoPrecio, preciosPorProveedor: preciosPorProveedor,
    costoPlato: costoPlato, margen: margen, precioSugerido: precioSugerido, estadoPlato: estadoPlato, evolucionCosto: evolucionCosto,
    estadoCuenta: estadoCuenta, porPagar: porPagar, sumaDinero: sumaDinero, totalesPeriodo: totalesPeriodo, totalesMes: totalesMes,
    rangoMes: rangoMes, mesesConDatos: mesesConDatos, semanas: semanas, alertas: alertas
  };
})(window.SB = window.SB || {});
