/* Compras y proveedores: pedidos, recepción (crea lotes, precio y gasto o cuenta), proveedores e historial de precios. */
(function (SB) {
  'use strict';

  var f = SB.f;
  var ui = SB.ui;
  var c = SB.calc;
  var esc = f.esc;
  SB.vistas = SB.vistas || {};

  var EST_COMPRA = {
    pendiente: { clave: 'pendiente', nivel: 'info', texto: 'Pendiente' },
    recibida: { clave: 'recibida', nivel: 'ok', texto: 'Recibida' }
  };

  function provDe(e, id) { return c.porId(e.proveedores, id) || { nombre: 'Proveedor eliminado', moneda: 'EUR', credito: 0 }; }
  function nombresLineas(e, co) {
    var n = co.lineas.map(function (l) { var p = c.porId(e.productos, l.productoId); return p ? p.nombre : '—'; });
    return n.length > 3 ? n.slice(0, 3).join(', ') + ' y ' + (n.length - 3) + ' más' : n.join(', ');
  }
  function pagoTexto(co) {
    if (co.pago === 'contado') return 'Contado';
    return 'Crédito' + (co.vencePago ? ' · vence ' + f.fecha(co.vencePago) : '');
  }
  function subnav(ctx) {
    var items = [['', 'Compras'], ['proveedores', 'Proveedores']];
    if (ctx.puede('verCostos')) items.push(['precios', 'Precios']);
    return '<nav class="subnav" aria-label="Compras y proveedores">' + items.map(function (it) {
      var actual = (ctx.sub || '') === it[0];
      return '<a href="#/compras' + (it[0] ? '/' + it[0] : '') + '"' + (actual ? ' aria-current="page"' : '') + '>' + it[1] + '</a>';
    }).join('') + '</nav>';
  }
  function hayFiltros(p) { return Object.keys(p).some(function (k) { return p[k]; }); }
  function pieFiltros() {
    return '<div class="filtros__pie"><p class="filtros__cuenta" role="status" data-cuenta></p>' +
      '<button type="button" class="btn btn--sutil" data-accion="limpiar" data-limpiar>' + ui.icono('filter-x') + 'Limpiar filtros</button></div>';
  }

  /* ======================= Compras ======================= */
  function comprasFiltradas(ctx) {
    var e = ctx.e;
    var p = ctx.params;
    var q = f.normalizar(p.q || '');
    return e.compras.filter(function (co) {
      if (p.estado && co.estado !== p.estado) return false;
      if (p.proveedor && co.proveedorId !== p.proveedor) return false;
      if (q && f.normalizar(provDe(e, co.proveedorId).nombre + ' ' + nombresLineas(e, co)).indexOf(q) < 0) return false;
      return true;
    }).sort(function (a, b) {
      if (a.estado !== b.estado) return a.estado === 'pendiente' ? -1 : 1;
      return a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : 0;
    });
  }

  function listaCompras(ctx) {
    var e = ctx.e;
    var filas = comprasFiltradas(ctx);
    var ver = ctx.puede('verCostos');
    if (!filas.length) {
      return '<div class="tarjeta">' + ui.vacio('ave', hayFiltros(ctx.params) ? 'Ninguna compra coincide con estos filtros.' : 'Todavía no hay compras registradas.',
        hayFiltros(ctx.params) ? '<button type="button" class="btn btn--secundario" data-accion="limpiar">' + ui.icono('filter-x') + 'Limpiar filtros</button>' :
          (ctx.puede('gestionarCompras') ? '<button type="button" class="btn btn--principal" data-accion="nueva-compra">' + ui.icono('plus') + 'Registrar compra</button>' : '')) + '</div>';
    }
    var tabla = '<div class="tabla-caja solo-tabla"><table class="tabla tabla--filas">' +
      '<caption class="sr">Compras. Las pendientes de recibir van primero.</caption><thead><tr>' +
      '<th scope="col">Fecha</th><th scope="col">Proveedor</th>' + (ver ? '<th scope="col" class="num">Total</th><th scope="col" class="solo-ancho">Pago</th>' : '') +
      '<th scope="col">Estado</th></tr></thead><tbody>' +
      filas.map(function (co) {
        return '<tr data-fila><td>' + f.fecha(co.recibida || co.fecha) + '</td>' +
          '<td><button type="button" class="tabla__nombre" data-accion="compra" data-id="' + esc(co.id) + '">' + esc(provDe(e, co.proveedorId).nombre) + '</button>' +
          '<span class="tabla__sub">' + esc(nombresLineas(e, co)) + '</span></td>' +
          (ver ? '<td class="num">' + ui.dineroDe(co.total) + '</td><td class="solo-ancho">' + esc(pagoTexto(co)) + '</td>' : '') +
          '<td>' + ui.estado(EST_COMPRA[co.estado]) + '</td></tr>';
      }).join('') + '</tbody></table></div>';
    var fichas = '<ul class="fichas solo-movil" role="list">' + filas.map(function (co) {
      return '<li><button type="button" class="ficha" data-accion="compra" data-id="' + esc(co.id) + '">' +
        '<span class="ficha__arriba"><span class="ficha__nombre">' + esc(provDe(e, co.proveedorId).nombre) + '</span>' + ui.estado(EST_COMPRA[co.estado]) + '</span>' +
        '<span class="suave">' + esc(nombresLineas(e, co)) + '</span>' +
        '<span class="ficha__abajo"><span class="ficha__dato"><span>' + (co.estado === 'pendiente' ? 'Pedida' : 'Recibida') + '</span><span>' + f.fecha(co.recibida || co.fecha) + '</span></span>' +
        (ver ? '<span class="ficha__dato ficha__dato--cifra"><span>Total</span>' + ui.dineroDe(co.total) + '</span><span class="ficha__dato"><span>Pago</span><span>' + esc(pagoTexto(co)) + '</span></span>' : '') +
        '</span></button></li>';
    }).join('') + '</ul>';
    return tabla + fichas;
  }

  function abrirCompra(ctx, id) {
    var e = SB.almacen.estado;
    var co = c.porId(e.compras, id);
    if (!co) return;
    var prov = provDe(e, co.proveedorId);
    var ver = ctx.puede('verCostos');
    var cuerpo = ui.estado(EST_COMPRA[co.estado]) +
      '<dl class="datos" style="margin-top:1rem">' +
      '<div><dt>Proveedor</dt><dd>' + esc(prov.nombre) + '</dd></div>' +
      '<div><dt>Pedida</dt><dd>' + f.fecha(co.fecha) + '</dd></div>' +
      (co.recibida ? '<div><dt>Recibida</dt><dd>' + f.fecha(co.recibida) + '</dd></div>' : '') +
      (ver ? '<div><dt>Pago</dt><dd>' + esc(pagoTexto(co)) + '</dd></div>' : '') +
      (ver ? '<div><dt>Moneda y tasa</dt><dd>' + (co.moneda === 'EUR' ? 'Euros' : 'Bolívares') + '<span class="tabla__sub">' + f.tasaTexto(co.tasa, true) + '</span></dd></div>' : '') +
      '<div><dt>Registró</dt><dd>' + esc(co.por || '—') + (co.recibidaPor ? '<span class="tabla__sub">Recibió: ' + esc(co.recibidaPor) + '</span>' : '') + '</dd></div>' +
      '</dl>' +
      '<section class="dialogo__seccion" aria-labelledby="t-lineas"><h3 class="etiqueta suave" id="t-lineas">Productos</h3>' +
      '<table class="tabla tabla--compacta tabla--interior"><thead><tr><th scope="col">Producto</th><th scope="col" class="num">Cantidad</th>' +
      (ver ? '<th scope="col" class="num">Subtotal</th>' : '') + '</tr></thead><tbody>' +
      co.lineas.map(function (l) {
        var p = c.porId(e.productos, l.productoId) || { nombre: '—', unidad: '' };
        return '<tr><td>' + esc(p.nombre) + (ver ? '<span class="tabla__sub">' + f.importe(co.moneda, l.precio) + ' / ' + esc(f.nombreUnidad(p.unidad)) + '</span>' : '') + '</td>' +
          '<td class="num">' + f.cantidad(l.cantidad, p.unidad) + '</td>' +
          (ver ? '<td class="num">' + f.importe(co.moneda, l.precio * l.cantidad) + '</td>' : '') + '</tr>';
      }).join('') + '</tbody>' +
      (ver ? '<tfoot><tr><td colspan="2">Total</td><td class="num">' + ui.dineroDe(co.total) + '</td></tr></tfoot>' : '') + '</table></section>';
    var pie = '';
    if (co.estado === 'pendiente') {
      if (ctx.puede('gestionarCompras')) pie += '<button type="button" class="btn btn--secundario" data-eliminar>' + ui.icono('trash-2') + 'Eliminar pedido</button>';
      if (ctx.puede('recibirCompra')) pie += '<button type="button" class="btn btn--principal" data-recibir>' + ui.icono('truck') + 'Recibir compra</button>';
    }
    var d = ui.dialogo({ titulo: 'Compra a ' + prov.nombre, cuerpo: cuerpo, pie: pie || '<button type="button" class="btn btn--principal" data-cerrar>Cerrar</button>' });
    var b;
    if ((b = d.querySelector('[data-recibir]'))) b.addEventListener('click', function () { ui.cerrarYAbrir(d, function () { abrirRecibir(ctx, id); }); });
    if ((b = d.querySelector('[data-eliminar]'))) b.addEventListener('click', function () {
      d.close();
      var deshacer = SB.almacen.eliminar('compras', id);
      ui.avisar('Eliminado: pedido a ' + prov.nombre + '.', deshacer);
    });
  }

  /* Recibir: crea lotes, suma existencias, guarda el precio y anota el gasto o la cuenta por pagar */
  function recibir(est, co, fecha, cantidades, vences, rolNombre) {
    var prov = provDe(est, co.proveedorId);
    var tasa = c.tasaVigente(est, fecha).valor;
    co.estado = 'recibida';
    co.recibida = fecha;
    co.recibidaPor = rolNombre;
    co.tasa = tasa;
    co.lineas.forEach(function (l, i) {
      if (cantidades) l.cantidad = cantidades[i];
      if (!l.cantidad) return;
      var lote = { id: SB.almacen.nuevoId('lote'), productoId: l.productoId, compraId: co.id, proveedorId: co.proveedorId, entrada: fecha,
        vence: vences && vences[i] ? vences[i] : null, cantidadInicial: l.cantidad, cantidad: l.cantidad,
        costoEUR: co.moneda === 'EUR' ? l.precio : f.redondear(l.precio / tasa, 4), moneda: co.moneda, precio: l.precio, tasa: tasa };
      est.lotes.push(lote);
      est.movimientos.push({ id: SB.almacen.nuevoId('mov'), fecha: fecha, productoId: l.productoId, loteId: lote.id, tipo: 'entrada',
        cantidad: l.cantidad, nota: 'Compra a ' + prov.nombre, por: rolNombre });
    });
    co.lineas = co.lineas.filter(function (l) { return l.cantidad > 0; });
    co.total = f.dinero(co.moneda, co.lineas.reduce(function (s, l) { return s + f.redondear(l.precio * l.cantidad, 2); }, 0), tasa);
    if (co.pago === 'contado') {
      var g = { id: SB.almacen.nuevoId('gasto'), fecha: fecha, categoria: 'Insumos', concepto: 'Compra a ' + prov.nombre, proveedorId: co.proveedorId,
        dinero: co.total, origen: 'compra', compraId: co.id, por: rolNombre };
      est.gastos.push(g);
      co.gastoId = g.id;
    } else {
      co.vencePago = f.sumarDias(fecha, prov.credito || 15);
      var cu = { id: SB.almacen.nuevoId('cuenta'), proveedorId: co.proveedorId, acreedor: prov.nombre, concepto: 'Compra del ' + f.fecha(fecha),
        compraId: co.id, emitida: fecha, vence: co.vencePago, dinero: co.total, pagada: null, gastoId: null, origen: 'compra' };
      est.cuentas.push(cu);
      co.cuentaId = cu.id;
    }
  }

  function venceSugerido(e, pid, fecha) {
    var lotes = e.lotes.filter(function (l) { return l.productoId === pid && l.vence; });
    if (!lotes.length) return '';
    var l = lotes[lotes.length - 1];
    return f.sumarDias(fecha, f.diasEntre(l.entrada, l.vence));
  }

  function abrirRecibir(ctx, id) {
    var e = SB.almacen.estado;
    var co = c.porId(e.compras, id);
    var prov = provDe(e, co.proveedorId);
    var hoy = ctx.hoy;
    var cuerpo = '<div class="formulario">' +
      '<p>Revisa lo que llegó. Al recibir se crean los lotes, se suman las existencias, se guarda el precio y ' +
      (co.pago === 'contado' ? 'se anota el gasto.' : 'se abre la cuenta por pagar.') + '</p>' +
      ui.campo({ id: 're-fecha', nombre: 'fecha', etiqueta: 'Fecha de recepción', tipo: 'date', requerido: true, valor: hoy, attrs: ' max="' + hoy + '"' }) +
      '<div class="lineas">' + co.lineas.map(function (l, i) {
        var p = c.porId(e.productos, l.productoId);
        return '<fieldset class="linea-form"><legend class="sr">' + esc(p.nombre) + '</legend><div class="linea-form__cabeza"><strong>' + esc(p.nombre) + '</strong>' +
          '<span class="suave">Pedido: ' + f.cantidad(l.cantidad, p.unidad) + '</span></div><div class="linea-form__campos">' +
          ui.campo({ id: 're-cant-' + i, nombre: 'cant-' + i, etiqueta: 'Cantidad recibida', importe: true, decimales: 3, requerido: true,
            valor: f.numCantidad(l.cantidad), sufijo: p.unidad, ayuda: 'Escribe 0 si no llegó.' }) +
          ui.campo({ id: 're-vence-' + i, nombre: 'vence-' + i, etiqueta: 'Vence', tipo: 'date', opcional: true, valor: venceSugerido(e, p.id, hoy),
            ayuda: 'Déjalo vacío si no vence.' }) +
          '</div></fieldset>';
      }).join('') + '</div></div>';
    var d = ui.dialogo({
      titulo: 'Recibir compra de ' + prov.nombre, formulario: true, cuerpo: cuerpo,
      pie: '<button type="button" class="btn btn--secundario" data-cerrar>Cancelar</button><button type="submit" class="btn btn--principal">' + ui.icono('package-check') + 'Confirmar recepción</button>',
      foco: '#re-cant-0'
    });
    d.querySelector('form').addEventListener('submit', function (ev) {
      ev.preventDefault();
      var form = ev.target;
      var reglas = [{ nombre: 'fecha', requerido: true, texto: 'la fecha' }];
      co.lineas.forEach(function (l, i) {
        var pr = c.porId(e.productos, l.productoId);
        reglas.push({ nombre: 'cant-' + i, requerido: true, numero: true, noNegativo: true, texto: 'la cantidad', entero: !!pr && pr.unidad === 'und' });
      });
      if (ui.validar(form, reglas)) return;
      var cantidades = co.lineas.map(function (l, i) { return f.redondear(ui.numero(form, 'cant-' + i), 3); });
      if (cantidades.every(function (x) { return x === 0; })) { ui.marcarError(form.querySelector('[name="cant-0"]'), 'Si no llegó nada, cierra y deja el pedido pendiente.'); form.querySelector('[name="cant-0"]').focus(); return; }
      var vences = co.lineas.map(function (l, i) { return ui.valor(form, 'vence-' + i) || null; });
      var fecha = ui.valor(form, 'fecha');
      SB.almacen.cambiar(function (est) { recibir(est, c.porId(est.compras, id), fecha, cantidades, vences, ctx.rolNombre); });
      d.close();
      ui.avisar('Compra recibida: ' + prov.nombre + '. Existencias actualizadas.');
    });
  }

  /* Registrar compra: proveedor, líneas, moneda, pago y si ya llegó */
  function abrirNuevaCompra(ctx, proveedorId) {
    var e = SB.almacen.estado;
    var hoy = ctx.hoy;
    var tasa = c.tasaActual(e);
    var productos = e.productos.slice().sort(function (a, b) { return a.nombre.localeCompare(b.nombre, 'es'); });
    var opcionesProd = [{ valor: '', texto: 'Elige un producto' }].concat(productos.map(function (p) { return { valor: p.id, texto: p.nombre + ' (' + p.unidad + ')' }; }));
    var n = 0;

    function lineaHTML(i) {
      return '<fieldset class="linea-form" data-linea="' + i + '"><legend class="sr">Producto ' + (i + 1) + '</legend>' +
        '<div class="linea-form__cabeza"><strong data-num></strong>' +
        '<button type="button" class="btn btn--sutil" data-quitar>' + ui.icono('minus') + 'Quitar</button></div>' +
        '<div class="linea-form__campos">' +
        ui.campo({ id: 'nc-prod-' + i, nombre: 'prod-' + i, etiqueta: 'Producto', tipo: 'select', opciones: opcionesProd, requerido: true }) +
        ui.campo({ id: 'nc-cant-' + i, nombre: 'cant-' + i, etiqueta: 'Cantidad', importe: true, decimales: 3, requerido: true, ayuda: 'Elige primero el producto.' }) +
        ui.campo({ id: 'nc-precio-' + i, nombre: 'precio-' + i, etiqueta: 'Precio por unidad', importe: true, requerido: true, sufijo: '€', ayuda: ' ' }) +
        ui.campo({ id: 'nc-vence-' + i, nombre: 'vence-' + i, etiqueta: 'Vence', tipo: 'date', opcional: true, clase: 'campo--vence' }) +
        '</div></fieldset>';
    }

    var cuerpo = '<div class="formulario">' +
      ui.campo({ id: 'nc-prov', nombre: 'proveedor', etiqueta: 'Proveedor', tipo: 'select', requerido: true, valor: proveedorId || '',
        opciones: [{ valor: '', texto: 'Elige un proveedor' }].concat(e.proveedores.map(function (p) { return { valor: p.id, texto: p.nombre }; })) }) +
      '<div class="formulario__fila formulario__fila--2">' +
      ui.campo({ id: 'nc-fecha', nombre: 'fecha', etiqueta: 'Fecha', tipo: 'date', requerido: true, valor: hoy, attrs: ' max="' + hoy + '"' }) +
      '<fieldset class="grupo-opciones"><legend>Moneda</legend><div class="grupo-opciones__lista">' +
        '<label class="opcion"><input type="radio" name="moneda" value="EUR" checked> Euros (€)</label>' +
        '<label class="opcion"><input type="radio" name="moneda" value="VES"> Bolívares (Bs.)</label></div></fieldset>' +
      '</div>' +
      '<p class="campo__ayuda" data-tasa-ayuda>Tasa vigente hoy: ' + f.tasaTexto(tasa.valor, true) + ' · ' + f.fecha(tasa.fecha) + '. Queda guardada con el registro.</p>' +
      '<div class="lineas" data-lineas></div>' +
      '<div><button type="button" class="btn btn--secundario" data-agregar>' + ui.icono('list-plus') + 'Agregar producto</button></div>' +
      '<fieldset class="grupo-opciones"><legend>¿Ya llegó?</legend><div class="grupo-opciones__lista">' +
        '<label class="opcion"><input type="radio" name="estado" value="pendiente" checked> No, es un pedido</label>' +
        '<label class="opcion"><input type="radio" name="estado" value="recibida"> Sí, ya la recibí</label></div></fieldset>' +
      '<fieldset class="grupo-opciones"><legend>Pago</legend><div class="grupo-opciones__lista">' +
        '<label class="opcion"><input type="radio" name="pago" value="contado" checked> Contado</label>' +
        '<label class="opcion"><input type="radio" name="pago" value="credito"> Crédito</label></div></fieldset>' +
      '<div class="resumen-form" data-resumen data-total></div>' +
      '</div>';
    var d = ui.dialogo({
      titulo: 'Registrar compra', formulario: true, cuerpo: cuerpo,
      pie: '<button type="button" class="btn btn--secundario" data-cerrar>Cancelar</button><button type="submit" class="btn btn--principal">' + ui.icono('check') + 'Guardar compra</button>',
      foco: proveedorId ? '#nc-prod-0' : '#nc-prov'
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
    var cont = form.querySelector('[data-lineas]');

    function moneda() { return form.querySelector('[name="moneda"]:checked').value; }
    function lineas() { return Array.prototype.slice.call(cont.querySelectorAll('[data-linea]')); }
    function renumerar() {
      var ls = lineas();
      ls.forEach(function (l, k) {
        l.querySelector('[data-num]').textContent = 'Producto ' + (k + 1);
        l.querySelector('[data-quitar]').hidden = ls.length === 1;
        l.querySelector('legend').textContent = 'Producto ' + (k + 1);
      });
    }
    function agregar() {
      cont.insertAdjacentHTML('beforeend', lineaHTML(n));
      var nueva = cont.lastElementChild;
      n += 1;
      ui.enlazarImportes(nueva);
      renumerar();
      actualizarMoneda();
      return nueva;
    }
    function precioSugerido(pid) {
      var provId = ui.valor(form, 'proveedor');
      var h = c.historialPrecios(e, pid).filter(function (x) { return !provId || x.proveedorId === provId; });
      if (!h.length) h = c.historialPrecios(e, pid);
      if (!h.length) return null;
      var u = h[h.length - 1];
      return moneda() === u.moneda ? u.precio : (moneda() === 'EUR' ? u.eur : u.eur * tv().valor);
    }
    function actualizarMoneda() {
      var m = moneda();
      form.querySelectorAll('[name^="precio-"]').forEach(function (inp) {
        inp.parentNode.querySelector('.campo__sufijo').textContent = f.simbolo(m);
      });
      var recibida = form.querySelector('[name="estado"]:checked').value === 'recibida';
      form.querySelectorAll('.campo--vence').forEach(function (x) { x.hidden = !recibida; });
      total();
    }
    function total() {
      var m = moneda();
      var s = 0;
      var completas = 0;
      lineas().forEach(function (l) {
        var i = l.getAttribute('data-linea');
        var cant = ui.numero(form, 'cant-' + i);
        var precio = ui.numero(form, 'precio-' + i);
        if (!isNaN(cant) && !isNaN(precio)) { s += cant * precio; completas += 1; }
      });
      var dn = f.dinero(m, s, tv().valor);
      form.querySelector('[data-total]').innerHTML =
        '<div class="resumen-form__fila"><span>Total (' + completas + (completas === 1 ? ' línea' : ' líneas') + ')</span><strong class="cifra">' + f.eur(dn.eur) + '</strong></div>' +
        '<div class="resumen-form__fila suave"><span>' + (m === 'VES' ? 'En Bs., como se paga' : 'En Bs.') + '</span><span class="cifra">' + f.bs(dn.bs) + '</span></div>';
    }

    form.addEventListener('change', function (ev) {
      var t = ev.target;
      if (t.name === 'proveedor') {
        var prov = c.porId(e.proveedores, t.value);
        if (prov) {
          form.querySelector('[name="moneda"][value="' + prov.moneda + '"]').checked = true;
          form.querySelector('[name="pago"][value="' + (prov.credito ? 'credito' : 'contado') + '"]').checked = true;
        }
        actualizarMoneda();
      }
      if (t.name === 'moneda' || t.name === 'estado') actualizarMoneda();
      if (/^prod-/.test(t.name)) {
        var i = t.name.slice(5);
        var precio = precioSugerido(t.value);
        var inp = form.querySelector('[name="precio-' + i + '"]');
        var ayuda = form.querySelector('#nc-precio-' + i + '-ayuda');
        if (precio !== null) {
          inp.value = f.num(f.redondear(precio, 2)).replace('−', '-');
          ayuda.textContent = 'Último precio pagado. Puedes cambiarlo.';
        } else ayuda.textContent = 'Sin compras anteriores de este producto.';
        var p = c.porId(e.productos, t.value);
        var ayudaCant = form.querySelector('#nc-cant-' + i + '-ayuda');
        if (ayudaCant) ayudaCant.textContent = p ? 'En ' + ({ kg: 'kilos', L: 'litros', und: 'unidades', manojo: 'manojos' }[p.unidad] || p.unidad) + '.' : ' ';
        var venc = form.querySelector('[name="vence-' + i + '"]');
        if (p && !venc.value) venc.value = venceSugerido(e, p.id, ui.valor(form, 'fecha') || hoy);
        total();
      }
    });
    form.addEventListener('input', function (ev) { if (/^(cant|precio)-/.test(ev.target.name)) total(); });
    form.querySelector('[data-agregar]').addEventListener('click', function () { agregar().querySelector('select').focus(); });
    cont.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-quitar]');
      if (!b) return;
      var l = b.closest('[data-linea]');
      var anterior = l.previousElementSibling || l.nextElementSibling;
      l.remove();
      renumerar();
      total();
      if (anterior) anterior.querySelector('select').focus();
    });
    agregar();
    if (proveedorId) form.querySelector('[name="proveedor"]').dispatchEvent(new Event('change', { bubbles: true }));

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var reglas = [{ nombre: 'proveedor', requerido: true, mensaje: 'Elige el proveedor.' }, { nombre: 'fecha', requerido: true, texto: 'la fecha' }];
      lineas().forEach(function (l) {
        var i = l.getAttribute('data-linea');
        reglas.push({ nombre: 'prod-' + i, requerido: true, mensaje: 'Elige el producto.' });
        reglas.push({ nombre: 'cant-' + i, requerido: true, numero: true, positivo: true, texto: 'la cantidad',
          entero: function () { var pr = c.porId(e.productos, ui.valor(form, 'prod-' + i)); return !!pr && pr.unidad === 'und'; } });
        reglas.push({ nombre: 'precio-' + i, requerido: true, numero: true, positivo: true, texto: 'el precio' });
      });
      if (ui.validar(form, reglas)) return;
      var m = moneda();
      var fecha = ui.valor(form, 'fecha');
      var estado = form.querySelector('[name="estado"]:checked').value;
      var pago = form.querySelector('[name="pago"]:checked').value;
      var ls = lineas().map(function (l) {
        var i = l.getAttribute('data-linea');
        return { productoId: ui.valor(form, 'prod-' + i), cantidad: f.redondear(ui.numero(form, 'cant-' + i), 3), precio: f.redondear(ui.numero(form, 'precio-' + i), 2),
          vence: ui.valor(form, 'vence-' + i) || null };
      });
      var provId = ui.valor(form, 'proveedor');
      var prov = c.porId(e.proveedores, provId);
      SB.almacen.cambiar(function (est) {
        var co = { id: SB.almacen.nuevoId('compra'), proveedorId: provId, fecha: fecha, recibida: null, estado: 'pendiente', moneda: m, tasa: tv().valor,
          lineas: ls.map(function (l) { return { productoId: l.productoId, cantidad: l.cantidad, precio: l.precio }; }),
          total: f.dinero(m, ls.reduce(function (s, l) { return s + f.redondear(l.cantidad * l.precio, 2); }, 0), tv().valor),
          pago: pago, vencePago: null, por: ctx.rolNombre };
        est.compras.push(co);
        if (estado === 'recibida') recibir(est, co, fecha, null, ls.map(function (l) { return l.vence; }), ctx.rolNombre);
      });
      d.close();
      ui.avisar(estado === 'recibida' ? 'Compra registrada y recibida: ' + prov.nombre + '.' : 'Pedido registrado: ' + prov.nombre + '. Queda pendiente de recibir.');
    });
    actualizarMoneda();
  }

  /* ======================= Proveedores ======================= */
  function infoProveedor(e, prov, hoy) {
    var compras = e.compras.filter(function (co) { return co.proveedorId === prov.id; });
    var ultima = compras.filter(function (co) { return co.recibida; }).sort(function (a, b) { return a.recibida < b.recibida ? 1 : -1; })[0];
    var abiertas = e.cuentas.filter(function (cu) { return cu.proveedorId === prov.id && !cu.pagada; });
    var deuda = { eur: c.suma(abiertas, function (x) { return x.dinero.eur; }), bs: c.suma(abiertas, function (x) { return x.dinero.bs; }) };
    var vencida = abiertas.some(function (cu) { return c.estadoCuenta(cu, hoy).clave === 'vencida'; });
    var est = vencida ? { nivel: 'peligro', texto: 'Cuenta vencida' } : abiertas.length ? { clave: 'pendiente', nivel: 'info', texto: 'Por pagar' } : { nivel: 'ok', texto: 'Al día' };
    return { compras: compras, ultima: ultima, abiertas: abiertas, deuda: deuda, estado: est };
  }
  function condicion(prov) { return (prov.moneda === 'EUR' ? 'Euros' : 'Bolívares') + ' · ' + (prov.credito ? 'crédito ' + prov.credito + ' días' : 'contado'); }

  function proveedoresFiltrados(ctx) {
    var q = f.normalizar(ctx.params.q || '');
    return ctx.e.proveedores.filter(function (p) { return !q || f.normalizar(p.nombre + ' ' + p.vende).indexOf(q) > -1; })
      .sort(function (a, b) { return a.nombre.localeCompare(b.nombre, 'es'); });
  }

  function listaProveedores(ctx) {
    var e = ctx.e;
    var filas = proveedoresFiltrados(ctx);
    var ver = ctx.puede('verCostos');
    if (!filas.length) {
      return '<div class="tarjeta">' + ui.vacio('ave', ctx.params.q ? 'Ningún proveedor coincide con la búsqueda.' : 'Todavía no hay proveedores.',
        ctx.puede('gestionarProveedores') ? '<button type="button" class="btn btn--principal" data-accion="nuevo-proveedor">' + ui.icono('plus') + 'Nuevo proveedor</button>' : '') + '</div>';
    }
    var tabla = '<div class="tabla-caja solo-tabla"><table class="tabla tabla--filas"><caption class="sr">Proveedores</caption><thead><tr>' +
      '<th scope="col">Proveedor</th><th scope="col" class="solo-ancho">Moneda y pago</th><th scope="col">Última compra</th>' +
      (ver ? '<th scope="col" class="num">Por pagar</th><th scope="col">Estado</th>' : '') + '</tr></thead><tbody>' +
      filas.map(function (p) {
        var inf = infoProveedor(e, p, ctx.hoy);
        return '<tr data-fila><td><button type="button" class="tabla__nombre" data-accion="proveedor" data-id="' + esc(p.id) + '">' + esc(p.nombre) + '</button>' +
          '<span class="tabla__sub">' + esc(p.vende) + '</span></td><td class="solo-ancho">' + esc(condicion(p)) + '</td>' +
          '<td>' + (inf.ultima ? f.fecha(inf.ultima.recibida) : 'Sin compras') + '<span class="tabla__sub">' + inf.compras.length + (inf.compras.length === 1 ? ' compra' : ' compras') + '</span></td>' +
          (ver ? '<td class="num">' + ui.dinero(inf.deuda.eur, inf.deuda.bs) + '</td><td>' + ui.estado(inf.estado) + '</td>' : '') + '</tr>';
      }).join('') + '</tbody></table></div>';
    var fichas = '<ul class="fichas solo-movil" role="list">' + filas.map(function (p) {
      var inf = infoProveedor(e, p, ctx.hoy);
      return '<li><button type="button" class="ficha" data-accion="proveedor" data-id="' + esc(p.id) + '">' +
        '<span class="ficha__arriba"><span class="ficha__nombre">' + esc(p.nombre) + '</span>' + (ver ? ui.estado(inf.estado) : '') + '</span>' +
        '<span class="suave">' + esc(p.vende) + ' · ' + esc(condicion(p)) + '</span>' +
        '<span class="ficha__abajo"><span class="ficha__dato"><span>Última compra</span><span>' + (inf.ultima ? f.fecha(inf.ultima.recibida) : 'Sin compras') + '</span></span>' +
        (ver ? '<span class="ficha__dato ficha__dato--cifra"><span>Por pagar</span>' + ui.dinero(inf.deuda.eur, inf.deuda.bs) + '</span>' : '') + '</span></button></li>';
    }).join('') + '</ul>';
    return tabla + fichas;
  }

  function abrirProveedor(ctx, id) {
    var e = SB.almacen.estado;
    var prov = c.porId(e.proveedores, id);
    if (!prov) return;
    var inf = infoProveedor(e, prov, ctx.hoy);
    var ver = ctx.puede('verCostos');
    var productos = e.productos.filter(function (p) { return c.historialPrecios(e, p.id).some(function (h) { return h.proveedorId === id; }) || p.proveedorId === id; });
    var cuerpo = (ver ? ui.estado(inf.estado) : '') +
      '<dl class="datos" style="margin-top:1rem"><div><dt>Vende</dt><dd>' + esc(prov.vende || '—') + '</dd></div>' +
      '<div><dt>Moneda y pago</dt><dd>' + esc(condicion(prov)) + '</dd></div>' +
      '<div><dt>Compras</dt><dd>' + inf.compras.length + '</dd></div>' +
      (ver ? '<div><dt>Por pagar</dt><dd>' + ui.dinero(inf.deuda.eur, inf.deuda.bs) + '</dd></div>' : '') +
      (prov.nota ? '<div><dt>Nota</dt><dd>' + esc(prov.nota) + '</dd></div>' : '') + '</dl>';
    if (productos.length) {
      cuerpo += '<section class="dialogo__seccion" aria-labelledby="t-pp"><h3 class="etiqueta suave" id="t-pp">Productos' + (ver ? ' y último precio' : '') + '</h3><ul class="lista-simple" role="list">' +
        productos.map(function (p) {
          var h = c.historialPrecios(e, p.id).filter(function (x) { return x.proveedorId === id; });
          var u = h[h.length - 1];
          return '<li><span class="lista-simple__principal"><strong>' + esc(p.nombre) + '</strong>' + (u ? '<span class="lista-simple__sub">' + f.fecha(u.fecha) + '</span>' : '') + '</span>' +
            (ver && u ? '<span class="lista-simple__lado"><span class="dinero"><span>' + f.importe(u.moneda, u.precio) + ' / ' + esc(f.nombreUnidad(p.unidad)) + '</span>' +
              '<span class="dinero__bs">' + (u.moneda === 'VES' ? f.eur(u.eur) : f.bs(u.eur * u.tasa)) + '</span></span></span>' : '') + '</li>';
        }).join('') + '</ul></section>';
    }
    if (ver && inf.abiertas.length) {
      cuerpo += '<section class="dialogo__seccion" aria-labelledby="t-pc"><h3 class="etiqueta suave" id="t-pc">Cuentas abiertas</h3><ul class="lista-simple" role="list">' +
        inf.abiertas.map(function (cu) {
          return '<li><span class="lista-simple__principal"><strong>' + esc(cu.concepto) + '</strong><span class="lista-simple__sub">' + esc(f.vence(cu.vence, ctx.hoy)) + '</span></span>' +
            '<span class="lista-simple__lado">' + ui.estado(c.estadoCuenta(cu, ctx.hoy)) + ui.dineroDe(cu.dinero) + '</span></li>';
        }).join('') + '</ul></section>';
    }
    var pie = '';
    var puedeBorrar = !inf.compras.length && !e.cuentas.some(function (cu) { return cu.proveedorId === id; });
    if (ctx.puede('gestionarProveedores') && puedeBorrar) pie += '<button type="button" class="btn btn--secundario" data-eliminar>' + ui.icono('trash-2') + 'Eliminar</button>';
    if (ctx.puede('gestionarProveedores')) pie += '<button type="button" class="btn btn--secundario" data-editar>' + ui.icono('pencil') + 'Editar</button>';
    if (ctx.puede('gestionarCompras')) pie += '<button type="button" class="btn btn--principal" data-comprar>' + ui.icono('shopping-cart') + 'Registrar compra</button>';
    var d = ui.dialogo({ titulo: prov.nombre, cuerpo: cuerpo, pie: pie || '<button type="button" class="btn btn--principal" data-cerrar>Cerrar</button>' });
    var b;
    if ((b = d.querySelector('[data-editar]'))) b.addEventListener('click', function () { ui.cerrarYAbrir(d, function () { abrirFormProveedor(ctx, id); }); });
    if ((b = d.querySelector('[data-comprar]'))) b.addEventListener('click', function () { ui.cerrarYAbrir(d, function () { abrirNuevaCompra(ctx, id); }); });
    if ((b = d.querySelector('[data-eliminar]'))) b.addEventListener('click', function () {
      d.close();
      var deshacer = SB.almacen.eliminar('proveedores', id);
      ui.avisar('Eliminado: ' + prov.nombre + '.', deshacer);
    });
  }

  function abrirFormProveedor(ctx, id) {
    var e = SB.almacen.estado;
    var prov = id ? c.porId(e.proveedores, id) : null;
    var cuerpo = '<div class="formulario">' +
      ui.campo({ id: 'pv-nombre', nombre: 'nombre', etiqueta: 'Nombre', requerido: true, valor: prov ? prov.nombre : '' }) +
      ui.campo({ id: 'pv-vende', nombre: 'vende', etiqueta: 'Qué vende', opcional: true, valor: prov ? prov.vende : '', ayuda: 'Por ejemplo: frutas y verduras.' }) +
      '<fieldset class="grupo-opciones"><legend>Moneda habitual</legend><div class="grupo-opciones__lista">' +
        '<label class="opcion"><input type="radio" name="moneda" value="EUR"' + (!prov || prov.moneda === 'EUR' ? ' checked' : '') + '> Euros (€)</label>' +
        '<label class="opcion"><input type="radio" name="moneda" value="VES"' + (prov && prov.moneda === 'VES' ? ' checked' : '') + '> Bolívares (Bs.)</label></div></fieldset>' +
      ui.campo({ id: 'pv-credito', nombre: 'credito', etiqueta: 'Días de crédito', tipo: 'number', requerido: true, valor: prov ? prov.credito : 0,
        attrs: ' min="0" max="90" step="1" inputmode="numeric"', ayuda: '0 si se paga de contado.' }) +
      ui.campo({ id: 'pv-nota', nombre: 'nota', etiqueta: 'Nota', tipo: 'textarea', opcional: true, valor: prov ? prov.nota : '' }) +
      '</div>';
    var d = ui.dialogo({
      titulo: prov ? 'Editar proveedor' : 'Nuevo proveedor', formulario: true, cuerpo: cuerpo,
      pie: '<button type="button" class="btn btn--secundario" data-cerrar>Cancelar</button><button type="submit" class="btn btn--principal">' + ui.icono('check') + 'Guardar proveedor</button>',
      foco: '#pv-nombre'
    });
    d.querySelector('form').addEventListener('submit', function (ev) {
      ev.preventDefault();
      var form = ev.target;
      if (ui.validar(form, [
        { nombre: 'nombre', requerido: true, texto: 'el nombre', extra: function (v) {
          return e.proveedores.some(function (x) { return x.id !== id && f.normalizar(x.nombre) === f.normalizar(v); }) ? 'Ya hay un proveedor con ese nombre.' : null;
        } },
        { nombre: 'credito', requerido: true, numero: true, noNegativo: true, texto: 'los días de crédito' }
      ])) return;
      var datos = { nombre: ui.valor(form, 'nombre'), vende: ui.valor(form, 'vende'), moneda: form.querySelector('[name="moneda"]:checked').value,
        credito: Math.round(ui.numero(form, 'credito')), nota: ui.valor(form, 'nota') };
      SB.almacen.cambiar(function (est) {
        if (prov) Object.assign(c.porId(est.proveedores, id), datos);
        else est.proveedores.push(Object.assign({ id: SB.almacen.nuevoId('prov') }, datos));
      });
      d.close();
      ui.avisar(prov ? 'Proveedor actualizado.' : 'Proveedor agregado: ' + datos.nombre + '.');
    });
  }

  /* ======================= Precios ======================= */
  function preciosFiltrados(ctx) {
    var e = ctx.e;
    var p = ctx.params;
    var q = f.normalizar(p.q || '');
    return e.productos.filter(function (x) {
      if (q && f.normalizar(x.nombre).indexOf(q) < 0) return false;
      if (p.categoria && x.categoria !== p.categoria) return false;
      return true;
    }).map(function (x) {
      var h = c.historialPrecios(e, x.id);
      return { p: x, h: h, por: c.preciosPorProveedor(e, x.id) };
    }).filter(function (x) { return x.h.length; })
      .sort(function (a, b) { return a.p.nombre.localeCompare(b.p.nombre, 'es'); });
  }

  function variacionHTML(v) {
    if (v === null || v === undefined) return '<span class="suave">Sin datos</span>';
    if (Math.abs(v) < 0.005) return '<span class="variacion">' + ui.icono('minus') + 'Igual</span>';
    return '<span class="variacion variacion--' + (v > 0 ? 'sube' : 'baja') + '">' + ui.icono(v > 0 ? 'trending-up' : 'trending-down') +
      (v > 0 ? 'Sube ' : 'Baja ') + f.pct(Math.abs(v)) + '</span>';
  }

  function listaPrecios(ctx) {
    var e = ctx.e;
    var filas = preciosFiltrados(ctx);
    if (!filas.length) return '<div class="tarjeta">' + ui.vacio('ave', 'Ningún producto coincide con estos filtros.', '<button type="button" class="btn btn--secundario" data-accion="limpiar">' + ui.icono('filter-x') + 'Limpiar filtros</button>') + '</div>';
    var filaDatos = function (x) {
      var u = x.h[x.h.length - 1];
      var v = (u.eur - x.h[0].eur) / x.h[0].eur;
      var prov = provDe(e, u.proveedorId);
      var mejor = x.por.find(function (y) { return y.mejor; });
      return { u: u, v: v, prov: prov, mejor: mejor };
    };
    var tabla = '<div class="tabla-caja solo-tabla"><table class="tabla tabla--filas"><caption class="sr">Último precio de cada producto y su variación en 8 semanas</caption><thead><tr>' +
      '<th scope="col">Producto</th><th scope="col" class="num">Último precio</th><th scope="col" class="solo-ancho">Proveedor</th><th scope="col">8 semanas</th></tr></thead><tbody>' +
      filas.map(function (x) {
        var d = filaDatos(x);
        return '<tr data-fila><td><button type="button" class="tabla__nombre" data-accion="precio" data-id="' + esc(x.p.id) + '">' + esc(x.p.nombre) + '</button>' +
          '<span class="tabla__sub">' + esc(x.p.categoria) + '</span></td>' +
          '<td class="num">' + ui.dinero(d.u.eur, d.u.eur * d.u.tasa) + '<span class="tabla__sub">por ' + esc(f.nombreUnidad(x.p.unidad)) + '</span></td>' +
          '<td class="solo-ancho">' + esc(d.prov.nombre) + (d.mejor ? '<span class="tabla__sub">Mejor precio: ' + esc(provDe(e, d.mejor.proveedorId).nombre) + '</span>' : '') + '</td>' +
          '<td>' + variacionHTML(d.v) + '</td></tr>';
      }).join('') + '</tbody></table></div>';
    var fichas = '<ul class="fichas solo-movil" role="list">' + filas.map(function (x) {
      var d = filaDatos(x);
      return '<li><button type="button" class="ficha" data-accion="precio" data-id="' + esc(x.p.id) + '">' +
        '<span class="ficha__arriba"><span class="ficha__nombre">' + esc(x.p.nombre) + '</span>' + variacionHTML(d.v) + '</span>' +
        '<span class="ficha__abajo"><span class="ficha__dato ficha__dato--cifra"><span>Último precio por ' + esc(f.nombreUnidad(x.p.unidad)) + '</span>' + ui.dinero(d.u.eur, d.u.eur * d.u.tasa) + '</span>' +
        '<span class="ficha__dato"><span>Proveedor</span><span>' + esc(d.prov.nombre) + '</span></span></span></button></li>';
    }).join('') + '</ul>';
    return tabla + fichas;
  }

  function abrirPrecio(ctx, pid) {
    var e = SB.almacen.estado;
    var p = c.porId(e.productos, pid);
    var h = c.historialPrecios(e, pid);
    var por = c.preciosPorProveedor(e, pid);
    var clases = ['ingresos', 'gastos', 'tercera'];
    var fechas = h.map(function (x) { return x.fecha; }).filter(function (x, i, a) { return a.indexOf(x) === i; });
    var series = por.slice(0, 3).map(function (pp, k) {
      var mapa = {};
      h.forEach(function (x) { if (x.proveedorId === pp.proveedorId) mapa[x.fecha] = x.eur; });
      var ultimo = null;
      return { nombre: provDe(e, pp.proveedorId).nombre.split(' ')[0], completo: provDe(e, pp.proveedorId).nombre, clase: clases[k],
        valores: fechas.map(function (fe) { if (mapa[fe] !== undefined) ultimo = mapa[fe]; return mapa[fe] !== undefined ? mapa[fe] : null; }) };
    });
    var cuerpo = '<p>Precio en € por ' + esc(f.nombreUnidad(p.unidad)) + ' en cada compra recibida. Las compras en Bs. se pasan a € con la tasa de ese día.</p>' +
      ui.grafico({ descripcion: 'Evolución del precio de ' + p.nombre + ': de ' + f.eur(h[0].eur) + ' el ' + f.fecha(h[0].fecha) + ' a ' + f.eur(h[h.length - 1].eur) + ' el ' + f.fecha(h[h.length - 1].fecha) + '.',
        etiquetas: fechas.map(f.fechaCorta), series: series, desdeCero: false, formatoEje: function (v) { return f.num(v); } }) +
      ui.leyenda(series.map(function (s) { return { nombre: s.completo, clase: s.clase }; })) +
      '<section class="dialogo__seccion" aria-labelledby="t-hp"><h3 class="etiqueta suave" id="t-hp">Datos del gráfico</h3>' +
      '<table class="tabla tabla--compacta tabla--interior"><thead><tr><th scope="col">Fecha y proveedor</th><th scope="col" class="num">Precio</th><th scope="col" class="num">En €</th></tr></thead><tbody>' +
      h.slice().reverse().map(function (x) {
        return '<tr><td>' + f.fecha(x.fecha) + '<span class="tabla__sub">' + esc(provDe(e, x.proveedorId).nombre) + '</span></td><td class="num">' + f.importe(x.moneda, x.precio) +
          (x.moneda === 'VES' ? '<span class="tabla__sub">Tasa ' + f.tasa(x.tasa) + '</span>' : '') + '</td><td class="num">' + f.eur(x.eur) + '</td></tr>';
      }).join('') + '</tbody></table></section>';
    var d = ui.dialogo({ titulo: 'Precio de ' + p.nombre, cuerpo: cuerpo, pie: '<button type="button" class="btn btn--principal" data-cerrar>Cerrar</button>' });
    ui.pintarGraficos(d);
  }

  /* ======================= Vista ======================= */
  function filtrosCompras(ctx) {
    var p = ctx.params;
    return '<form class="filtros" role="search" aria-label="Filtrar compras">' +
      ui.campo({ id: 'f-q', nombre: 'q', etiqueta: 'Buscar', tipo: 'search', valor: p.q || '', icono: 'search', attrs: ' data-filtro autocomplete="off" placeholder="Proveedor o producto"' }) +
      ui.campo({ id: 'f-estado', nombre: 'estado', etiqueta: 'Estado', tipo: 'select', valor: p.estado || '', attrs: ' data-filtro',
        opciones: [{ valor: '', texto: 'Todas' }, { valor: 'pendiente', texto: 'Pendiente de recibir' }, { valor: 'recibida', texto: 'Recibida' }] }) +
      ui.campo({ id: 'f-proveedor', nombre: 'proveedor', etiqueta: 'Proveedor', tipo: 'select', valor: p.proveedor || '', attrs: ' data-filtro',
        opciones: [{ valor: '', texto: 'Todos' }].concat(ctx.e.proveedores.map(function (x) { return { valor: x.id, texto: x.nombre }; })) }) +
      '</form>' + pieFiltros();
  }

  SB.vistas.compras = {
    titulo: function (ctx) { return ctx.sub === 'proveedores' ? 'Proveedores' : ctx.sub === 'precios' ? 'Precios' : 'Compras'; },
    accionesPantalla: function (ctx) {
      if (ctx.sub === 'proveedores') return ctx.puede('gestionarProveedores') ? '<button type="button" class="btn btn--principal" data-accion="nuevo-proveedor">' + ui.icono('plus') + 'Nuevo proveedor</button>' : '';
      if (ctx.sub === 'precios') return '';
      return ctx.puede('gestionarCompras') ? '<button type="button" class="btn btn--principal" data-accion="nueva-compra">' + ui.icono('plus') + 'Registrar compra</button>' : '';
    },
    render: function (ctx) {
      if (ctx.sub === 'precios' && !ctx.puede('verCostos')) { ctx.sub = null; history.replaceState(null, '', '#/compras'); }
      var h = subnav(ctx);
      if (ctx.sub === 'proveedores') {
        h += '<form class="filtros" role="search" aria-label="Buscar proveedores">' +
          ui.campo({ id: 'f-q', nombre: 'q', etiqueta: 'Buscar', tipo: 'search', valor: ctx.params.q || '', icono: 'search', attrs: ' data-filtro autocomplete="off" placeholder="Nombre o qué vende"' }) +
          '</form>' + pieFiltros();
      } else if (ctx.sub === 'precios') {
        h += '<form class="filtros" role="search" aria-label="Filtrar precios">' +
          ui.campo({ id: 'f-q', nombre: 'q', etiqueta: 'Buscar', tipo: 'search', valor: ctx.params.q || '', icono: 'search', attrs: ' data-filtro autocomplete="off" placeholder="Producto"' }) +
          ui.campo({ id: 'f-categoria', nombre: 'categoria', etiqueta: 'Categoría', tipo: 'select', valor: ctx.params.categoria || '', attrs: ' data-filtro',
            opciones: [{ valor: '', texto: 'Todas' }].concat(SB.semilla.CATEGORIAS) }) +
          '</form>' + pieFiltros();
      } else {
        h += filtrosCompras(ctx);
      }
      return h + '<div data-lista></div>';
    },
    despues: function (main, ctx) { this.pintarLista(main, ctx); },
    pintarLista: function (main, ctx) {
      var n;
      var lista = main.querySelector('[data-lista]');
      if (ctx.sub === 'proveedores') { lista.innerHTML = listaProveedores(ctx); n = proveedoresFiltrados(ctx).length; n = n + (n === 1 ? ' proveedor' : ' proveedores'); }
      else if (ctx.sub === 'precios') { lista.innerHTML = listaPrecios(ctx); n = preciosFiltrados(ctx).length; n = n + (n === 1 ? ' producto' : ' productos'); }
      else { lista.innerHTML = listaCompras(ctx); n = comprasFiltradas(ctx).length; n = n + (n === 1 ? ' compra' : ' compras'); }
      main.querySelector('[data-cuenta]').textContent = n + (hayFiltros(ctx.params) ? ' con estos filtros' : '');
      main.querySelector('[data-limpiar]').hidden = !hayFiltros(ctx.params);
    },
    filtrar: function (main) {
      var form = main.querySelector('.filtros');
      var r = {};
      ['q', 'estado', 'proveedor', 'categoria'].forEach(function (k) { if (form[k]) r[k] = form[k].value.trim(); });
      return r;
    },
    acciones: {
      compra: function (el, ctx) { abrirCompra(ctx, el.getAttribute('data-id')); },
      proveedor: function (el, ctx) { abrirProveedor(ctx, el.getAttribute('data-id')); },
      precio: function (el, ctx) { abrirPrecio(ctx, el.getAttribute('data-id')); },
      'nueva-compra': function (el, ctx) { abrirNuevaCompra(ctx, null); },
      'nuevo-proveedor': function (el, ctx) { abrirFormProveedor(ctx, null); },
      limpiar: function (el, ctx) {
        ctx.fijarParams({});
        SB.app.render();
        var b = document.getElementById('f-q');
        if (b) b.focus();
      }
    },
    abrirNuevaCompra: abrirNuevaCompra
  };
})(window.SB = window.SB || {});
