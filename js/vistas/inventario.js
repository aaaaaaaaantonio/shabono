/* Inventario: existencias, mínimo, lotes con vencimiento y ajustes. */
(function (SB) {
  'use strict';

  var f = SB.f;
  var ui = SB.ui;
  var c = SB.calc;
  var esc = f.esc;
  SB.vistas = SB.vistas || {};

  var ESTADOS = [
    { valor: '', texto: 'Todos' },
    { valor: 'agotado', texto: 'Agotado' },
    { valor: 'vencido', texto: 'Vencido' },
    { valor: 'bajo-minimo', texto: 'Bajo mínimo' },
    { valor: 'vence-pronto', texto: 'Vence pronto' },
    { valor: 'pendiente', texto: 'Pendiente' },
    { valor: 'suficiente', texto: 'Suficiente' }
  ];
  var UNIDADES = [{ valor: 'kg', texto: 'Kilos (kg)' }, { valor: 'L', texto: 'Litros (L)' }, { valor: 'und', texto: 'Unidades' }, { valor: 'manojo', texto: 'Manojos' }];
  var TIPOS = { entrada: 'Entrada', consumo: 'Consumo', merma: 'Merma', conteo: 'Ajuste por conteo', baja: 'Baja por vencimiento' };

  function datos(ctx) {
    var e = ctx.e;
    var hoy = ctx.hoy;
    var p = ctx.params;
    var q = f.normalizar(p.q || '');
    return e.productos.map(function (prod) {
      var est = c.estadosProducto(e, prod, hoy);
      return { p: prod, estados: est, ex: c.existencia(e, prod.id, hoy), pv: c.proximoVence(e, prod.id, hoy),
        valor: c.valorProducto(e, prod.id, hoy) };
    }).filter(function (x) {
      if (q && f.normalizar(x.p.nombre + ' ' + x.p.categoria).indexOf(q) < 0) return false;
      if (p.categoria && x.p.categoria !== p.categoria) return false;
      if (p.estado && !x.estados.some(function (s) { return s.clave === p.estado; })) return false;
      if (p.vence === 'semana' && !c.venceEnDias(e, x.p.id, hoy, 7)) return false;
      return true;
    }).sort(function (a, b) {
      return c.PESO[b.estados[0].nivel] - c.PESO[a.estados[0].nivel] || a.p.nombre.localeCompare(b.p.nombre, 'es');
    });
  }

  function venceCelda(pv, hoy, ex) {
    if (ex && ex.util <= 0) return '<span class="suave">Sin existencias</span>';
    if (!pv) return '<span class="suave">Sin vencimiento</span>';
    var t = f.vence(pv, hoy).split(' · ');
    return esc(t[0]) + '<span class="tabla__sub">' + esc(t[1]) + '</span>';
  }

  function hayFiltros(p) { return !!(p.q || p.categoria || p.estado || p.vence); }

  function lista(ctx) {
    var filas = datos(ctx);
    var tasa = c.tasaActual(ctx.e).valor;
    var verCostos = ctx.puede('verCostos');
    if (!filas.length) {
      return '<div class="tarjeta">' + ui.vacio('lagarto', hayFiltros(ctx.params) ? 'Ningún producto coincide con estos filtros.' : 'Todavía no hay productos en el inventario.',
        hayFiltros(ctx.params) ? '<button type="button" class="btn btn--secundario" data-accion="limpiar">' + ui.icono('filter-x') + 'Limpiar filtros</button>'
          : (ctx.puede('editarProductos') ? '<button type="button" class="btn btn--principal" data-accion="nuevo">' + ui.icono('plus') + 'Nuevo producto</button>' : '')) + '</div>';
    }
    var tabla = '<div class="tabla-caja solo-tabla"><table class="tabla tabla--filas">' +
      '<caption class="sr">Productos del inventario. Selecciona uno para ver sus lotes y movimientos.</caption>' +
      '<thead><tr><th scope="col">Producto</th><th scope="col" class="num">Existencia</th><th scope="col" class="num solo-ancho">Mínimo</th>' +
      '<th scope="col">Próximo vencimiento</th>' + (verCostos ? '<th scope="col" class="num solo-ancho">Valor</th>' : '') + '<th scope="col">Estado</th></tr></thead><tbody>' +
      filas.map(function (x) {
        var u = x.p.unidad;
        return '<tr data-fila><td><button type="button" class="tabla__nombre" data-accion="detalle" data-id="' + esc(x.p.id) + '">' + esc(x.p.nombre) + '</button>' +
          '<span class="tabla__sub">' + esc(x.p.categoria) + '</span></td>' +
          '<td class="num">' + f.cantidad(x.ex.util, u) + (x.ex.vencida ? '<span class="tabla__sub">+ ' + f.cantidad(x.ex.vencida, u) + ' vencido</span>' : '') + '</td>' +
          '<td class="num solo-ancho">' + f.cantidad(x.p.minimo, u) + '</td>' +
          '<td>' + venceCelda(x.pv, ctx.hoy, x.ex) + '</td>' +
          (verCostos ? '<td class="num solo-ancho">' + ui.dinero(x.valor, x.valor * tasa) + '</td>' : '') +
          '<td>' + ui.estado(x.estados[0]) + '</td></tr>';
      }).join('') + '</tbody></table></div>';
    var fichas = '<ul class="fichas solo-movil" role="list">' + filas.map(function (x) {
      var u = x.p.unidad;
      return '<li><button type="button" class="ficha" data-accion="detalle" data-id="' + esc(x.p.id) + '">' +
        '<span class="ficha__arriba"><span class="ficha__nombre">' + esc(x.p.nombre) + '</span>' + ui.estado(x.estados[0]) + '</span>' +
        '<span class="ficha__abajo">' +
          '<span class="ficha__dato"><span>Existencia</span><span>' + f.cantidad(x.ex.util, u) + ' <span class="suave">· mín. ' + f.cantidad(x.p.minimo, u) + '</span></span></span>' +
          '<span class="ficha__dato"><span>Vencimiento</span><span>' + (x.ex.util <= 0 ? 'Sin existencias' : x.pv ? esc(f.vence(x.pv, ctx.hoy)) : 'Sin vencimiento') + '</span></span>' +
          (verCostos ? '<span class="ficha__dato"><span>Valor</span>' + ui.dinero(x.valor, x.valor * tasa) + '</span>' : '') +
        '</span></button></li>';
    }).join('') + '</ul>';
    return tabla + fichas;
  }

  function cuentaTexto(n) { return n + (n === 1 ? ' producto' : ' productos'); }

  /* ---------- Detalle ---------- */
  function abrirDetalle(ctx, pid) {
    var e = SB.almacen.estado;
    var hoy = ctx.hoy;
    var p = c.porId(e.productos, pid);
    if (!p) return;
    var u = p.unidad;
    var estados = c.estadosProducto(e, p, hoy);
    var ex = c.existencia(e, pid, hoy);
    var verCostos = ctx.puede('verCostos');
    var prov = c.porId(e.proveedores, p.proveedorId);
    var tasa = c.tasaActual(e).valor;
    var valor = c.valorProducto(e, pid, hoy);

    var cuerpo = '<div class="estados">' + estados.map(ui.estado).join('') + '</div>' +
      '<ul class="lista-simple" role="list" style="margin-top:.5rem">' + estados.map(function (s) {
        return '<li><span class="lista-simple__principal">' + esc(s.detalle) + '</span></li>';
      }).join('') + '</ul>' +
      '<dl class="datos" style="margin-top:1rem">' +
        '<div><dt>Existencia</dt><dd>' + f.cantidad(ex.util, u) + (ex.vencida ? ' <span class="suave">+ ' + f.cantidad(ex.vencida, u) + ' vencido</span>' : '') + '</dd></div>' +
        '<div><dt>Mínimo</dt><dd>' + f.cantidad(p.minimo, u) + '</dd></div>' +
        '<div><dt>Aviso de vencimiento</dt><dd>' + c.diasAviso(e, p) + ' días antes</dd></div>' +
        '<div><dt>Categoría</dt><dd>' + esc(p.categoria) + '</dd></div>' +
        '<div><dt>Proveedor habitual</dt><dd>' + esc(prov ? prov.nombre : 'Sin proveedor') + '</dd></div>' +
        (verCostos ? '<div><dt>Valor</dt><dd>' + ui.dinero(valor, valor * tasa) + '</dd></div>' : '') +
      '</dl>';

    var lotes = c.lotesDe(e, pid);
    cuerpo += '<section class="dialogo__seccion" aria-labelledby="t-lotes"><h3 class="etiqueta suave" id="t-lotes">Lotes en existencia</h3>';
    if (!lotes.length) cuerpo += '<p class="suave">No hay lotes con existencias.</p>';
    else {
      cuerpo += '<ul class="lista-simple" role="list">' + lotes.map(function (l) {
        var pv = c.porId(e.proveedores, l.proveedorId);
        var vencido = c.loteVencido(l, hoy);
        return '<li><span class="lista-simple__principal"><strong>' + f.cantidad(l.cantidad, u) + '</strong>' +
          (vencido ? ' ' + ui.estado({ nivel: 'peligro', texto: 'Vencido' }) : '') +
          '<span class="lista-simple__sub">' + esc(f.vence(l.vence, hoy)) + '</span>' +
          '<span class="lista-simple__sub">Entrada ' + f.fecha(l.entrada) + (pv ? ' · ' + esc(pv.nombre) : '') + '</span></span>' +
          '<span class="lista-simple__lado">' +
            (verCostos ? '<span class="dinero"><span>' + f.eur(l.costoEUR) + ' / ' + esc(f.nombreUnidad(u)) + '</span><span class="dinero__bs">' + (l.moneda === 'VES' ? 'Pagado en Bs. ' + f.num(l.precio) : 'Pagado en €') + '</span></span>' : '') +
            (vencido && ctx.puede('ajustarExistencias') ? '<button type="button" class="btn btn--sutil" data-baja="' + esc(l.id) + '">' + ui.icono('trash-2') + 'Dar de baja</button>' : '') +
          '</span></li>';
      }).join('') + '</ul>';
    }
    cuerpo += '</section>';

    if (verCostos) {
      var precios = c.preciosPorProveedor(e, pid);
      cuerpo += '<section class="dialogo__seccion" aria-labelledby="t-precios"><h3 class="etiqueta suave" id="t-precios">Precio de cada proveedor</h3>';
      cuerpo += precios.length ? '<ul class="lista-simple" role="list">' + precios.map(function (x) {
        var pv = c.porId(e.proveedores, x.proveedorId);
        return '<li><span class="lista-simple__principal"><strong>' + esc(pv ? pv.nombre : '') + '</strong>' +
          (x.mejor ? ' ' + ui.estado({ nivel: 'ok', texto: 'Mejor precio' }) : '') +
          '<span class="lista-simple__sub">Última compra ' + f.fecha(x.ultimo.fecha) + '</span></span>' +
          '<span class="lista-simple__lado"><span class="dinero"><span>' + f.eur(x.ultimo.eur) + ' / ' + esc(f.nombreUnidad(u)) + '</span>' +
          '<span class="dinero__bs">' + (x.ultimo.moneda === 'VES' ? f.bs(x.ultimo.precio) : f.bs(x.ultimo.eur * x.ultimo.tasa)) + '</span></span></span></li>';
      }).join('') + '</ul>' : '<p class="suave">Sin compras registradas.</p>';
      cuerpo += '</section>';
    }

    var movs = e.movimientos.filter(function (m) { return m.productoId === pid; })
      .sort(function (a, b) { return a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : 0; }).slice(0, 8);
    cuerpo += '<section class="dialogo__seccion" aria-labelledby="t-movs"><h3 class="etiqueta suave" id="t-movs">Últimos movimientos</h3>';
    cuerpo += movs.length ? '<ul class="lista-simple" role="list">' + movs.map(function (m) {
      var signo = m.tipo === 'entrada' ? 1 : m.tipo === 'conteo' ? Math.sign(m.cantidad) : -1;
      return '<li><span class="lista-simple__principal"><strong>' + esc(TIPOS[m.tipo] || m.tipo) + '</strong>' +
        '<span class="lista-simple__sub">' + f.fecha(m.fecha) + (m.nota ? ' · ' + esc(m.nota) : '') + (m.por ? ' · ' + esc(m.por) : '') + '</span></span>' +
        '<span class="lista-simple__lado cifra">' + (signo > 0 ? '+' : '−') + ' ' + f.cantidad(Math.abs(m.cantidad), u) + '</span></li>';
    }).join('') + '</ul>' : '<p class="suave">Sin movimientos.</p>';
    cuerpo += '</section>';

    var usado = e.lotes.some(function (l) { return l.productoId === pid; }) || e.platos.some(function (pl) { return pl.receta.some(function (r) { return r.productoId === pid; }); }) ||
      e.compras.some(function (co) { return co.lineas.some(function (l) { return l.productoId === pid; }); });
    var pie = '';
    if (ctx.puede('editarProductos') && !usado) pie += '<button type="button" class="btn btn--secundario" data-eliminar>' + ui.icono('trash-2') + 'Eliminar</button>';
    if (ctx.puede('editarProductos')) pie += '<button type="button" class="btn btn--secundario" data-editar>' + ui.icono('pencil') + 'Editar</button>';
    if (ctx.puede('ajustarExistencias')) pie += '<button type="button" class="btn btn--principal" data-ajustar>' + ui.icono('scale') + 'Ajustar existencias</button>';

    var d = ui.dialogo({ titulo: p.nombre, cuerpo: cuerpo, pie: pie || '<button type="button" class="btn btn--principal" data-cerrar>Cerrar</button>' });
    var b;
    if ((b = d.querySelector('[data-ajustar]'))) b.addEventListener('click', function () { ui.cerrarYAbrir(d, function () { abrirAjuste(ctx, pid); }); });
    if ((b = d.querySelector('[data-editar]'))) b.addEventListener('click', function () { ui.cerrarYAbrir(d, function () { abrirProducto(ctx, pid); }); });
    if ((b = d.querySelector('[data-eliminar]'))) b.addEventListener('click', function () {
      d.close();
      var deshacer = SB.almacen.eliminar('productos', pid);
      ui.avisar('Eliminado: ' + p.nombre + '.', deshacer);
    });
    d.querySelectorAll('[data-baja]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var loteId = btn.getAttribute('data-baja');
        d.close();
        darDeBaja(ctx, loteId);
      });
    });
  }

  function darDeBaja(ctx, loteId) {
    var e = SB.almacen.estado;
    var lote = c.porId(e.lotes, loteId);
    var p = c.porId(e.productos, lote.productoId);
    var antes = lote.cantidad;
    var movId = SB.almacen.nuevoId('mov');
    SB.almacen.cambiar(function (est) {
      var l = c.porId(est.lotes, loteId);
      est.movimientos.push({ id: movId, fecha: ctx.hoy, productoId: l.productoId, loteId: l.id, tipo: 'baja', cantidad: l.cantidad,
        nota: 'Lote vencido el ' + f.fecha(l.vence), por: ctx.rolNombre });
      l.cantidad = 0;
    });
    ui.avisar('Dado de baja: ' + f.cantidad(antes, p.unidad) + ' de ' + p.nombre + '.', function () {
      SB.almacen.cambiar(function (est) {
        c.porId(est.lotes, loteId).cantidad = antes;
        est.movimientos = est.movimientos.filter(function (m) { return m.id !== movId; });
      });
    });
  }

  /* ---------- Ajustar existencias ---------- */
  function abrirAjuste(ctx, pid) {
    var e = SB.almacen.estado;
    var hoy = ctx.hoy;
    var productos = e.productos.slice().sort(function (a, b) { return a.nombre.localeCompare(b.nombre, 'es'); });
    var p = pid ? c.porId(e.productos, pid) : null;
    function ayudaExistencia(prod) {
      if (!prod) return 'Elige un producto para ver cuánto hay.';
      return 'Ahora hay ' + f.cantidad(c.existencia(e, prod.id, hoy).util, prod.unidad) + ' utilizables.';
    }
    var cuerpo = '<div class="formulario">' +
      (p ? '<p><strong>' + esc(p.nombre) + '</strong></p>' :
        ui.campo({ id: 'aj-producto', nombre: 'producto', etiqueta: 'Producto', tipo: 'select', requerido: true,
          opciones: [{ valor: '', texto: 'Elige un producto' }].concat(productos.map(function (x) { return { valor: x.id, texto: x.nombre }; })) })) +
      '<fieldset class="grupo-opciones"><legend>Tipo de ajuste</legend><div class="grupo-opciones__lista">' +
        '<label class="opcion"><input type="radio" name="tipo" value="consumo" checked> Consumo de cocina</label>' +
        '<label class="opcion"><input type="radio" name="tipo" value="merma"> Merma (pérdida)</label>' +
        '<label class="opcion"><input type="radio" name="tipo" value="conteo"> Conteo físico</label>' +
      '</div></fieldset>' +
      ui.campo({ id: 'aj-cantidad', nombre: 'cantidad', etiqueta: 'Cantidad que sale', importe: true, decimales: 3, requerido: true,
        sufijo: p ? p.unidad : '', ayuda: ayudaExistencia(p) }) +
      ui.campo({ id: 'aj-motivo', nombre: 'motivo', etiqueta: 'Motivo', opcional: true, ayuda: 'En una merma, explica qué pasó.' }) +
      ui.campo({ id: 'aj-fecha', nombre: 'fecha', etiqueta: 'Fecha', tipo: 'date', requerido: true, valor: hoy, attrs: ' max="' + hoy + '"' }) +
      '</div>';
    var d = ui.dialogo({
      titulo: 'Ajustar existencias', formulario: true, cuerpo: cuerpo,
      pie: '<button type="button" class="btn btn--secundario" data-cerrar>Cancelar</button><button type="submit" class="btn btn--principal">' + ui.icono('check') + 'Guardar ajuste</button>',
      foco: p ? '#aj-cantidad' : '#aj-producto'
    });
    var form = d.querySelector('form');
    var etiqueta = d.querySelector('label[for="aj-cantidad"]');
    var ayuda = d.querySelector('#aj-cantidad-ayuda');
    var sufijo = d.querySelector('.campo__sufijo');
    function actual() { return p || c.porId(e.productos, ui.valor(form, 'producto')); }
    function refrescar() {
      var tipo = form.querySelector('[name="tipo"]:checked').value;
      etiqueta.textContent = tipo === 'conteo' ? 'Cantidad contada' : 'Cantidad que sale';
      var prod = actual();
      ayuda.textContent = ayudaExistencia(prod) + (tipo === 'conteo' ? ' Escribe el total que hay ahora.' : '');
      if (sufijo) sufijo.textContent = prod ? prod.unidad : '';
    }
    form.addEventListener('change', refrescar);
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var prod = actual();
      var tipo = form.querySelector('[name="tipo"]:checked').value;
      var util = prod ? c.existencia(e, prod.id, hoy).util : 0;
      var reglas = [];
      if (!p) reglas.push({ nombre: 'producto', requerido: true, mensaje: 'Elige el producto.' });
      reglas.push({ nombre: 'cantidad', requerido: true, numero: true, texto: 'la cantidad', positivo: tipo !== 'conteo', noNegativo: tipo === 'conteo',
        max: tipo === 'conteo' || !prod ? undefined : util, mensajeMax: prod ? 'Solo hay ' + f.cantidad(util, prod.unidad) + ' utilizables.' : '' });
      if (tipo === 'merma') reglas.push({ nombre: 'motivo', requerido: true, mensaje: 'Explica el motivo de la merma.' });
      reglas.push({ nombre: 'fecha', requerido: true, texto: 'la fecha' });
      if (ui.validar(form, reglas)) return;
      var cantidad = f.redondear(ui.numero(form, 'cantidad'), 3);
      var motivo = ui.valor(form, 'motivo');
      var fecha = ui.valor(form, 'fecha');
      var copia = JSON.stringify(e.lotes.filter(function (l) { return l.productoId === prod.id; }));
      var nuevos = [];
      var lotesNuevos = [];
      var cambio = 0;
      SB.almacen.cambiar(function (est) {
        if (tipo === 'conteo') {
          cambio = f.redondear(cantidad - util, 3);
          if (cambio < 0) {
            c.descontar(est, prod.id, -cambio, hoy, false).forEach(function (t) {
              var m = { id: SB.almacen.nuevoId('mov'), fecha: fecha, productoId: prod.id, loteId: t.loteId, tipo: 'conteo', cantidad: -t.cantidad, nota: motivo || 'Conteo físico', por: ctx.rolNombre };
              est.movimientos.push(m); nuevos.push(m.id);
            });
          } else if (cambio > 0) {
            var vigentes = c.lotesDe(est, prod.id).filter(function (l) { return !c.loteVencido(l, hoy); });
            var lote = vigentes[vigentes.length - 1];
            if (!lote) {
              var up = c.ultimoPrecio(est, prod.id);
              lote = { id: SB.almacen.nuevoId('lote'), productoId: prod.id, compraId: null, proveedorId: null, entrada: fecha, vence: null,
                cantidadInicial: 0, cantidad: 0, costoEUR: up ? up.eur : 0, moneda: 'EUR', precio: up ? up.eur : 0, tasa: c.tasaActual(est).valor };
              est.lotes.push(lote); lotesNuevos.push(lote.id);
            }
            lote.cantidad = f.redondear(lote.cantidad + cambio, 3);
            var m2 = { id: SB.almacen.nuevoId('mov'), fecha: fecha, productoId: prod.id, loteId: lote.id, tipo: 'conteo', cantidad: cambio, nota: motivo || 'Conteo físico', por: ctx.rolNombre };
            est.movimientos.push(m2); nuevos.push(m2.id);
          }
        } else {
          cambio = -cantidad;
          c.descontar(est, prod.id, cantidad, hoy, false).forEach(function (t) {
            var m = { id: SB.almacen.nuevoId('mov'), fecha: fecha, productoId: prod.id, loteId: t.loteId, tipo: tipo, cantidad: t.cantidad,
              nota: motivo || (tipo === 'consumo' ? 'Consumo de cocina' : ''), por: ctx.rolNombre };
            est.movimientos.push(m); nuevos.push(m.id);
          });
        }
      });
      d.close();
      if (cambio === 0) { ui.avisar('Sin cambios: el conteo coincide con lo registrado.'); return; }
      ui.avisar('Existencias ajustadas: ' + prod.nombre + ', ' + (cambio > 0 ? '+' : '−') + ' ' + f.cantidad(Math.abs(cambio), prod.unidad) + '.', function () {
        SB.almacen.cambiar(function (est) {
          var previos = JSON.parse(copia);
          est.lotes = est.lotes.filter(function (l) { return l.productoId !== prod.id; }).concat(previos);
          est.movimientos = est.movimientos.filter(function (m) { return nuevos.indexOf(m.id) < 0; });
        });
      });
    });
  }

  /* ---------- Nuevo o editar producto ---------- */
  function abrirProducto(ctx, pid) {
    var e = SB.almacen.estado;
    var p = pid ? c.porId(e.productos, pid) : null;
    var conLotes = p && e.lotes.some(function (l) { return l.productoId === pid; });
    var cuerpo = '<div class="formulario">' +
      ui.campo({ id: 'pr-nombre', nombre: 'nombre', etiqueta: 'Nombre', requerido: true, valor: p ? p.nombre : '' }) +
      '<div class="formulario__fila formulario__fila--2">' +
      ui.campo({ id: 'pr-categoria', nombre: 'categoria', etiqueta: 'Categoría', tipo: 'select', valor: p ? p.categoria : SB.semilla.CATEGORIAS[0],
        opciones: SB.semilla.CATEGORIAS }) +
      ui.campo({ id: 'pr-unidad', nombre: 'unidad', etiqueta: 'Unidad', tipo: 'select', valor: p ? p.unidad : 'kg', opciones: UNIDADES,
        attrs: conLotes ? ' disabled' : '', ayuda: conLotes ? 'No se puede cambiar: ya tiene lotes registrados.' : '' }) +
      '</div><div class="formulario__fila formulario__fila--2">' +
      ui.campo({ id: 'pr-minimo', nombre: 'minimo', etiqueta: 'Mínimo', importe: true, decimales: 3, requerido: true,
        valor: p ? f.numCantidad(p.minimo) : '', ayuda: 'Por debajo o igual a esta cantidad sale «Bajo mínimo».' }) +
      ui.campo({ id: 'pr-aviso', nombre: 'aviso', etiqueta: 'Días de aviso antes de vencer', tipo: 'number', requerido: true,
        valor: p && p.diasAviso !== null ? p.diasAviso : e.config.diasAviso, attrs: ' min="0" max="60" step="1" inputmode="numeric"',
        ayuda: 'Por defecto, ' + e.config.diasAviso + ' días.' }) +
      '</div>' +
      ui.campo({ id: 'pr-proveedor', nombre: 'proveedor', etiqueta: 'Proveedor habitual', tipo: 'select', valor: p ? p.proveedorId || '' : '',
        opciones: [{ valor: '', texto: 'Sin proveedor' }].concat(e.proveedores.map(function (x) { return { valor: x.id, texto: x.nombre }; })) }) +
      '</div>';
    var d = ui.dialogo({
      titulo: p ? 'Editar producto' : 'Nuevo producto', formulario: true, cuerpo: cuerpo,
      pie: '<button type="button" class="btn btn--secundario" data-cerrar>Cancelar</button><button type="submit" class="btn btn--principal">' + ui.icono('check') + 'Guardar producto</button>',
      foco: '#pr-nombre'
    });
    d.querySelector('form').addEventListener('submit', function (ev) {
      ev.preventDefault();
      var form = ev.target;
      if (ui.validar(form, [
        { nombre: 'nombre', requerido: true, texto: 'el nombre', extra: function (v) {
          var otro = e.productos.find(function (x) { return x.id !== pid && f.normalizar(x.nombre) === f.normalizar(v); });
          return otro ? 'Ya existe un producto con ese nombre.' : null;
        } },
        { nombre: 'minimo', requerido: true, numero: true, noNegativo: true, texto: 'el mínimo' },
        { nombre: 'aviso', requerido: true, numero: true, noNegativo: true, texto: 'los días de aviso' }
      ])) return;
      var datosP = {
        nombre: ui.valor(form, 'nombre'), categoria: ui.valor(form, 'categoria'), minimo: ui.numero(form, 'minimo'),
        diasAviso: Math.round(ui.numero(form, 'aviso')), proveedorId: ui.valor(form, 'proveedor') || null
      };
      if (!conLotes) datosP.unidad = ui.valor(form, 'unidad');
      if (datosP.diasAviso === e.config.diasAviso && (!p || p.diasAviso === null)) datosP.diasAviso = null;
      SB.almacen.cambiar(function (est) {
        if (p) Object.assign(c.porId(est.productos, pid), datosP);
        else est.productos.push(Object.assign({ id: SB.almacen.nuevoId('prod') }, datosP));
      });
      d.close();
      ui.avisar(p ? 'Producto actualizado.' : 'Producto creado: ' + datosP.nombre + '.');
    });
  }

  SB.vistas.inventario = {
    accionesPantalla: function (ctx) {
      var a = '<button type="button" class="btn btn--secundario" data-accion="ajustar">' + ui.icono('scale') + 'Ajustar existencias</button>';
      if (ctx.puede('editarProductos')) a += '<button type="button" class="btn btn--principal" data-accion="nuevo">' + ui.icono('plus') + 'Nuevo producto</button>';
      return a;
    },
    render: function (ctx) {
      var p = ctx.params;
      return '<form class="filtros" role="search" aria-label="Filtrar el inventario">' +
        ui.campo({ id: 'f-q', nombre: 'q', etiqueta: 'Buscar', tipo: 'search', valor: p.q || '', icono: 'search', attrs: ' data-filtro autocomplete="off" placeholder="Nombre o categoría"' }) +
        ui.campo({ id: 'f-categoria', nombre: 'categoria', etiqueta: 'Categoría', tipo: 'select', valor: p.categoria || '', attrs: ' data-filtro',
          opciones: [{ valor: '', texto: 'Todas' }].concat(SB.semilla.CATEGORIAS) }) +
        ui.campo({ id: 'f-estado', nombre: 'estado', etiqueta: 'Estado', tipo: 'select', valor: p.estado || '', attrs: ' data-filtro', opciones: ESTADOS }) +
        '<label class="casilla"><input type="checkbox" name="vence" value="semana" data-filtro' + (p.vence === 'semana' ? ' checked' : '') + '> Vence esta semana</label>' +
        '</form>' +
        '<div class="filtros__pie"><p class="filtros__cuenta" role="status" data-cuenta></p>' +
        '<button type="button" class="btn btn--sutil" data-accion="limpiar" data-limpiar>' + ui.icono('filter-x') + 'Limpiar filtros</button></div>' +
        '<div data-lista></div>';
    },
    despues: function (main, ctx) { this.pintarLista(main, ctx); },
    pintarLista: function (main, ctx) {
      main.querySelector('[data-lista]').innerHTML = lista(ctx);
      main.querySelector('[data-cuenta]').textContent = cuentaTexto(datos(ctx).length) + (hayFiltros(ctx.params) ? ' con estos filtros' : '');
      main.querySelector('[data-limpiar]').hidden = !hayFiltros(ctx.params);
    },
    filtrar: function (main) {
      var form = main.querySelector('.filtros');
      return { q: form.q.value.trim(), categoria: form.categoria.value, estado: form.estado.value, vence: form.vence.checked ? 'semana' : '' };
    },
    acciones: {
      detalle: function (el, ctx) { abrirDetalle(ctx, el.getAttribute('data-id')); },
      ajustar: function (el, ctx) { abrirAjuste(ctx, null); },
      nuevo: function (el, ctx) { abrirProducto(ctx, null); },
      limpiar: function (el, ctx) {
        ctx.fijarParams({});
        ctx.params = {};
        SB.app.render();
        var b = document.getElementById('f-q');
        if (b) b.focus();
      }
    },
    abrirAjuste: abrirAjuste,
    abrirDetalle: abrirDetalle
  };
})(window.SB = window.SB || {});
