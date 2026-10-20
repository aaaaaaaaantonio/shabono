/* Carta y precios: costo de cada plato (ficha técnica × último precio de cada insumo) frente a su precio de venta. */
(function (SB) {
  'use strict';

  var f = SB.f;
  var ui = SB.ui;
  var c = SB.calc;
  var esc = f.esc;
  SB.vistas = SB.vistas || {};

  var CATEGORIAS_CARTA = ['Entradas', 'Carnes', 'Pollo', 'Pescados y mariscos', 'Pastas', 'Cerdo', 'Arepas', 'Sándwiches', 'Desayunos', 'Guarniciones', 'Postres', 'Bebidas', 'Café y té'];
  var ESTADOS = [
    { valor: '', texto: 'Todos' },
    { valor: 'no-disponible', texto: 'No disponible' },
    { valor: 'margen-bajo', texto: 'Margen bajo' },
    { valor: 'sin-ficha', texto: 'Sin ficha' },
    { valor: 'sin-precio', texto: 'Sin precio' },
    { valor: 'correcto', texto: 'Margen correcto' }
  ];

  /* El equipo de cocina ve disponibilidad, no márgenes */
  function estadoVisible(ctx, est) {
    if (ctx.puede('verCostos')) return est;
    if (est.clave === 'no-disponible' || est.clave === 'sin-ficha') return est;
    return { clave: 'disponible', nivel: 'ok', texto: 'Disponible', detalle: 'Hay existencias de todos los ingredientes.' };
  }

  function datos(ctx) {
    var e = ctx.e;
    var p = ctx.params;
    var q = f.normalizar(p.q || '');
    return e.platos.map(function (pl) {
      var costo = c.costoPlato(e, pl);
      return { pl: pl, costo: costo, m: c.margen(costo.total, pl.precio), estado: c.estadoPlato(e, pl, ctx.hoy) };
    }).filter(function (x) {
      if (q && f.normalizar(x.pl.nombre + ' ' + x.pl.categoria).indexOf(q) < 0) return false;
      if (p.categoria && x.pl.categoria !== p.categoria) return false;
      if (p.estado && x.estado.clave !== p.estado) return false;
      return true;
    }).sort(function (a, b) { return c.PESO[b.estado.nivel] - c.PESO[a.estado.nivel] || a.pl.nombre.localeCompare(b.pl.nombre, 'es'); });
  }

  function hayFiltros(p) { return !!(p.q || p.categoria || p.estado); }

  function lista(ctx) {
    var filas = datos(ctx);
    var tasa = c.tasaActual(ctx.e).valor;
    var ver = ctx.puede('verCostos');
    if (!filas.length) {
      return '<div class="tarjeta">' + ui.vacio('serpiente', hayFiltros(ctx.params) ? 'Ningún plato coincide con estos filtros.' : 'Todavía no hay platos en la carta.',
        hayFiltros(ctx.params) ? '<button type="button" class="btn btn--secundario" data-accion="limpiar">' + ui.icono('filter-x') + 'Limpiar filtros</button>' :
          (ctx.puede('editarCarta') ? '<button type="button" class="btn btn--principal" data-accion="nuevo">' + ui.icono('plus') + 'Nuevo plato</button>' : '')) + '</div>';
    }
    var tabla = '<div class="tabla-caja solo-tabla"><table class="tabla tabla--filas"><caption class="sr">Platos de la carta' + (ver ? ' con su costo, precio y margen' : '') + '</caption><thead><tr>' +
      '<th scope="col">Plato</th>' +
      (ver ? '<th scope="col" class="num">Costo</th><th scope="col" class="num">Precio</th><th scope="col" class="num solo-ancho">Margen</th>' : '<th scope="col" class="num">Ingredientes</th>') +
      '<th scope="col">Estado</th></tr></thead><tbody>' +
      filas.map(function (x) {
        return '<tr data-fila><td><button type="button" class="tabla__nombre" data-accion="plato" data-id="' + esc(x.pl.id) + '">' + esc(x.pl.nombre) + '</button>' +
          '<span class="tabla__sub">' + esc(x.pl.categoria) + '</span></td>' +
          (ver ? '<td class="num">' + f.eur(x.costo.total) + '<span class="tabla__sub">' + (x.m.costoPct !== null ? f.pct(x.m.costoPct) + ' del precio' : '—') + '</span></td>' +
            '<td class="num">' + (x.pl.precio ? ui.dinero(x.pl.precio, x.pl.precio * tasa) : '<span class="suave">Sin precio</span>') + '</td>' +
            '<td class="num solo-ancho">' + (x.m.margen !== null ? f.eur(x.m.margen) + '<span class="tabla__sub">' + f.pct(x.m.margenPct) + '</span>' : '—') + '</td>'
            : '<td class="num">' + x.pl.receta.length + '</td>') +
          '<td>' + ui.estado(estadoVisible(ctx, x.estado)) + '</td></tr>';
      }).join('') + '</tbody></table></div>';
    var fichas = '<ul class="fichas solo-movil" role="list">' + filas.map(function (x) {
      return '<li><button type="button" class="ficha" data-accion="plato" data-id="' + esc(x.pl.id) + '">' +
        '<span class="ficha__arriba"><span class="ficha__nombre">' + esc(x.pl.nombre) + '</span>' + ui.estado(estadoVisible(ctx, x.estado)) + '</span>' +
        '<span class="suave">' + esc(x.pl.categoria) + '</span>' +
        (ver ? '<span class="ficha__abajo">' +
          '<span class="ficha__dato"><span>Costo</span><span>' + f.eur(x.costo.total) + (x.m.costoPct !== null ? ' <span class="suave">· ' + f.pct(x.m.costoPct) + '</span>' : '') + '</span></span>' +
          '<span class="ficha__dato"><span>Precio</span>' + (x.pl.precio ? ui.dinero(x.pl.precio, x.pl.precio * tasa) : '<span>Sin precio</span>') + '</span>' +
          '<span class="ficha__dato"><span>Margen</span><span>' + (x.m.margen !== null ? f.eur(x.m.margen) + ' <span class="suave">· ' + f.pct(x.m.margenPct) + '</span>' : '—') + '</span></span>' +
          '</span>' : '') +
        '</button></li>';
    }).join('') + '</ul>';
    return tabla + fichas;
  }

  /* ---------- Detalle del plato ---------- */
  function abrirPlato(ctx, id) {
    var e = SB.almacen.estado;
    var pl = c.porId(e.platos, id);
    if (!pl) return;
    var hoy = ctx.hoy;
    var ver = ctx.puede('verCostos');
    var tasa = c.tasaActual(e).valor;
    var costo = c.costoPlato(e, pl);
    var m = c.margen(costo.total, pl.precio);
    var est = estadoVisible(ctx, c.estadoPlato(e, pl, hoy));
    var objetivo = e.config.objetivoCosto;
    var sugerido = costo.total ? c.precioSugerido(costo.total, objetivo) : null;

    var cuerpo = ui.estado(est) + '<p style="margin-top:.5rem">' + esc(est.detalle) + '</p>';
    if (ver) {
      cuerpo += '<dl class="datos" style="margin-top:1rem">' +
        '<div><dt>Precio de venta</dt><dd>' + (pl.precio ? ui.dinero(pl.precio, pl.precio * tasa) : 'Sin precio') + '</dd></div>' +
        '<div><dt>Costo</dt><dd>' + f.eur(costo.total) + (m.costoPct !== null ? '<span class="tabla__sub">' + f.pct(m.costoPct) + ' del precio</span>' : '') + '</dd></div>' +
        '<div><dt>Margen</dt><dd>' + (m.margen !== null ? f.eur(m.margen) + '<span class="tabla__sub">' + f.pct(m.margenPct) + '</span>' : '—') + '</dd></div>' +
        (sugerido ? '<div><dt>Precio para el objetivo</dt><dd>' + f.eur(sugerido) + '<span class="tabla__sub">Costo al ' + f.pct(objetivo) + ' o menos</span></dd></div>' : '') +
        '</dl>';
    } else {
      cuerpo += '<dl class="datos" style="margin-top:1rem"><div><dt>Categoría</dt><dd>' + esc(pl.categoria) + '</dd></div></dl>';
    }

    cuerpo += '<section class="dialogo__seccion" aria-labelledby="t-ficha"><h3 class="etiqueta suave" id="t-ficha">Ficha técnica · 1 ración</h3>';
    if (!pl.receta.length) cuerpo += '<p class="suave">Sin ingredientes todavía.</p>';
    else {
      cuerpo += '<table class="tabla tabla--compacta tabla--interior"><thead><tr><th scope="col">Ingrediente</th><th scope="col" class="num">Cantidad</th>' +
        (ver ? '<th scope="col" class="num">Costo</th>' : '') + '</tr></thead><tbody>' +
        costo.lineas.map(function (l) {
          var p = l.producto || { nombre: 'Producto eliminado', unidad: '' };
          var agotado = l.producto && c.existencia(e, p.id, hoy).util <= 0;
          return '<tr><td>' + esc(p.nombre) + (agotado ? ' ' + ui.estado({ nivel: 'peligro', texto: 'Agotado' }) : '') +
            (ver && !l.sinPrecio ? '<span class="tabla__sub">' + f.eur(l.costoUnit) + ' / ' + esc(f.nombreUnidad(p.unidad)) + '</span>' : '') + '</td>' +
            '<td class="num">' + f.cantidad(l.cantidad, p.unidad) + '</td>' +
            (ver ? '<td class="num">' + (l.sinPrecio ? '<span class="suave">Sin precio</span>' : f.eur(l.subtotal)) + '</td>' : '') + '</tr>';
        }).join('') + '</tbody>' +
        (ver ? '<tfoot><tr><td colspan="2">Costo total</td><td class="num">' + f.eur(costo.total) + '</td></tr></tfoot>' : '') + '</table>';
      if (ver) cuerpo += '<p class="nota-pie">Cada ingrediente usa el precio de su última compra, pasado a € con la tasa de ese día.</p>';
    }
    cuerpo += '</section>';

    if (ver && pl.receta.length) {
      var ev = c.evolucionCosto(e, pl, hoy, 6);
      var series = [{ nombre: 'Costo', clase: 'ingresos', valores: ev.map(function (x) { return f.redondear(x.costo, 2); }) }];
      cuerpo += '<section class="dialogo__seccion" aria-labelledby="t-evol"><h3 class="etiqueta suave" id="t-evol">Costo en las últimas 6 semanas</h3>' +
        ui.grafico({
          descripcion: 'El costo de ' + pl.nombre + ' pasó de ' + f.eur(ev[0].costo) + ' a ' + f.eur(ev[ev.length - 1].costo) + ' en 6 semanas. El costo objetivo es ' + f.eur(pl.precio * objetivo) + '.',
          etiquetas: ev.map(function (x) { return f.fechaCorta(x.fecha); }), series: series, desdeCero: false,
          referencia: pl.precio ? f.redondear(pl.precio * objetivo, 2) : undefined, referenciaNombre: 'Objetivo',
          formatoEje: function (v) { return f.num(v); }, alto: 200
        }) +
        '<table class="tabla tabla--compacta tabla--interior" style="margin-top:.75rem"><caption class="sr">Datos del gráfico</caption><thead><tr><th scope="col">Semana del</th><th scope="col" class="num">Costo</th><th scope="col" class="num">Del precio</th></tr></thead><tbody>' +
        ev.map(function (x) { return '<tr><td>' + f.fecha(x.fecha) + '</td><td class="num">' + f.eur(x.costo) + '</td><td class="num">' + (pl.precio ? f.pct(x.costo / pl.precio) : '—') + '</td></tr>'; }).join('') +
        '</tbody></table></section>';
    }

    if (ctx.puede('editarCarta')) {
      cuerpo += '<section class="dialogo__seccion" aria-labelledby="t-sim"><h3 class="etiqueta suave" id="t-sim">Cambiar precio</h3><form class="simulador" novalidate data-simulador>' +
        ui.campo({ id: 'sim-precio', nombre: 'precio', etiqueta: 'Nuevo precio de venta', importe: true, requerido: true, sufijo: '€',
          valor: pl.precio ? f.num(pl.precio) : '', ayuda: 'Mira el margen antes de guardar.' }) +
        '<p class="resumen-form" aria-live="polite" data-sim-resultado></p>' +
        '<div class="acciones">' + (sugerido ? '<button type="button" class="btn btn--sutil" data-sugerido>Usar ' + f.eur(sugerido) + '</button>' : '') +
        '<button type="submit" class="btn btn--principal">' + ui.icono('check') + 'Guardar precio</button></div></form></section>';
    }

    var pie = '';
    if (ctx.puede('editarCarta')) {
      pie += '<button type="button" class="btn btn--secundario" data-eliminar>' + ui.icono('trash-2') + 'Eliminar plato</button>';
      pie += '<button type="button" class="btn btn--secundario" data-editar>' + ui.icono('clipboard-list') + 'Editar ficha</button>';
    }
    if (!pie) pie = '<button type="button" class="btn btn--principal" data-cerrar>Cerrar</button>';

    var d = ui.dialogo({ titulo: pl.nombre, cuerpo: cuerpo, pie: pie });
    ui.pintarGraficos(d);
    var b;
    if ((b = d.querySelector('[data-editar]'))) b.addEventListener('click', function () { ui.cerrarYAbrir(d, function () { abrirFicha(ctx, id); }); });
    if ((b = d.querySelector('[data-eliminar]'))) b.addEventListener('click', function () {
      d.close();
      var deshacer = SB.almacen.eliminar('platos', id);
      ui.avisar('Eliminado: ' + pl.nombre + '.', deshacer);
    });
    var sim = d.querySelector('[data-simulador]');
    if (sim) {
      var res = sim.querySelector('[data-sim-resultado]');
      var pintar = function () {
        var precio = ui.numero(sim, 'precio');
        if (isNaN(precio) || precio <= 0) { res.textContent = 'Escribe un precio para ver el margen.'; return; }
        var mm = c.margen(costo.total, precio);
        var bajo = mm.costoPct > objetivo;
        res.innerHTML = 'Con ' + f.eur(precio) + ' (' + f.bs(precio * tasa) + ') el costo sería el <strong>' + f.pct(mm.costoPct) + '</strong> del precio y el margen ' +
          f.eur(mm.margen) + '. ' + (bajo ? ui.estado({ nivel: 'aviso', texto: 'Margen bajo' }) : ui.estado({ nivel: 'ok', texto: 'Margen correcto' }));
      };
      sim.addEventListener('input', pintar);
      pintar();
      var bs = sim.querySelector('[data-sugerido]');
      if (bs) bs.addEventListener('click', function () { sim.querySelector('[name="precio"]').value = f.num(sugerido); pintar(); sim.querySelector('[name="precio"]').focus(); });
      sim.addEventListener('submit', function (ev2) {
        ev2.preventDefault();
        if (ui.validar(sim, [{ nombre: 'precio', requerido: true, numero: true, positivo: true, texto: 'el precio' }])) return;
        var nuevo = f.redondear(ui.numero(sim, 'precio'), 2);
        var anterior = pl.precio;
        SB.almacen.cambiar(function (est) { c.porId(est.platos, id).precio = nuevo; });
        d.close();
        ui.avisar('Precio guardado: ' + pl.nombre + ', ' + f.eur(nuevo) + '.', function () {
          SB.almacen.cambiar(function (est) { var x = c.porId(est.platos, id); if (x) x.precio = anterior; });
        });
      });
    }
  }

  /* ---------- Nuevo plato o editar ficha ---------- */
  function abrirFicha(ctx, id) {
    var e = SB.almacen.estado;
    var pl = id ? c.porId(e.platos, id) : null;
    var productos = e.productos.slice().sort(function (a, b) { return a.nombre.localeCompare(b.nombre, 'es'); });
    var opciones = [{ valor: '', texto: 'Elige un ingrediente' }].concat(productos.map(function (p) { return { valor: p.id, texto: p.nombre + ' (' + p.unidad + ')' }; }));
    var n = 0;
    function lineaHTML(i, r) {
      var p = r ? c.porId(e.productos, r.productoId) : null;
      return '<fieldset class="linea-form" data-linea="' + i + '"><legend class="sr">Ingrediente</legend>' +
        '<div class="linea-form__cabeza"><strong data-num></strong><button type="button" class="btn btn--sutil" data-quitar>' + ui.icono('minus') + 'Quitar</button></div>' +
        '<div class="linea-form__campos">' +
        ui.campo({ id: 'fi-prod-' + i, nombre: 'prod-' + i, etiqueta: 'Ingrediente', tipo: 'select', opciones: opciones, requerido: true, valor: r ? r.productoId : '' }) +
        ui.campo({ id: 'fi-cant-' + i, nombre: 'cant-' + i, etiqueta: 'Cantidad por ración', importe: true, decimales: 3, requerido: true,
          valor: r ? f.numCantidad(r.cantidad) : '', ayuda: p ? 'En ' + ({ kg: 'kilos', L: 'litros', und: 'unidades', manojo: 'manojos' }[p.unidad]) + '. Por ejemplo: 0,25.' : 'Elige primero el ingrediente.' }) +
        '</div></fieldset>';
    }
    var cuerpo = '<div class="formulario">' +
      ui.campo({ id: 'fi-nombre', nombre: 'nombre', etiqueta: 'Nombre del plato', requerido: true, valor: pl ? pl.nombre : '' }) +
      '<div class="formulario__fila formulario__fila--2">' +
      ui.campo({ id: 'fi-categoria', nombre: 'categoria', etiqueta: 'Categoría', tipo: 'select', valor: pl ? pl.categoria : 'Entradas', opciones: CATEGORIAS_CARTA }) +
      (pl ? '' : ui.campo({ id: 'fi-precio', nombre: 'precio', etiqueta: 'Precio de venta', importe: true, opcional: true, sufijo: '€' })) +
      '</div><div class="lineas" data-lineas></div>' +
      '<div><button type="button" class="btn btn--secundario" data-agregar>' + ui.icono('list-plus') + 'Agregar ingrediente</button></div>' +
      '<p class="resumen-form" aria-live="polite" data-costo></p></div>';
    var d = ui.dialogo({
      titulo: pl ? 'Editar ficha de ' + pl.nombre : 'Nuevo plato', formulario: true, cuerpo: cuerpo,
      pie: '<button type="button" class="btn btn--secundario" data-cerrar>Cancelar</button><button type="submit" class="btn btn--principal">' + ui.icono('check') + 'Guardar ficha</button>',
      foco: '#fi-nombre'
    });
    var form = d.querySelector('form');
    var cont = form.querySelector('[data-lineas]');
    function lineas() { return Array.prototype.slice.call(cont.querySelectorAll('[data-linea]')); }
    function renumerar() {
      var ls = lineas();
      ls.forEach(function (l, k) { l.querySelector('[data-num]').textContent = 'Ingrediente ' + (k + 1); l.querySelector('legend').textContent = 'Ingrediente ' + (k + 1); });
    }
    function agregar(r) {
      cont.insertAdjacentHTML('beforeend', lineaHTML(n, r));
      n += 1;
      ui.enlazarImportes(cont.lastElementChild);
      renumerar();
      return cont.lastElementChild;
    }
    function receta() {
      return lineas().map(function (l) {
        var i = l.getAttribute('data-linea');
        return { productoId: ui.valor(form, 'prod-' + i), cantidad: ui.numero(form, 'cant-' + i) };
      });
    }
    function costoVivo() {
      if (!ctx.puede('verCostos')) return;
      var r = receta().filter(function (x) { return x.productoId && !isNaN(x.cantidad); });
      var ct = c.costoPlato(e, { receta: r }).total;
      form.querySelector('[data-costo]').textContent = 'Costo de la ficha: ' + f.eur(ct) + ' por ración.';
    }
    (pl ? pl.receta : [null]).forEach(function (r) { agregar(r); });
    form.querySelector('[data-agregar]').addEventListener('click', function () { agregar(null).querySelector('select').focus(); });
    cont.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-quitar]');
      if (!b) return;
      var l = b.closest('[data-linea]');
      var otro = l.previousElementSibling || l.nextElementSibling;
      l.remove();
      renumerar();
      costoVivo();
      (otro ? otro.querySelector('select') : form.querySelector('[data-agregar]')).focus();
    });
    form.addEventListener('change', function (ev) {
      if (/^prod-/.test(ev.target.name)) {
        var p = c.porId(e.productos, ev.target.value);
        var i = ev.target.name.slice(5);
        var a = form.querySelector('#fi-cant-' + i + '-ayuda');
        if (a) a.textContent = p ? 'En ' + ({ kg: 'kilos', L: 'litros', und: 'unidades', manojo: 'manojos' }[p.unidad]) + '. Por ejemplo: 0,25.' : 'Elige primero el ingrediente.';
      }
      costoVivo();
    });
    form.addEventListener('input', costoVivo);
    costoVivo();
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var reglas = [{ nombre: 'nombre', requerido: true, texto: 'el nombre', extra: function (v) {
        return e.platos.some(function (x) { return x.id !== id && f.normalizar(x.nombre) === f.normalizar(v); }) ? 'Ya hay un plato con ese nombre.' : null;
      } }];
      if (!pl) reglas.push({ nombre: 'precio', requerido: false, numero: true, positivo: true, texto: 'el precio' });
      lineas().forEach(function (l) {
        var i = l.getAttribute('data-linea');
        reglas.push({ nombre: 'prod-' + i, requerido: true, mensaje: 'Elige el ingrediente.' });
        reglas.push({ nombre: 'cant-' + i, requerido: true, numero: true, positivo: true, texto: 'la cantidad' });
      });
      if (ui.validar(form, reglas)) return;
      var r = receta().map(function (x) { return { productoId: x.productoId, cantidad: f.redondear(x.cantidad, 3) }; });
      var nombre = ui.valor(form, 'nombre');
      var categoria = ui.valor(form, 'categoria');
      SB.almacen.cambiar(function (est) {
        if (pl) Object.assign(c.porId(est.platos, id), { nombre: nombre, categoria: categoria, receta: r });
        else {
          var precio = ui.valor(form, 'precio') ? f.redondear(ui.numero(form, 'precio'), 2) : 0;
          est.platos.push({ id: SB.almacen.nuevoId('plato'), nombre: nombre, categoria: categoria, precio: precio, receta: r });
        }
      });
      d.close();
      ui.avisar(pl ? 'Ficha guardada: ' + nombre + '.' : 'Plato creado: ' + nombre + '.');
    });
  }

  function abrirObjetivo(ctx) {
    var e = SB.almacen.estado;
    var d = ui.dialogo({
      titulo: 'Objetivo de costo', formulario: true,
      cuerpo: '<div class="formulario"><p>Porcentaje máximo del precio de venta que puede costar un plato. Si lo supera, sale «Margen bajo».</p>' +
        ui.campo({ id: 'ob-valor', nombre: 'valor', etiqueta: 'Objetivo de costo', importe: true, decimales: 1, requerido: true, sufijo: '%',
          valor: f.num(e.config.objetivoCosto * 100).replace(/,0+$/, ''), ayuda: 'Entre 10 y 80. Habitual: de 28 a 35.' }) + '</div>',
      pie: '<button type="button" class="btn btn--secundario" data-cerrar>Cancelar</button><button type="submit" class="btn btn--principal">' + ui.icono('check') + 'Guardar objetivo</button>',
      foco: '#ob-valor'
    });
    d.querySelector('form').addEventListener('submit', function (ev) {
      ev.preventDefault();
      var form = ev.target;
      if (ui.validar(form, [{ nombre: 'valor', requerido: true, numero: true, texto: 'el objetivo', extra: function (v) {
        var n = f.leerDecimal(v, 1); return n < 10 || n > 80 ? 'Escribe un número entre 10 y 80.' : null;
      } }])) return;
      var v = ui.numero(form, 'valor') / 100;
      SB.almacen.cambiar(function (est) { est.config.objetivoCosto = f.redondear(v, 4); });
      d.close();
      ui.avisar('Objetivo de costo: ' + f.pct(v) + '.');
    });
  }

  SB.vistas.carta = {
    accionesPantalla: function (ctx) {
      return ctx.puede('editarCarta') ? '<button type="button" class="btn btn--principal" data-accion="nuevo">' + ui.icono('plus') + 'Nuevo plato</button>' : '';
    },
    render: function (ctx) {
      var p = ctx.params;
      var cats = ctx.e.platos.map(function (x) { return x.categoria; }).filter(function (x, i, a) { return a.indexOf(x) === i; });
      var h = '';
      if (ctx.puede('verCostos')) {
        h += '<div class="tarjeta" style="margin-bottom:var(--espacio-m)"><div class="bloque__cabeza" style="margin:0;align-items:center">' +
          '<p style="margin:0"><strong>Objetivo de costo: ' + f.pct(ctx.e.config.objetivoCosto) + ' del precio.</strong> <span class="suave">Por encima sale «Margen bajo». El costo usa el último precio de cada insumo.</span></p>' +
          (ctx.puede('editarObjetivo') ? '<button type="button" class="btn btn--secundario" data-accion="objetivo">' + ui.icono('pencil') + 'Cambiar objetivo</button>' : '') +
          '</div></div>';
      }
      h += '<form class="filtros" role="search" aria-label="Filtrar la carta">' +
        ui.campo({ id: 'f-q', nombre: 'q', etiqueta: 'Buscar', tipo: 'search', valor: p.q || '', icono: 'search', attrs: ' data-filtro autocomplete="off" placeholder="Nombre del plato"' }) +
        ui.campo({ id: 'f-categoria', nombre: 'categoria', etiqueta: 'Categoría', tipo: 'select', valor: p.categoria || '', attrs: ' data-filtro',
          opciones: [{ valor: '', texto: 'Todas' }].concat(cats) }) +
        (ctx.puede('verCostos') ? ui.campo({ id: 'f-estado', nombre: 'estado', etiqueta: 'Estado', tipo: 'select', valor: p.estado || '', attrs: ' data-filtro', opciones: ESTADOS }) :
          ui.campo({ id: 'f-estado', nombre: 'estado', etiqueta: 'Estado', tipo: 'select', valor: p.estado || '', attrs: ' data-filtro',
            opciones: [{ valor: '', texto: 'Todos' }, { valor: 'no-disponible', texto: 'No disponible' }, { valor: 'sin-ficha', texto: 'Sin ficha' }] })) +
        '</form>' +
        '<div class="filtros__pie"><p class="filtros__cuenta" role="status" data-cuenta></p>' +
        '<button type="button" class="btn btn--sutil" data-accion="limpiar" data-limpiar>' + ui.icono('filter-x') + 'Limpiar filtros</button></div>' +
        '<div data-lista></div>';
      return h;
    },
    despues: function (main, ctx) { this.pintarLista(main, ctx); },
    pintarLista: function (main, ctx) {
      main.querySelector('[data-lista]').innerHTML = lista(ctx);
      var n = datos(ctx).length;
      main.querySelector('[data-cuenta]').textContent = n + (n === 1 ? ' plato' : ' platos') + (hayFiltros(ctx.params) ? ' con estos filtros' : '');
      main.querySelector('[data-limpiar]').hidden = !hayFiltros(ctx.params);
    },
    filtrar: function (main) {
      var form = main.querySelector('.filtros');
      return { q: form.q.value.trim(), categoria: form.categoria.value, estado: form.estado.value };
    },
    acciones: {
      plato: function (el, ctx) { abrirPlato(ctx, el.getAttribute('data-id')); },
      nuevo: function (el, ctx) { abrirFicha(ctx, null); },
      objetivo: function (el, ctx) { abrirObjetivo(ctx); },
      limpiar: function (el, ctx) {
        ctx.fijarParams({});
        SB.app.render();
        var b = document.getElementById('f-q');
        if (b) b.focus();
      }
    }
  };
})(window.SB = window.SB || {});
