/* Piezas de interfaz compartidas: iconos, estados, dinero, diálogos, avisos, campos y gráficos. */
(function (SB) {
  'use strict';

  var f = SB.f;
  var esc = f.esc;

  function icono(nombre, clase) {
    return '<svg class="icono' + (clase ? ' ' + clase : '') + '" aria-hidden="true" focusable="false"><use href="#i-' + nombre + '"/></svg>';
  }

  var ICONO_NIVEL = { ok: 'circle-check', aviso: 'triangle-alert', peligro: 'octagon-alert', info: 'info' };
  function estado(est) {
    var ic = est.clave === 'pendiente' ? 'clock' : ICONO_NIVEL[est.nivel];
    return '<span class="estado estado--' + est.nivel + '">' + icono(ic) + esc(est.texto) + '</span>';
  }

  /* € arriba y Bs. debajo */
  function dinero(eur, bs, clase) {
    return '<span class="dinero' + (clase ? ' ' + clase : '') + '"><span class="dinero__eur">' + f.eur(eur) +
      '</span><span class="dinero__bs">' + f.bs(bs) + '</span></span>';
  }
  function dineroDe(d, clase) { return dinero(d.eur, d.bs, clase); }

  function dibujo(nombre) {
    var t = document.getElementById('dibujo-' + nombre);
    return t ? t.innerHTML : '';
  }

  function vacio(nombreDibujo, frase, accion) {
    return '<div class="vacio">' + dibujo(nombreDibujo) + '<p>' + esc(frase) + '</p>' + (accion || '') + '</div>';
  }

  function esqueleto(n) {
    var s = '<div class="esqueleto" aria-hidden="true">';
    for (var i = 0; i < (n || 5); i += 1) s += '<span></span>';
    return s + '</div><p class="sr" role="status">Cargando…</p>';
  }

  /* ---------- Diálogos (<dialog> nativo; a pantalla completa en el teléfono) ---------- */
  var contadorDialogos = 0;
  var heredada = null;       // al encadenar diálogos, el nuevo vuelve a donde volvía el anterior
  var disparador = null;     // último botón pulsado en la vista
  var ultimaClave = null;    // a dónde volvía el último diálogo cerrado (para diálogos encadenados)
  function fijarDisparador(el) {
    disparador = el;
    setTimeout(function () { disparador = null; }, 0);   // solo vale para el clic en curso
  }

  function claveFoco(el) {
    if (!el || !el.getAttribute) return null;
    var a = el.getAttribute('data-accion');
    var id = el.getAttribute('data-id');
    return a ? { accion: a, id: id, elemento: el } : { elemento: el };
  }

  function devolverFoco(clave) {
    if (!clave || document.querySelector('dialog[open]')) return;
    if (clave.elemento && document.contains(clave.elemento) && clave.elemento.getClientRects().length) { clave.elemento.focus(); return; }
    if (clave.accion) {
      var sel = '[data-accion="' + clave.accion + '"]' + (clave.id ? '[data-id="' + CSS.escape(clave.id) + '"]' : '');
      // la tabla y las tarjetas del teléfono repiten el botón: se elige el que se ve
      var visible = Array.prototype.find.call(document.querySelectorAll(sel), function (x) { return x.getClientRects().length > 0; });
      if (visible) { visible.focus(); return; }
    }
    var h1 = document.getElementById('titulo-pantalla');
    if (h1) h1.focus();
  }

  function dialogo(op) {
    contadorDialogos += 1;
    var id = 'dialogo-' + contadorDialogos;
    var d = document.createElement('dialog');
    d.className = 'dialogo';
    d.setAttribute('aria-labelledby', id + '-titulo');
    d.innerHTML =
      '<div class="dialogo__cabeza"><h2 class="subtitulo" id="' + id + '-titulo">' + esc(op.titulo) + '</h2>' +
      '<button type="button" class="btn btn--icono" data-cerrar aria-label="Cerrar">' + icono('x', 'icono--24') + '</button></div>' +
      (op.formulario ? '<form class="dialogo__form" novalidate>' : '') +
      '<div class="dialogo__cuerpo" tabindex="0">' + op.cuerpo + '</div>' +
      (op.pie ? '<div class="dialogo__pie">' + op.pie + '</div>' : '') +
      (op.formulario ? '</form>' : '');
    // Vuelve al botón que lo abrió (Safari no lo enfoca al hacer clic) o, si viene de otro diálogo, a donde volvía aquel
    var activo = document.activeElement;
    var foco;
    if (heredada) foco = heredada;
    else if (disparador && document.contains(disparador)) foco = claveFoco(disparador);
    else if (activo && activo !== document.body && document.contains(activo) && !activo.closest('dialog')) foco = claveFoco(activo);
    else foco = ultimaClave;
    disparador = null;
    document.body.appendChild(d);
    d.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-cerrar]');
      if (b && d.contains(b)) { ev.preventDefault(); d.close(); }
    });
    d.addEventListener('close', function () {
      d.remove();
      ultimaClave = foco;
      if (op.alCerrar) op.alCerrar();
      if (d._siguiente) {
        heredada = foco;
        try { d._siguiente(); } finally { heredada = null; }
        return;
      }
      setTimeout(function () { devolverFoco(foco); }, 0);
    });
    d.showModal();
    var primero = op.foco ? d.querySelector(op.foco) : null;
    (primero || d.querySelector('.dialogo__cuerpo')).focus();
    enlazarImportes(d);
    if (op.alAbrir) op.alAbrir(d);
    return d;
  }

  /* Cierra un diálogo y abre otro; al final el foco vuelve a donde se abrió el primero */
  function cerrarYAbrir(d, abrir) {
    d._siguiente = abrir;
    d.close();
  }

  function confirmar(op) {
    return new Promise(function (resolver) {
      var respuesta = false;
      var d = dialogo({
        titulo: op.titulo,
        cuerpo: '<p>' + op.texto + '</p>',
        pie: '<button type="button" class="btn btn--secundario" data-cerrar>' + esc(op.cancelar || 'Cancelar') + '</button>' +
          '<button type="button" class="btn btn--principal" data-si>' + esc(op.aceptar) + '</button>',
        foco: '[data-si]',
        alCerrar: function () { resolver(respuesta); }
      });
      d.querySelector('[data-si]').addEventListener('click', function () { respuesta = true; d.close(); });
    });
  }

  /* ---------- Avisos flotantes («Eliminado · Deshacer», 8 s) ---------- */
  function avisar(texto, deshacer) {
    var zona = document.getElementById('avisos');
    if (!zona) return;
    var a = document.createElement('div');
    a.className = 'aviso';
    a.innerHTML = '<span class="aviso__texto">' + esc(texto) + '</span>' +
      (deshacer ? '<button type="button" class="btn btn--sutil">Deshacer</button>' : '') +
      '<button type="button" class="btn btn--icono" aria-label="Cerrar aviso">' + icono('x') + '</button>';
    zona.appendChild(a);
    var t = setTimeout(quitar, 8000);
    function quitar() { clearTimeout(t); if (a.parentNode) a.remove(); }
    a.querySelector('[aria-label="Cerrar aviso"]').addEventListener('click', quitar);
    if (deshacer) {
      a.querySelector('.btn--sutil').addEventListener('click', function () {
        quitar();
        deshacer();
        avisar('Se deshizo el cambio.');
      });
    }
  }

  /* ---------- Campos ---------- */
  function campo(op) {
    var id = op.id;
    var desc = [];
    if (op.ayuda) desc.push(id + '-ayuda');
    var attrs = op.attrs || '';
    var control;
    var clase = 'campo__control' + (op.importe ? ' campo__control--num' : '');
    if (op.tipo === 'select') {
      control = '<select class="' + clase + '" id="' + id + '" name="' + (op.nombre || id) + '"' +
        (desc.length ? ' aria-describedby="' + desc.join(' ') + '"' : '') + (op.requerido ? ' required' : '') + attrs + '>' +
        op.opciones.map(function (o) {
          var v = typeof o === 'string' ? o : o.valor;
          var t = typeof o === 'string' ? o : o.texto;
          return '<option value="' + esc(v) + '"' + (String(v) === String(op.valor) ? ' selected' : '') + '>' + esc(t) + '</option>';
        }).join('') + '</select>';
    } else if (op.tipo === 'textarea') {
      control = '<textarea class="' + clase + '" id="' + id + '" name="' + (op.nombre || id) + '"' +
        (desc.length ? ' aria-describedby="' + desc.join(' ') + '"' : '') + attrs + '>' + esc(op.valor || '') + '</textarea>';
    } else {
      var tipo = op.importe ? 'text' : (op.tipo || 'text');
      control = '<input class="' + clase + '" id="' + id + '" name="' + (op.nombre || id) + '" type="' + tipo + '"' +
        (op.valor !== undefined && op.valor !== null ? ' value="' + esc(op.valor) + '"' : '') +
        (op.importe ? ' inputmode="decimal" autocomplete="off" data-importe="' + (op.decimales || 2) + '"' : '') +
        (desc.length ? ' aria-describedby="' + desc.join(' ') + '"' : '') + (op.requerido ? ' required' : '') + attrs + '>';
    }
    if (op.icono || op.sufijo) {
      control = '<div class="campo__envoltura' + (op.sufijo ? ' campo__envoltura--sufijo' : '') + '">' +
        (op.icono ? icono(op.icono) : '') + control + (op.sufijo ? '<span class="campo__sufijo" aria-hidden="true">' + esc(op.sufijo) + '</span>' : '') + '</div>';
    }
    return '<div class="campo' + (op.clase ? ' ' + op.clase : '') + '">' +
      '<label class="campo__etiqueta" for="' + id + '">' + esc(op.etiqueta) + (op.requerido ? '' : (op.opcional ? ' <span class="suave">(opcional)</span>' : '')) + '</label>' +
      control +
      (op.ayuda ? '<p class="campo__ayuda" id="' + id + '-ayuda">' + esc(op.ayuda) + '</p>' : '') +
      '</div>';
  }

  function marcarError(input, mensaje) {
    var caja = input.closest('.campo');
    limpiarError(input);
    input.setAttribute('aria-invalid', 'true');
    var p = document.createElement('p');
    p.className = 'campo__error';
    p.id = input.id + '-error';
    p.innerHTML = icono('octagon-alert') + '<span>' + esc(mensaje) + '</span>';
    caja.appendChild(p);
    var d = (input.getAttribute('aria-describedby') || '').split(' ').filter(Boolean);
    d.unshift(p.id);
    input.setAttribute('aria-describedby', d.join(' '));
  }
  function limpiarError(input) {
    input.removeAttribute('aria-invalid');
    var p = document.getElementById(input.id + '-error');
    if (p) p.remove();
    var d = (input.getAttribute('aria-describedby') || '').split(' ').filter(function (x) { return x && x !== input.id + '-error'; });
    if (d.length) input.setAttribute('aria-describedby', d.join(' ')); else input.removeAttribute('aria-describedby');
  }

  /* Importes: aceptan coma o punto y al salir del campo se escriben 1.234,56 */
  function formatearImporte(input) {
    var dec = +input.getAttribute('data-importe') || 2;
    var n = f.leerDecimal(input.value, dec);
    if (input.value.trim() === '' || isNaN(n)) return;
    var nf = new Intl.NumberFormat('es-VE', { minimumFractionDigits: dec === 2 || dec > 3 ? 2 : 0, maximumFractionDigits: dec });
    input.value = (n < 0 ? '−' : '') + nf.format(Math.abs(n));
  }
  function enlazarImportes(raiz) {
    raiz.querySelectorAll('[data-importe]').forEach(function (i) {
      if (i.dataset.enlazado) return;
      i.dataset.enlazado = '1';
      i.addEventListener('blur', function () { formatearImporte(i); });
      i.addEventListener('input', function () { if (i.getAttribute('aria-invalid')) limpiarError(i); });
    });
  }

  /* Valida campos: requerido y número positivo. Devuelve el primer campo con error o null. */
  function validar(form, reglas) {
    var primero = null;
    reglas.forEach(function (r) {
      var el = form.querySelector('[name="' + r.nombre + '"]');
      if (!el) return;
      limpiarError(el);
      var v = el.value.trim();
      var msg = null;
      if (r.requerido && v === '') msg = r.mensaje || 'Escribe ' + r.texto + '.';
      else if (r.numero && v !== '') {
        var n = f.leerDecimal(v, +el.getAttribute('data-importe') || 2);
        if (isNaN(n)) msg = 'Escribe un número, por ejemplo 12,50.';
        else if (r.positivo && n <= 0) msg = 'Debe ser mayor que cero.';
        else if (r.noNegativo && n < 0) msg = 'No puede ser negativo.';
        else if (r.max !== undefined && n > r.max) msg = r.mensajeMax || 'No puede pasar de ' + f.numCantidad(r.max) + '.';
      } else if (r.numero && r.requerido === false && v === '') msg = null;
      if (r.extra && !msg) msg = r.extra(v, el);
      if (msg) { marcarError(el, msg); if (!primero) primero = el; }
    });
    if (primero) primero.focus();
    return primero;
  }

  function valor(form, nombre) { var el = form.querySelector('[name="' + nombre + '"]'); return el ? el.value.trim() : ''; }
  function numero(form, nombre) {
    var el = form.querySelector('[name="' + nombre + '"]');
    return el ? f.leerDecimal(el.value, +el.getAttribute('data-importe') || 2) : NaN;
  }

  /* ---------- Gráficos de líneas (se dibujan al ancho real de su caja) ---------- */
  var graficos = new Map();
  var observador = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(function (entradas) {
    entradas.forEach(function (en) { var g = graficos.get(en.target); if (g) dibujarLineas(en.target, g); });
  }) : null;

  function grafico(config) {
    var id = 'g' + Math.random().toString(36).slice(2, 8);
    graficosPendientes[id] = config;
    return '<figure class="grafico" data-grafico="' + id + '" role="img" aria-label="' + esc(config.descripcion) + '"></figure>';
  }
  var graficosPendientes = {};

  function pintarGraficos(raiz) {
    raiz.querySelectorAll('[data-grafico]').forEach(function (el) {
      var cfg = graficosPendientes[el.getAttribute('data-grafico')];
      if (!cfg) return;
      delete graficosPendientes[el.getAttribute('data-grafico')];
      graficos.set(el, cfg);
      dibujarLineas(el, cfg);
      if (observador) observador.observe(el);
    });
  }

  function dibujarLineas(el, cfg) {
    var ancho = Math.round(el.clientWidth || 600);
    if (ancho < 120) return;
    var alto = cfg.alto || (ancho < 480 ? 220 : 260);
    var etiquetaAncho = ancho < 480 ? 70 : 84;      // nombres de serie al final de cada línea
    var m = { arriba: 16, derecha: etiquetaAncho, abajo: 30, izquierda: ancho < 480 ? 50 : 66 };
    var todos = [];
    cfg.series.forEach(function (s) { s.valores.forEach(function (v) { if (v !== null) todos.push(v); }); });
    var min = Math.min.apply(null, todos.concat([cfg.desdeCero === false ? Infinity : 0]));
    var max = Math.max.apply(null, todos);
    if (cfg.referencia !== undefined) { min = Math.min(min, cfg.referencia); max = Math.max(max, cfg.referencia); }
    if (max === min) max = min + 1;
    var rango = max - min;
    var pasoY = Math.pow(10, Math.floor(Math.log10(rango / 4)));
    [1, 2, 2.5, 5, 10].some(function (k) { if (rango / (pasoY * k) <= 5) { pasoY *= k; return true; } return false; });
    var y0 = Math.floor(min / pasoY) * pasoY;
    var y1 = Math.ceil(max / pasoY) * pasoY;
    var w = ancho - m.izquierda - m.derecha;
    var h = alto - m.arriba - m.abajo;
    var n = cfg.etiquetas.length;
    var x = function (i) { return m.izquierda + (n === 1 ? w / 2 : (w * i) / (n - 1)); };
    var y = function (v) { return m.arriba + h - ((v - y0) / (y1 - y0)) * h; };
    var fmt = cfg.formatoEje || function (v) { return f.entero(v); };
    var s = '<svg viewBox="0 0 ' + ancho + ' ' + alto + '" width="' + ancho + '" height="' + alto + '" aria-hidden="true" focusable="false">';
    for (var v = y0; v <= y1 + pasoY / 2; v += pasoY) {
      s += '<line class="grafico__rejilla" x1="' + m.izquierda + '" x2="' + (ancho - m.derecha) + '" y1="' + y(v) + '" y2="' + y(v) + '"/>';
      s += '<text class="grafico__texto" x="' + (m.izquierda - 8) + '" y="' + (y(v) + 4) + '" text-anchor="end">' + esc(fmt(v)) + '</text>';
    }
    if (y0 < 0 && y1 > 0) s += '<line class="grafico__eje" x1="' + m.izquierda + '" x2="' + (ancho - m.derecha) + '" y1="' + y(0) + '" y2="' + y(0) + '"/>';
    s += '<line class="grafico__eje" x1="' + m.izquierda + '" x2="' + (ancho - m.derecha) + '" y1="' + (m.arriba + h) + '" y2="' + (m.arriba + h) + '"/>';
    var cadaEtiqueta = Math.ceil(n / Math.max(2, Math.floor(w / 64)));
    cfg.etiquetas.forEach(function (et, i) {
      if (i % cadaEtiqueta !== 0 && i !== n - 1) return;
      s += '<text class="grafico__texto" x="' + x(i) + '" y="' + (alto - 8) + '" text-anchor="middle">' + esc(et) + '</text>';
    });
    if (cfg.referencia !== undefined) {
      s += '<line class="grafico__eje" stroke-dasharray="2 4" x1="' + m.izquierda + '" x2="' + (ancho - m.derecha) + '" y1="' + y(cfg.referencia) + '" y2="' + y(cfg.referencia) + '"/>';
      s += '<text class="grafico__texto" x="' + (ancho - m.derecha + 6) + '" y="' + (y(cfg.referencia) + 4) + '">' + esc(cfg.referenciaNombre || '') + '</text>';
    }
    var posEtiquetas = [];
    cfg.series.forEach(function (serie) {
      var puntos = serie.valores.map(function (v, i) { return v === null ? null : [x(i), y(v)]; }).filter(Boolean);
      if (!puntos.length) return;
      s += '<polyline class="serie--' + serie.clase + '" points="' + puntos.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ') + '"/>';
      puntos.forEach(function (p) { s += '<circle class="punto--' + serie.clase + '" cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="3.5"/>'; });
      var ult = puntos[puntos.length - 1];
      posEtiquetas.push({ y: ult[1], x: ult[0], nombre: serie.nombre, clase: serie.clase });
    });
    // nombres de serie junto a su último punto, sin que se pisen
    posEtiquetas.sort(function (a, b) { return a.y - b.y; });
    for (var i = 1; i < posEtiquetas.length; i += 1) {
      if (posEtiquetas[i].y - posEtiquetas[i - 1].y < 15) posEtiquetas[i].y = posEtiquetas[i - 1].y + 15;
    }
    posEtiquetas.forEach(function (p) {
      s += '<text class="grafico__serie-nombre texto--' + p.clase + '" x="' + (p.x + 8) + '" y="' + (p.y + 4) + '">' + esc(p.nombre) + '</text>';
    });
    s += '</svg>';
    el.innerHTML = s;
  }

  function leyenda(series) {
    var muestra = {
      ingresos: '<svg viewBox="0 0 28 10" aria-hidden="true"><line x1="1" x2="27" y1="5" y2="5" class="serie--ingresos"/><circle cx="14" cy="5" r="3" class="punto--ingresos"/></svg>',
      gastos: '<svg viewBox="0 0 28 10" aria-hidden="true"><line x1="1" x2="27" y1="5" y2="5" class="serie--gastos"/></svg>',
      tercera: '<svg viewBox="0 0 28 10" aria-hidden="true"><line x1="2" x2="27" y1="5" y2="5" class="serie--tercera"/></svg>'
    };
    return '<p class="leyenda" aria-hidden="true">' + series.map(function (s) {
      return '<span>' + muestra[s.clase] + esc(s.nombre) + (s.forma ? ' (' + esc(s.forma) + ')' : '') + '</span>';
    }).join('') + '</p>';
  }

  SB.ui = {
    icono: icono, estado: estado, dinero: dinero, dineroDe: dineroDe, dibujo: dibujo, vacio: vacio, esqueleto: esqueleto,
    dialogo: dialogo, cerrarYAbrir: cerrarYAbrir, confirmar: confirmar, fijarDisparador: fijarDisparador, avisar: avisar, devolverFoco: devolverFoco,
    campo: campo, marcarError: marcarError, limpiarError: limpiarError, enlazarImportes: enlazarImportes, validar: validar,
    valor: valor, numero: numero, grafico: grafico, pintarGraficos: pintarGraficos, leyenda: leyenda
  };
})(window.SB = window.SB || {});
