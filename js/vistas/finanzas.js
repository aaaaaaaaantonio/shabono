/* Finanzas: resumen del mes, ingresos (cierre diario), gastos y cuentas por pagar. Uso interno, no fiscal. */
(function (SB) {
  'use strict';

  var f = SB.f;
  var ui = SB.ui;
  var c = SB.calc;
  var esc = f.esc;
  SB.vistas = SB.vistas || {};

  var CATEGORIAS_GASTO = ['Insumos', 'Nómina', 'Alquiler', 'Impuestos y tasas', 'Servicios', 'Gas y combustible', 'Mantenimiento', 'Limpieza y desechables', 'Otros'];
  var ORIGEN = { manual: 'Registro manual', compra: 'Compra de contado', cuenta: 'Pago de una cuenta' };

  function subnav(ctx) {
    var items = [['', 'Resumen'], ['ingresos', 'Ingresos'], ['gastos', 'Gastos'], ['por-pagar', 'Por pagar']];
    return '<nav class="subnav" aria-label="Finanzas">' + items.map(function (it) {
      return '<a href="#/finanzas' + (it[0] ? '/' + it[0] : '') + '"' + ((ctx.sub || '') === it[0] ? ' aria-current="page"' : '') + '>' + it[1] + '</a>';
    }).join('') + '</nav>';
  }
  function mesActual(ctx) {
    var meses = c.mesesConDatos(ctx.e);
    var m = ctx.params.mes || f.mesDe(ctx.hoy);
    if (meses.indexOf(m) < 0 && meses.length) m = meses[0];
    return m;
  }
  function selectorMes(ctx, conTodos) {
    var meses = c.mesesConDatos(ctx.e);
    return ui.campo({ id: 'f-mes', nombre: 'mes', etiqueta: 'Mes', tipo: 'select', valor: mesActual(ctx), attrs: ' data-filtro',
      opciones: meses.map(function (m) { return { valor: m, texto: f.mesNombre(m) }; }) });
  }
  function pieFiltros(conLimpiar) {
    return '<div class="filtros__pie"><p class="filtros__cuenta" role="status" data-cuenta></p>' +
      (conLimpiar ? '<button type="button" class="btn btn--sutil" data-accion="limpiar" data-limpiar>' + ui.icono('filter-x') + 'Limpiar filtros</button>' : '<span data-limpiar></span>') + '</div>';
  }
  function provNombre(e, id) { var p = c.porId(e.proveedores, id); return p ? p.nombre : ''; }

  /* ======================= Resumen ======================= */
  function resumen(ctx) {
    var e = ctx.e;
    var mes = mesActual(ctx);
    var t = c.totalesMes(e, mes);
    var pp = c.porPagar(e, ctx.hoy);
    var r = c.rangoMes(mes);
    var ingFechas = e.ingresos.filter(function (x) { return x.fecha >= r[0] && x.fecha <= r[1]; }).map(function (x) { return x.fecha; }).sort();
    var nota = ingFechas.length ? 'Cierres del ' + f.fecha(ingFechas[0]) + ' al ' + f.fecha(ingFechas[ingFechas.length - 1]) + ' · ' + t.dias + (t.dias === 1 ? ' día' : ' días') : 'Sin cierres de caja este mes';
    var h = '<form class="filtros" aria-label="Elegir el mes">' + selectorMes(ctx) + '</form>' +
      '<p class="filtros__cuenta" style="margin-bottom:var(--espacio-s)">' + esc(nota) + '</p>' +
      '<div class="cifras">' +
      '<div class="tarjeta cifra-tarjeta"><span class="cifra-tarjeta__nombre">' + ui.icono('banknote') + 'Ingresos</span>' + ui.dineroDe(t.ingresos) +
        '<p class="cifra-tarjeta__nota"><span class="nowrap">En bolívares: ' + f.bs(t.ingresosBs.bs) + '</span> · <span class="nowrap">En divisas: ' + f.eur(t.ingresosDivisas.eur) + '</span></p></div>' +
      '<div class="tarjeta cifra-tarjeta"><span class="cifra-tarjeta__nombre">' + ui.icono('receipt') + 'Gastos pagados</span>' + ui.dineroDe(t.gastos) +
        '<p class="cifra-tarjeta__nota">' + t.gastos.n + (t.gastos.n === 1 ? ' pago registrado' : ' pagos registrados') + '</p></div>' +
      '<div class="tarjeta cifra-tarjeta"><span class="cifra-tarjeta__nombre">' + ui.icono('calculator') + 'Resultado</span>' + ui.dineroDe(t.resultado) +
        '<p class="cifra-tarjeta__nota">' + (t.ingresos.eur ? f.pct(t.resultado.eur / t.ingresos.eur) + ' de los ingresos' : 'Ingresos menos gastos') + '</p></div>' +
      '<div class="tarjeta cifra-tarjeta"><span class="cifra-tarjeta__nombre">' + ui.icono('hand-coins') + 'Por pagar hoy</span>' + ui.dinero(pp.eur, pp.bs) +
        '<p class="cifra-tarjeta__nota">' + pp.n + (pp.n === 1 ? ' cuenta abierta' : ' cuentas abiertas') + (pp.vencidas.length ? ' · ' + pp.vencidas.length + ' vencida' + (pp.vencidas.length > 1 ? 's' : '') : '') + '</p></div>' +
      '</div>' +
      '<p class="nota-pie">Cada importe suma tal como se registró, con su propia tasa. Por eso el resultado en Bs. no es el de € por la tasa de hoy.</p>';

    // Gastos por categoría
    var maxCat = t.porCategoria.length ? t.porCategoria[0].eur : 1;
    h += '<section class="bloque" aria-labelledby="t-cat"><div class="bloque__cabeza"><h2 class="etiqueta" id="t-cat">Gastos por categoría</h2></div><div class="tarjeta">' +
      (t.porCategoria.length ? '<ul class="barras" role="list">' + t.porCategoria.map(function (g) {
        var pct = t.gastos.eur ? g.eur / t.gastos.eur : 0;
        return '<li class="barra"><span>' + esc(g.categoria) + ' <span class="suave">· ' + f.pct(pct) + '</span></span>' + ui.dinero(g.eur, g.bs) +
          '<span class="barra__pista" aria-hidden="true"><span class="barra__relleno" style="display:block;width:' + Math.max(1, g.eur / maxCat * 100).toFixed(1) + '%"></span></span></li>';
      }).join('') + '</ul>' : ui.vacio('sol', 'No hay gastos registrados este mes.',
        ctx.puede('editarFinanzas') ? '<button type="button" class="btn btn--principal" data-accion="gasto">' + ui.icono('plus') + 'Registrar gasto</button>' : '')) + '</div></section>';

    // Gráfico de 8 semanas
    var todas = c.semanas(e, ctx.hoy, 9);
    var enCurso = todas[todas.length - 1];
    var sem = todas.slice(0, 8);
    var etiquetas = sem.map(function (s) { return f.fechaCorta(s.desde); });
    var series = [
      { nombre: 'Ingresos', clase: 'ingresos', valores: sem.map(function (s) { return s.ingresos; }) },
      { nombre: 'Gastos', clase: 'gastos', valores: sem.map(function (s) { return s.gastos; }) },
      { nombre: 'Resultado', clase: 'tercera', valores: sem.map(function (s) { return s.resultado; }) }
    ];
    var totalIng = c.suma(sem, function (s) { return s.ingresos; });
    var totalGas = c.suma(sem, function (s) { return s.gastos; });
    h += '<section class="bloque" aria-labelledby="t-sem"><div class="bloque__cabeza"><h2 class="etiqueta" id="t-sem">Últimas 8 semanas, en €</h2></div><div class="tarjeta">' +
      '<p class="filtros__cuenta" style="margin-bottom:.5rem">Semanas completas, de lunes a domingo, del ' + f.fecha(sem[0].desde) + ' al ' + f.fecha(sem[sem.length - 1].hasta) + '.</p>' +
      ui.grafico({ descripcion: 'Ingresos, gastos y resultado por semana en las 8 semanas completas anteriores. En total: ingresos ' + f.eur(totalIng) + ', gastos ' + f.eur(totalGas) + '. Los datos están en la tabla de abajo.',
        etiquetas: etiquetas, series: series }) +
      ui.leyenda([{ nombre: 'Ingresos', clase: 'ingresos', forma: 'línea continua' }, { nombre: 'Gastos', clase: 'gastos', forma: 'línea discontinua' }, { nombre: 'Resultado', clase: 'tercera', forma: 'puntos' }]) +
      '<table class="tabla tabla--compacta tabla--interior solo-tabla" style="margin-top:1rem"><caption class="sr">Datos del gráfico por semana</caption><thead><tr><th scope="col">Semana del</th>' +
      '<th scope="col" class="num">Ingresos</th><th scope="col" class="num">Gastos</th><th scope="col" class="num">Resultado</th></tr></thead><tbody>' +
      sem.concat([enCurso]).map(function (s) {
        return '<tr><td>' + f.fecha(s.desde) + (s.enCurso ? '<span class="tabla__sub">En curso, no sale en el gráfico</span>' : '') + '</td><td class="num">' + f.eur(s.ingresos) + '</td><td class="num">' + f.eur(s.gastos) + '</td><td class="num">' + f.eur(s.resultado) + '</td></tr>';
      }).join('') + '</tbody></table>' +
      '<ul class="lista-simple solo-movil" role="list" style="margin-top:1rem" aria-label="Datos del gráfico por semana">' + sem.concat([enCurso]).map(function (s) {
        return '<li><span class="lista-simple__principal"><strong>Semana del ' + f.fecha(s.desde) + '</strong>' + (s.enCurso ? '<span class="lista-simple__sub">En curso, no sale en el gráfico</span>' : '') +
          '<span class="lista-simple__sub">Ingresos ' + f.eur(s.ingresos) + ' · Gastos ' + f.eur(s.gastos) + '</span></span>' +
          '<span class="lista-simple__lado cifra">' + f.eur(s.resultado) + '<span class="lista-simple__sub">Resultado</span></span></li>';
      }).join('') + '</ul>' +
      '<p class="nota-pie">Las semanas con pago de nómina (días 15 y último del mes) salen con resultado más bajo.</p></div></section>';
    return h;
  }

  /* ======================= Ingresos ======================= */
  function diasIngresos(ctx) {
    var e = ctx.e;
    var mes = mesActual(ctx);
    var dias = {};
    e.ingresos.filter(function (x) { return f.mesDe(x.fecha) === mes; }).forEach(function (x) {
      var d = dias[x.fecha] = dias[x.fecha] || { fecha: x.fecha, bs: [], divisas: [] };
      (x.dinero.moneda === 'VES' ? d.bs : d.divisas).push(x);
    });
    return Object.keys(dias).sort().reverse().map(function (k) {
      var d = dias[k];
      d.totalBs = c.sumaDinero(d.bs);
      d.totalDivisas = c.sumaDinero(d.divisas);
      d.total = c.sumaDinero(d.bs.concat(d.divisas));
      return d;
    });
  }

  function listaIngresos(ctx) {
    var dias = diasIngresos(ctx);
    if (!dias.length) return '<div class="tarjeta">' + ui.vacio('sol', 'No hay ingresos registrados este mes.',
      ctx.puede('editarFinanzas') ? '<button type="button" class="btn btn--principal" data-accion="ingreso">' + ui.icono('plus') + 'Registrar ingreso del día</button>' : '') + '</div>';
    var tot = c.sumaDinero(ctx.e.ingresos.filter(function (x) { return f.mesDe(x.fecha) === mesActual(ctx); }));
    var tabla = '<div class="tabla-caja solo-tabla"><table class="tabla tabla--filas"><caption class="sr">Cierre de caja de cada día</caption><thead><tr>' +
      '<th scope="col">Fecha</th><th scope="col" class="num solo-ancho">En bolívares</th><th scope="col" class="num solo-ancho">En divisas</th><th scope="col" class="num">Total del día</th></tr></thead><tbody>' +
      dias.map(function (d) {
        return '<tr data-fila><td><button type="button" class="tabla__nombre" data-accion="dia" data-id="' + d.fecha + '">' + f.fecha(d.fecha) + '</button></td>' +
          '<td class="num solo-ancho">' + (d.bs.length ? ui.dineroDe(d.totalBs) : '—') + '</td>' +
          '<td class="num solo-ancho">' + (d.divisas.length ? ui.dineroDe(d.totalDivisas) : '—') + '</td>' +
          '<td class="num">' + ui.dineroDe(d.total) + '</td></tr>';
      }).join('') + '</tbody><tfoot><tr><td>Total del mes</td><td class="solo-ancho"></td><td class="solo-ancho"></td><td class="num">' + ui.dineroDe(tot) + '</td></tr></tfoot></table></div>';
    var fichas = '<ul class="fichas solo-movil" role="list">' + dias.map(function (d) {
      return '<li><button type="button" class="ficha" data-accion="dia" data-id="' + d.fecha + '">' +
        '<span class="ficha__arriba"><span class="ficha__nombre">' + f.fecha(d.fecha) + '</span>' + ui.dineroDe(d.total) + '</span>' +
        '<span class="ficha__abajo"><span class="ficha__dato ficha__dato--cifra"><span>En bolívares</span>' + (d.bs.length ? ui.dineroDe(d.totalBs) : '<span>—</span>') + '</span>' +
        '<span class="ficha__dato ficha__dato--cifra"><span>En divisas</span>' + (d.divisas.length ? ui.dineroDe(d.totalDivisas) : '<span>—</span>') + '</span></span></button></li>';
    }).join('') + '</ul>';
    return tabla + fichas;
  }

  function abrirDia(ctx, fecha) {
    var e = SB.almacen.estado;
    var regs = e.ingresos.filter(function (x) { return x.fecha === fecha; });
    var edita = ctx.puede('editarFinanzas');
    var cuerpo = '<ul class="lista-simple" role="list">' + regs.map(function (x) {
      return '<li><span class="lista-simple__principal"><strong>' + (x.dinero.moneda === 'VES' ? 'En bolívares' : 'En divisas') + '</strong>' +
        '<span class="lista-simple__sub">' + esc(x.concepto) + ' · tasa ' + f.tasa(x.dinero.tasa) + (x.por ? ' · ' + esc(x.por) : '') + '</span></span>' +
        '<span class="lista-simple__lado">' + ui.dineroDe(x.dinero) +
        (edita ? '<button type="button" class="btn btn--sutil" data-borrar="' + esc(x.id) + '">' + ui.icono('trash-2') + 'Eliminar</button>' : '') + '</span></li>';
    }).join('') + '</ul>';
    var d = ui.dialogo({ titulo: 'Cierre del ' + f.fecha(fecha), cuerpo: cuerpo, pie: '<button type="button" class="btn btn--principal" data-cerrar>Cerrar</button>' });
    d.querySelectorAll('[data-borrar]').forEach(function (b) {
      b.addEventListener('click', function () {
        d.close();
        var deshacer = SB.almacen.eliminar('ingresos', b.getAttribute('data-borrar'));
        ui.avisar('Eliminado: ingreso del ' + f.fecha(fecha) + '.', deshacer);
      });
    });
  }

  function abrirIngreso(ctx) {
    var e = SB.almacen.estado;
    var hoy = f.hoyISO();
    var tasa = c.tasaActual(e);
    var d = ui.dialogo({
      titulo: 'Registrar ingreso del día', formulario: true,
      cuerpo: '<div class="formulario"><p>Anota el cierre de caja. Es un registro interno, no una factura.</p>' +
        ui.campo({ id: 'in-fecha', nombre: 'fecha', etiqueta: 'Fecha', tipo: 'date', requerido: true, valor: hoy, attrs: ' max="' + hoy + '"' }) +
        ui.campo({ id: 'in-bs', nombre: 'bs', etiqueta: 'Ventas en bolívares', importe: true, opcional: true, sufijo: 'Bs.', ayuda: 'Punto de venta, pago móvil y efectivo en Bs.' }) +
        ui.campo({ id: 'in-eur', nombre: 'eur', etiqueta: 'Ventas en divisas', importe: true, opcional: true, sufijo: '€' }) +
        '<p class="campo__ayuda" data-tasa-ayuda>Tasa vigente hoy: ' + f.tasaTexto(tasa.valor, true) + ' · ' + f.fecha(tasa.fecha) + '. Queda guardada con el registro.</p>' +
        '<div class="resumen-form" data-resumen data-total></div></div>',
      pie: '<button type="button" class="btn btn--secundario" data-cerrar>Cancelar</button><button type="submit" class="btn btn--principal">' + ui.icono('check') + 'Guardar ingreso</button>',
      foco: '#in-bs'
    });
    var form = d.querySelector('form');
    // tasa vigente en la fecha que se escriba en el formulario
    function tv() { return c.tasaVigente(SB.almacen.estado, ui.valor(form, 'fecha') || f.hoyISO()); }
    form.addEventListener('change', function (ev) {
      if (ev.target.name !== 'fecha') return;
      var t = tv();
      var a = form.querySelector('[data-tasa-ayuda]');
      if (a) a.textContent = 'Tasa vigente ese día: ' + f.tasaTexto(t.valor, true) + ' · ' + f.fecha(t.fecha) + '. Queda guardada con el registro.';
    });
    function total() {
      var bs = ui.numero(form, 'bs');
      var eur = ui.numero(form, 'eur');
      var te = (isNaN(bs) ? 0 : bs / tv().valor) + (isNaN(eur) ? 0 : eur);
      var ya = e.ingresos.filter(function (x) { return x.fecha === ui.valor(form, 'fecha'); });
      form.querySelector('[data-total]').innerHTML = '<div class="resumen-form__fila"><span>Total del cierre</span><strong class="cifra">' + f.eur(te) + '</strong></div>' +
        '<div class="resumen-form__fila suave"><span>Equivale a</span><span class="cifra">' + f.bs(te * tv().valor) + '</span></div>' +
        (ya.length ? '<p class="campo__ayuda aviso-linea">' + ui.icono('triangle-alert', 'icono--16') + '<span>Ya hay un cierre para esa fecha: se sumará.</span></p>' : '');
    }
    form.addEventListener('input', total);
    form.addEventListener('change', total);
    total();
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var vacio = !ui.valor(form, 'bs') && !ui.valor(form, 'eur');
      if (ui.validar(form, [
        { nombre: 'fecha', requerido: true, texto: 'la fecha' },
        { nombre: 'bs', numero: true, positivo: true, extra: function () { return vacio ? 'Escribe las ventas en bolívares, en divisas o ambas.' : null; } },
        { nombre: 'eur', numero: true, positivo: true }
      ])) return;
      var fecha = ui.valor(form, 'fecha');
      var bs = ui.valor(form, 'bs') ? ui.numero(form, 'bs') : 0;
      var eur = ui.valor(form, 'eur') ? ui.numero(form, 'eur') : 0;
      SB.almacen.cambiar(function (est) {
        if (bs) est.ingresos.push({ id: SB.almacen.nuevoId('ingreso'), fecha: fecha, concepto: 'Ventas del día', metodo: 'bolivares', dinero: f.dinero('VES', bs, tv().valor), por: ctx.rolNombre });
        if (eur) est.ingresos.push({ id: SB.almacen.nuevoId('ingreso'), fecha: fecha, concepto: 'Ventas del día', metodo: 'divisas', dinero: f.dinero('EUR', eur, tv().valor), por: ctx.rolNombre });
      });
      d.close();
      ui.avisar('Ingreso del ' + f.fecha(fecha) + ' guardado.');
    });
  }

  /* ======================= Gastos ======================= */
  function gastosFiltrados(ctx) {
    var p = ctx.params;
    var mes = mesActual(ctx);
    var q = f.normalizar(p.q || '');
    return ctx.e.gastos.filter(function (g) {
      if (f.mesDe(g.fecha) !== mes) return false;
      if (p.categoria && g.categoria !== p.categoria) return false;
      if (q && f.normalizar(g.concepto + ' ' + g.categoria).indexOf(q) < 0) return false;
      return true;
    }).sort(function (a, b) { return a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : 0; });
  }

  function listaGastos(ctx) {
    var filas = gastosFiltrados(ctx);
    if (!filas.length) return '<div class="tarjeta">' + ui.vacio('sol', 'No hay gastos con estos filtros.',
      ctx.puede('editarFinanzas') ? '<button type="button" class="btn btn--principal" data-accion="gasto">' + ui.icono('plus') + 'Registrar gasto</button>' : '') + '</div>';
    var tot = c.sumaDinero(filas);
    var tabla = '<div class="tabla-caja solo-tabla"><table class="tabla tabla--filas"><caption class="sr">Gastos pagados</caption><thead><tr>' +
      '<th scope="col">Fecha</th><th scope="col">Concepto</th><th scope="col" class="num">Importe</th><th scope="col" class="solo-ancho">Pagado en</th></tr></thead><tbody>' +
      filas.map(function (g) {
        return '<tr data-fila><td>' + f.fecha(g.fecha) + '</td><td><button type="button" class="tabla__nombre" data-accion="gasto-detalle" data-id="' + esc(g.id) + '">' + esc(g.concepto) + '</button>' +
          '<span class="tabla__sub">' + esc(g.categoria) + '</span></td><td class="num">' + ui.dineroDe(g.dinero) + '</td>' +
          '<td class="solo-ancho">' + (g.dinero.moneda === 'VES' ? 'Bolívares' : 'Euros') + '<span class="tabla__sub">Tasa ' + f.tasa(g.dinero.tasa) + '</span></td></tr>';
      }).join('') + '</tbody><tfoot><tr><td colspan="2">Total</td><td class="num">' + ui.dineroDe(tot) + '</td><td class="solo-ancho"></td></tr></tfoot></table></div>';
    var fichas = '<ul class="fichas solo-movil" role="list">' + filas.map(function (g) {
      return '<li><button type="button" class="ficha" data-accion="gasto-detalle" data-id="' + esc(g.id) + '">' +
        '<span class="ficha__arriba"><span class="ficha__nombre">' + esc(g.concepto) + '</span>' + ui.dineroDe(g.dinero) + '</span>' +
        '<span class="suave">' + f.fecha(g.fecha) + ' · ' + esc(g.categoria) + '</span></button></li>';
    }).join('') + '</ul>';
    return tabla + fichas;
  }

  function abrirGastoDetalle(ctx, id) {
    var e = SB.almacen.estado;
    var g = c.porId(e.gastos, id);
    if (!g) return;
    var cuerpo = '<dl class="datos"><div><dt>Fecha</dt><dd>' + f.fecha(g.fecha) + '</dd></div><div><dt>Categoría</dt><dd>' + esc(g.categoria) + '</dd></div>' +
      '<div><dt>Importe</dt><dd>' + ui.dineroDe(g.dinero) + '</dd></div>' +
      '<div><dt>Moneda y tasa</dt><dd>' + (g.dinero.moneda === 'VES' ? 'Pagado en Bs.' : 'Pagado en €') + '<span class="tabla__sub">' + f.tasaTexto(g.dinero.tasa, true) + '</span></dd></div>' +
      (g.proveedorId ? '<div><dt>Proveedor</dt><dd>' + esc(provNombre(e, g.proveedorId)) + '</dd></div>' : '') +
      '<div><dt>Origen</dt><dd>' + esc(ORIGEN[g.origen] || '') + (g.por ? '<span class="tabla__sub">Registró: ' + esc(g.por) + '</span>' : '') + '</dd></div></dl>';
    var borrable = g.origen === 'manual' && ctx.puede('editarFinanzas');
    if (!borrable && g.origen !== 'manual') cuerpo += '<p class="nota-pie">Este gasto viene de una ' + (g.origen === 'compra' ? 'compra' : 'cuenta pagada') + ' y no se borra aquí.</p>';
    var d = ui.dialogo({ titulo: g.concepto, cuerpo: cuerpo,
      pie: (borrable ? '<button type="button" class="btn btn--secundario" data-borrar>' + ui.icono('trash-2') + 'Eliminar gasto</button>' : '') + '<button type="button" class="btn btn--principal" data-cerrar>Cerrar</button>' });
    var b = d.querySelector('[data-borrar]');
    if (b) b.addEventListener('click', function () {
      d.close();
      var deshacer = SB.almacen.eliminar('gastos', id);
      ui.avisar('Eliminado: ' + g.concepto + '.', deshacer);
    });
  }

  function abrirGasto(ctx) {
    var e = SB.almacen.estado;
    var hoy = f.hoyISO();
    var tasa = c.tasaActual(e);
    var d = ui.dialogo({
      titulo: 'Registrar gasto', formulario: true,
      cuerpo: '<div class="formulario">' +
        ui.campo({ id: 'ga-concepto', nombre: 'concepto', etiqueta: 'Concepto', requerido: true, ayuda: 'Por ejemplo: gas, 2 bombonas.' }) +
        '<div class="formulario__fila formulario__fila--2">' +
        ui.campo({ id: 'ga-categoria', nombre: 'categoria', etiqueta: 'Categoría', tipo: 'select', valor: 'Otros', opciones: CATEGORIAS_GASTO }) +
        ui.campo({ id: 'ga-fecha', nombre: 'fecha', etiqueta: 'Fecha', tipo: 'date', requerido: true, valor: hoy, attrs: ' max="' + hoy + '"' }) + '</div>' +
        '<fieldset class="grupo-opciones"><legend>Moneda</legend><div class="grupo-opciones__lista">' +
          '<label class="opcion"><input type="radio" name="moneda" value="VES" checked> Bolívares (Bs.)</label>' +
          '<label class="opcion"><input type="radio" name="moneda" value="EUR"> Euros (€)</label></div></fieldset>' +
        ui.campo({ id: 'ga-monto', nombre: 'monto', etiqueta: 'Importe', importe: true, requerido: true, sufijo: 'Bs.' }) +
        '<p class="resumen-form" data-resumen data-equiv></p>' +
        '<fieldset class="grupo-opciones"><legend>¿Ya se pagó?</legend><div class="grupo-opciones__lista">' +
          '<label class="opcion"><input type="radio" name="estado" value="pagado" checked> Sí, está pagado</label>' +
          '<label class="opcion"><input type="radio" name="estado" value="por-pagar"> No, queda por pagar</label></div></fieldset>' +
        '<div class="formulario__fila formulario__fila--2" data-por-pagar hidden>' +
          ui.campo({ id: 'ga-acreedor', nombre: 'acreedor', etiqueta: 'A quién se le debe', requerido: true }) +
          ui.campo({ id: 'ga-vence', nombre: 'vence', etiqueta: 'Vence', tipo: 'date', requerido: true, valor: f.sumarDias(hoy, 15) }) + '</div>' +
        '</div>',
      pie: '<button type="button" class="btn btn--secundario" data-cerrar>Cancelar</button><button type="submit" class="btn btn--principal">' + ui.icono('check') + 'Guardar gasto</button>',
      foco: '#ga-concepto'
    });
    var form = d.querySelector('form');
    // tasa vigente en la fecha que se escriba en el formulario
    function tv() { return c.tasaVigente(SB.almacen.estado, ui.valor(form, 'fecha') || f.hoyISO()); }
    form.addEventListener('change', function (ev) {
      if (ev.target.name !== 'fecha') return;
      var t = tv();
      var a = form.querySelector('[data-tasa-ayuda]');
      if (a) a.textContent = 'Tasa vigente ese día: ' + f.tasaTexto(t.valor, true) + ' · ' + f.fecha(t.fecha) + '. Queda guardada con el registro.';
    });
    function refrescar() {
      var m = form.querySelector('[name="moneda"]:checked').value;
      form.querySelector('#ga-monto').parentNode.querySelector('.campo__sufijo').textContent = f.simbolo(m);
      var n = ui.numero(form, 'monto');
      var t = tv();
      form.querySelector('[data-equiv]').textContent = isNaN(n) ? 'Tasa vigente ese día: ' + f.tasaTexto(t.valor) + ' · ' + f.fecha(t.fecha) + '.' :
        'Equivale a ' + (m === 'VES' ? f.eur(n / t.valor) : f.bs(n * t.valor)) + ' con la tasa del ' + f.fecha(t.fecha) + '.';
      form.querySelector('[data-por-pagar]').hidden = form.querySelector('[name="estado"]:checked').value !== 'por-pagar';
    }
    form.addEventListener('change', refrescar);
    form.addEventListener('input', refrescar);
    refrescar();
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var porPagar = form.querySelector('[name="estado"]:checked').value === 'por-pagar';
      var reglas = [{ nombre: 'concepto', requerido: true, texto: 'el concepto' }, { nombre: 'fecha', requerido: true, texto: 'la fecha' },
        { nombre: 'monto', requerido: true, numero: true, positivo: true, texto: 'el importe' }];
      if (porPagar) reglas.push({ nombre: 'acreedor', requerido: true, texto: 'a quién se le debe' }, { nombre: 'vence', requerido: true, texto: 'la fecha de vencimiento',
        extra: function (v) { return v < ui.valor(form, 'fecha') ? 'Vence antes de la fecha del gasto.' : null; } });
      if (ui.validar(form, reglas)) return;
      var m = form.querySelector('[name="moneda"]:checked').value;
      var dn = f.dinero(m, ui.numero(form, 'monto'), tv().valor);
      var concepto = ui.valor(form, 'concepto');
      SB.almacen.cambiar(function (est) {
        if (porPagar) {
          est.cuentas.push({ id: SB.almacen.nuevoId('cuenta'), proveedorId: null, acreedor: ui.valor(form, 'acreedor'), concepto: concepto, compraId: null,
            emitida: ui.valor(form, 'fecha'), vence: ui.valor(form, 'vence'), dinero: dn, pagada: null, gastoId: null, origen: 'manual', categoria: ui.valor(form, 'categoria') });
        } else {
          est.gastos.push({ id: SB.almacen.nuevoId('gasto'), fecha: ui.valor(form, 'fecha'), categoria: ui.valor(form, 'categoria'), concepto: concepto,
            proveedorId: null, dinero: dn, origen: 'manual', por: ctx.rolNombre });
        }
      });
      d.close();
      ui.avisar(porPagar ? 'Cuenta por pagar registrada: ' + concepto + '.' : 'Gasto registrado: ' + concepto + '.');
    });
  }

  /* ======================= Por pagar ======================= */
  function cuentasFiltradas(ctx) {
    var est = ctx.params.estado || 'abiertas';
    return ctx.e.cuentas.filter(function (cu) {
      var s = c.estadoCuenta(cu, ctx.hoy).clave;
      if (est === 'abiertas') return s !== 'pagada';
      if (est === 'todas') return true;
      return s === est;
    }).sort(function (a, b) {
      if (!!a.pagada !== !!b.pagada) return a.pagada ? 1 : -1;
      if (a.pagada) return a.pagada < b.pagada ? 1 : -1;
      return a.vence < b.vence ? -1 : a.vence > b.vence ? 1 : 0;
    });
  }

  function listaCuentas(ctx) {
    var filas = cuentasFiltradas(ctx);
    if (!filas.length) return '<div class="tarjeta">' + ui.vacio('sol', 'No hay cuentas con este estado.',
      (ctx.params.estado && ctx.params.estado !== 'abiertas') ? '<button type="button" class="btn btn--secundario" data-accion="limpiar">' + ui.icono('filter-x') + 'Ver cuentas sin pagar</button>' : '') + '</div>';
    var tot = c.sumaDinero(filas);
    var tabla = '<div class="tabla-caja solo-tabla"><table class="tabla tabla--filas"><caption class="sr">Cuentas por pagar</caption><thead><tr>' +
      '<th scope="col">A quién</th><th scope="col" class="solo-ancho">Vencimiento</th><th scope="col" class="num">Importe</th><th scope="col">Estado</th></tr></thead><tbody>' +
      filas.map(function (cu) {
        var t = cu.pagada ? 'Pagada el ' + f.fecha(cu.pagada) : f.vence(cu.vence, ctx.hoy);
        var partes = t.split(' · ');
        return '<tr data-fila><td><button type="button" class="tabla__nombre" data-accion="cuenta" data-id="' + esc(cu.id) + '">' + esc(cu.acreedor) + '</button>' +
          '<span class="tabla__sub">' + esc(cu.concepto) + '</span><span class="tabla__sub solo-medio">' + esc(t) + '</span></td>' +
          '<td class="solo-ancho">' + esc(partes[0]) + (partes[1] ? '<span class="tabla__sub">' + esc(partes[1]) + '</span>' : '') + '</td>' +
          '<td class="num">' + ui.dineroDe(cu.dinero) + '</td><td>' + ui.estado(c.estadoCuenta(cu, ctx.hoy)) + '</td></tr>';
      }).join('') + '</tbody><tfoot><tr><td>Total</td><td class="solo-ancho"></td><td class="num">' + ui.dineroDe(tot) + '</td><td></td></tr></tfoot></table></div>';
    var fichas = '<ul class="fichas solo-movil" role="list">' + filas.map(function (cu) {
      return '<li><button type="button" class="ficha" data-accion="cuenta" data-id="' + esc(cu.id) + '">' +
        '<span class="ficha__arriba"><span class="ficha__nombre">' + esc(cu.acreedor) + '</span>' + ui.estado(c.estadoCuenta(cu, ctx.hoy)) + '</span>' +
        '<span class="suave">' + esc(cu.concepto) + '</span>' +
        '<span class="ficha__abajo"><span class="ficha__dato"><span>Vencimiento</span><span>' + esc(cu.pagada ? 'Pagada el ' + f.fecha(cu.pagada) : f.vence(cu.vence, ctx.hoy)) + '</span></span>' +
        '<span class="ficha__dato ficha__dato--cifra"><span>Importe</span>' + ui.dineroDe(cu.dinero) + '</span></span></button></li>';
    }).join('') + '</ul>';
    return tabla + fichas;
  }

  function abrirCuenta(ctx, id) {
    var e = SB.almacen.estado;
    var cu = c.porId(e.cuentas, id);
    if (!cu) return;
    var est = c.estadoCuenta(cu, ctx.hoy);
    var cuerpo = ui.estado(est) + '<dl class="datos" style="margin-top:1rem">' +
      '<div><dt>Concepto</dt><dd>' + esc(cu.concepto) + '</dd></div>' +
      '<div><dt>Importe</dt><dd>' + ui.dineroDe(cu.dinero) + '<span class="tabla__sub">' + (cu.dinero.moneda === 'VES' ? 'En Bs.' : 'En €') + ' · tasa ' + f.tasa(cu.dinero.tasa) + '</span></dd></div>' +
      '<div><dt>Emitida</dt><dd>' + f.fecha(cu.emitida) + '</dd></div>' +
      '<div><dt>' + (cu.pagada ? 'Pagada' : 'Vencimiento') + '</dt><dd>' + esc(cu.pagada ? f.fecha(cu.pagada) : f.vence(cu.vence, ctx.hoy)) + '</dd></div></dl>';
    var pie = '';
    if (!cu.pagada && ctx.puede('editarFinanzas')) pie += '<button type="button" class="btn btn--principal" data-pagar>' + ui.icono('hand-coins') + 'Registrar pago</button>';
    else if (!cu.pagada) cuerpo += '<p class="nota-pie">Los pagos los registra Administración.</p>';
    var d = ui.dialogo({ titulo: cu.acreedor, cuerpo: cuerpo, pie: '<button type="button" class="btn btn--secundario" data-cerrar>Cerrar</button>' + pie });
    var b = d.querySelector('[data-pagar]');
    if (b) b.addEventListener('click', function () { ui.cerrarYAbrir(d, function () { abrirPago(ctx, id); }); });
  }

  function abrirPago(ctx, id) {
    var e = SB.almacen.estado;
    var cu = c.porId(e.cuentas, id);
    var hoy = f.hoyISO();
    var tasa = c.tasaActual(e);
    var d = ui.dialogo({
      titulo: 'Registrar pago', formulario: true,
      cuerpo: '<div class="formulario"><p><strong>' + esc(cu.acreedor) + '</strong> · ' + esc(cu.concepto) + '</p>' +
        '<p>Importe: ' + f.importe(cu.dinero.moneda, cu.dinero.monto) + '</p>' +
        ui.campo({ id: 'pa-fecha', nombre: 'fecha', etiqueta: 'Fecha del pago', tipo: 'date', requerido: true, valor: hoy, attrs: ' min="' + cu.emitida + '" max="' + hoy + '"' }) +
        '<fieldset class="grupo-opciones"><legend>Moneda del pago</legend><div class="grupo-opciones__lista">' +
          '<label class="opcion"><input type="radio" name="moneda" value="EUR"' + (cu.dinero.moneda === 'EUR' ? ' checked' : '') + '> Euros (€)</label>' +
          '<label class="opcion"><input type="radio" name="moneda" value="VES"' + (cu.dinero.moneda === 'VES' ? ' checked' : '') + '> Bolívares (Bs.)</label></div></fieldset>' +
        '<p class="resumen-form" data-resumen data-pago></p></div>',
      pie: '<button type="button" class="btn btn--secundario" data-cerrar>Cancelar</button><button type="submit" class="btn btn--principal">' + ui.icono('check') + 'Guardar pago</button>',
      foco: '#pa-fecha'
    });
    var form = d.querySelector('form');
    // tasa vigente en la fecha que se escriba en el formulario
    function tv() { return c.tasaVigente(SB.almacen.estado, ui.valor(form, 'fecha') || f.hoyISO()); }
    form.addEventListener('change', function (ev) {
      if (ev.target.name !== 'fecha') return;
      var t = tv();
      var a = form.querySelector('[data-tasa-ayuda]');
      if (a) a.textContent = 'Tasa vigente ese día: ' + f.tasaTexto(t.valor, true) + ' · ' + f.fecha(t.fecha) + '. Queda guardada con el registro.';
    });
    function monto() {
      var m = form.querySelector('[name="moneda"]:checked').value;
      if (m === cu.dinero.moneda) return { m: m, n: cu.dinero.monto };
      return { m: m, n: m === 'VES' ? cu.dinero.eur * tv().valor : cu.dinero.bs / tv().valor };
    }
    function pintar() {
      var x = monto();
      var tp = tv();
      form.querySelector('[data-pago]').textContent = 'Se paga ' + f.importe(x.m, x.n) + (x.m === 'EUR' ? ' · equivale a ' + f.bs(x.n * tp.valor) : ' · equivale a ' + f.eur(x.n / tp.valor)) + ' con la tasa del ' + f.fecha(tp.fecha) + '.';
    }
    form.addEventListener('change', pintar);
    pintar();
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (ui.validar(form, [{ nombre: 'fecha', requerido: true, texto: 'la fecha' }])) return;
      var x = monto();
      var fecha = ui.valor(form, 'fecha');
      var gid = SB.almacen.nuevoId('gasto');
      SB.almacen.cambiar(function (est) {
        var cuenta = c.porId(est.cuentas, id);
        est.gastos.push({ id: gid, fecha: fecha, categoria: cuenta.categoria || 'Insumos', concepto: 'Pago a ' + cuenta.acreedor + ' · ' + cuenta.concepto,
          proveedorId: cuenta.proveedorId, dinero: f.dinero(x.m, x.n, tv().valor), origen: 'cuenta', cuentaId: id, compraId: cuenta.compraId, por: ctx.rolNombre });
        cuenta.pagada = fecha;
        cuenta.gastoId = gid;
      });
      d.close();
      ui.avisar('Pago registrado: ' + cu.acreedor + '.', function () {
        SB.almacen.cambiar(function (est) {
          est.gastos = est.gastos.filter(function (g) { return g.id !== gid; });
          var cuenta = c.porId(est.cuentas, id);
          cuenta.pagada = null;
          cuenta.gastoId = null;
        });
      });
    });
  }

  /* ======================= Vista ======================= */
  SB.vistas.finanzas = {
    titulo: function (ctx) { return { ingresos: 'Ingresos', gastos: 'Gastos', 'por-pagar': 'Cuentas por pagar' }[ctx.sub] || 'Finanzas'; },
    accionesPantalla: function (ctx) {
      if (!ctx.puede('editarFinanzas')) return '';
      if (ctx.sub === 'gastos' || ctx.sub === 'por-pagar') return '<button type="button" class="btn btn--principal" data-accion="gasto">' + ui.icono('plus') + 'Registrar gasto</button>';
      return '<button type="button" class="btn btn--principal" data-accion="ingreso">' + ui.icono('plus') + 'Registrar ingreso del día</button>';
    },
    render: function (ctx) {
      if (ctx.sub && ['ingresos', 'gastos', 'por-pagar'].indexOf(ctx.sub) < 0) { ctx.sub = null; history.replaceState(null, '', '#/finanzas'); }
      var h = subnav(ctx);
      if (!ctx.puede('editarFinanzas')) h += '<p class="filtros__cuenta" style="margin-bottom:var(--espacio-s)">' + ui.icono('info', 'icono--16') + ' Solo lectura: los registros de finanzas los hace Administración.</p>';
      if (!ctx.sub) return h + resumen(ctx);
      if (ctx.sub === 'ingresos') return h + '<form class="filtros" aria-label="Elegir el mes">' + selectorMes(ctx) + '</form>' + pieFiltros(false) + '<div data-lista></div>';
      if (ctx.sub === 'gastos') {
        return h + '<form class="filtros" role="search" aria-label="Filtrar gastos">' +
          ui.campo({ id: 'f-q', nombre: 'q', etiqueta: 'Buscar', tipo: 'search', valor: ctx.params.q || '', icono: 'search', attrs: ' data-filtro autocomplete="off" placeholder="Concepto"' }) +
          selectorMes(ctx) +
          ui.campo({ id: 'f-categoria', nombre: 'categoria', etiqueta: 'Categoría', tipo: 'select', valor: ctx.params.categoria || '', attrs: ' data-filtro',
            opciones: [{ valor: '', texto: 'Todas' }].concat(CATEGORIAS_GASTO) }) +
          '</form>' + pieFiltros(true) + '<div data-lista></div>';
      }
      return h + '<form class="filtros" aria-label="Filtrar cuentas">' +
        ui.campo({ id: 'f-estado', nombre: 'estado', etiqueta: 'Estado', tipo: 'select', valor: ctx.params.estado || 'abiertas', attrs: ' data-filtro',
          opciones: [{ valor: 'abiertas', texto: 'Sin pagar' }, { valor: 'vencida', texto: 'Vencidas' }, { valor: 'vence-pronto', texto: 'Vencen esta semana' },
            { valor: 'pendiente', texto: 'Pendientes (más adelante)' }, { valor: 'pagada', texto: 'Pagadas' }, { valor: 'todas', texto: 'Todas' }] }) +
        '</form>' + pieFiltros(true) + '<div data-lista></div>';
    },
    despues: function (main, ctx) { if (ctx.sub) this.pintarLista(main, ctx); },
    pintarLista: function (main, ctx) {
      if (!ctx.sub) {
        // el resumen se repinta entero al cambiar de mes; el foco vuelve al selector
        main.innerHTML = this.render(ctx);
        ui.pintarGraficos(main);
        var sel = main.querySelector('#f-mes');
        if (sel) sel.focus();
        return;
      }
      var lista = main.querySelector('[data-lista]');
      var n;
      if (ctx.sub === 'ingresos') { lista.innerHTML = listaIngresos(ctx); n = diasIngresos(ctx).length; n = n + (n === 1 ? ' día con cierre' : ' días con cierre'); }
      else if (ctx.sub === 'gastos') { lista.innerHTML = listaGastos(ctx); n = gastosFiltrados(ctx).length; n = n + (n === 1 ? ' gasto' : ' gastos'); }
      else { lista.innerHTML = listaCuentas(ctx); n = cuentasFiltradas(ctx).length; n = n + (n === 1 ? ' cuenta' : ' cuentas'); }
      main.querySelector('[data-cuenta]').textContent = n;
      var l = main.querySelector('[data-limpiar]');
      if (l && ctx.sub === 'gastos') l.hidden = !(ctx.params.q || ctx.params.categoria);
      if (l && ctx.sub === 'por-pagar') l.hidden = !ctx.params.estado || ctx.params.estado === 'abiertas';
    },
    filtrar: function (main) {
      var form = main.querySelector('.filtros');
      var r = {};
      ['q', 'mes', 'categoria', 'estado'].forEach(function (k) { if (form[k]) r[k] = form[k].value.trim(); });
      return r;
    },
    acciones: {
      ingreso: function (el, ctx) { abrirIngreso(ctx); },
      gasto: function (el, ctx) { abrirGasto(ctx); },
      dia: function (el, ctx) { abrirDia(ctx, el.getAttribute('data-id')); },
      'gasto-detalle': function (el, ctx) { abrirGastoDetalle(ctx, el.getAttribute('data-id')); },
      cuenta: function (el, ctx) { abrirCuenta(ctx, el.getAttribute('data-id')); },
      limpiar: function (el, ctx) {
        ctx.fijarParams({ mes: ctx.params.mes });
        SB.app.render();
        var b = document.getElementById('f-q') || document.getElementById('f-estado');
        if (b) b.focus();
      }
    },
    abrirIngreso: abrirIngreso,
    abrirGasto: abrirGasto
  };
})(window.SB = window.SB || {});
