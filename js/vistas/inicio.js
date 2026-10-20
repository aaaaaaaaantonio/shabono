/* Inicio: alertas por gravedad, resumen del mes y acciones rápidas. */
(function (SB) {
  'use strict';

  var f = SB.f;
  var ui = SB.ui;
  var c = SB.calc;
  var esc = f.esc;
  SB.vistas = SB.vistas || {};

  function cifra(nombre, icono, d, nota) {
    return '<div class="tarjeta cifra-tarjeta">' +
      '<span class="cifra-tarjeta__nombre">' + ui.icono(icono) + esc(nombre) + '</span>' +
      ui.dineroDe(d) +
      (nota ? '<p class="cifra-tarjeta__nota">' + nota + '</p>' : '') + '</div>';
  }

  SB.vistas.inicio = {
    render: function (ctx) {
      var e = ctx.e;
      var hoy = ctx.hoy;
      var alertas = c.alertas(e, hoy, ctx.puede);
      var fechaTxt = f.fechaLarga(hoy);
      var h = '<p class="saludo">' + esc(fechaTxt.charAt(0).toUpperCase() + fechaTxt.slice(1)) + ' · ' + esc(ctx.rolNombre) + '</p>';

      // Acciones rápidas según el rol
      var acc = [];
      if (ctx.puede('gestionarCompras')) acc.push('<button type="button" class="btn btn--principal" data-accion="nueva-compra">' + ui.icono('shopping-cart') + 'Registrar compra</button>');
      acc.push('<button type="button" class="btn btn--secundario" data-accion="ajustar">' + ui.icono('scale') + 'Ajustar existencias</button>');
      if (!ctx.puede('gestionarCompras')) acc.push('<a class="btn btn--principal" href="#/compras?estado=pendiente">' + ui.icono('truck') + 'Recibir compra</a>');
      if (ctx.puede('editarFinanzas')) {
        acc.push('<button type="button" class="btn btn--secundario" data-accion="ingreso">' + ui.icono('banknote') + 'Registrar ingreso del día</button>');
        acc.push('<button type="button" class="btn btn--secundario" data-accion="gasto">' + ui.icono('receipt') + 'Registrar gasto</button>');
      }
      h += '<section class="bloque" aria-labelledby="t-acciones"><div class="bloque__cabeza"><h2 class="etiqueta" id="t-acciones">Acciones rápidas</h2></div>' +
        '<div class="acciones acciones--bloque">' + acc.join('') + '</div></section>';

      // Alertas
      var bloqueAlertas = '<section class="bloque" aria-labelledby="t-alertas"><div class="bloque__cabeza"><h2 class="etiqueta" id="t-alertas">Alertas</h2>' +
        '<span class="suave">' + (alertas.length ? alertas.length + (alertas.length === 1 ? ' alerta' : ' alertas') : '') + '</span></div>';
      if (alertas.length) {
        bloqueAlertas += '<ul class="alertas" role="list">' + alertas.map(function (a) {
          return '<li><a class="alerta" href="' + a.enlace + '">' + ui.estado({ nivel: a.nivel, texto: a.texto, clave: a.texto === 'Pendiente' ? 'pendiente' : '' }) +
            '<span class="alerta__texto"><strong>' + esc(a.titulo) + '</strong><span>' + esc(a.detalle) + '</span></span>' +
            '<span class="alerta__ver">Ver' + ui.icono('chevron-right', 'icono--16') + '</span></a></li>';
        }).join('') + '</ul>';
      } else {
        bloqueAlertas += '<div class="tarjeta">' + ui.vacio('orante', 'Todo en orden: no hay alertas por ahora.', '') + '</div>';
      }
      bloqueAlertas += '</section>';

      // Resumen del mes (no lo ve el equipo de cocina)
      var bloqueResumen = '';
      if (ctx.puede('verFinanzas')) {
        var mes = f.mesDe(hoy);
        var t = c.totalesMes(e, mes);
        var pp = c.porPagar(e, hoy);
        var inv = c.valorInventario(e, hoy);
        var tasa = c.tasaActual(e);
        bloqueResumen = '<section class="bloque" aria-labelledby="t-resumen"><div class="bloque__cabeza"><h2 class="etiqueta" id="t-resumen">Resumen de ' + esc(f.mesNombre(mes).toLowerCase()) + '</h2>' +
          '<a class="btn btn--sutil" href="#/finanzas">Ver finanzas</a></div>' +
          '<div class="cifras">' +
          cifra('Ingresos', 'banknote', t.ingresos, t.dias + (t.dias === 1 ? ' día con cierre de caja' : ' días con cierre de caja')) +
          cifra('Gastos pagados', 'receipt', t.gastos, t.gastos.n + ' pagos en el mes') +
          cifra('Resultado', 'calculator', t.resultado, 'Ingresos menos gastos pagados') +
          cifra('Por pagar', 'hand-coins', pp, pp.n + (pp.n === 1 ? ' cuenta abierta' : ' cuentas abiertas') + ' · <a href="#/finanzas/por-pagar">ver cuentas</a>') +
          cifra('Valor del inventario', 'package', inv, 'Bs. a la tasa del ' + f.fecha(tasa.fecha)) +
          '</div></section>';
      }

      h += '<div class="rejilla-inicio">' + bloqueAlertas + bloqueResumen + '</div>';
      return h;
    },
    acciones: {
      'nueva-compra': function (el, ctx) { SB.vistas.compras.abrirNuevaCompra(ctx); },
      ajustar: function (el, ctx) { SB.vistas.inventario.abrirAjuste(ctx, null); },
      ingreso: function (el, ctx) { SB.vistas.finanzas.abrirIngreso(ctx); },
      gasto: function (el, ctx) { SB.vistas.finanzas.abrirGasto(ctx); }
    }
  };
})(window.SB = window.SB || {});
