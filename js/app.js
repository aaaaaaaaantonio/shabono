/* Arranque, rutas (#/seccion/sub?filtros), marco, roles y permisos. */
(function (SB) {
  'use strict';

  var f = SB.f;
  var ui = SB.ui;
  var esc = f.esc;

  var ROLES = {
    admin: { nombre: 'Administración', icono: 'briefcase', descripcion: 'Ve y edita todo, también finanzas y el objetivo de costo.' },
    chef: { nombre: 'Chef jefe', icono: 'chef-hat', descripcion: 'Inventario, compras, carta y precios. Finanzas solo en lectura.' },
    equipo: { nombre: 'Equipo de cocina', icono: 'users', descripcion: 'Existencias, compras por recibir y fichas técnicas, sin precios.' }
  };

  var PERMISOS = {
    verFinanzas: ['admin', 'chef'],
    editarFinanzas: ['admin'],
    verCostos: ['admin', 'chef'],
    editarTasa: ['admin', 'chef'],
    editarCarta: ['admin', 'chef'],
    editarObjetivo: ['admin'],
    gestionarCompras: ['admin', 'chef'],
    recibirCompra: ['admin', 'chef', 'equipo'],
    ajustarExistencias: ['admin', 'chef', 'equipo'],
    editarProductos: ['admin', 'chef'],
    gestionarProveedores: ['admin', 'chef']
  };

  var SECCIONES = [
    { ruta: 'inicio', titulo: 'Inicio', movil: 'Inicio', corta: 'Inicio', icono: 'house' },
    { ruta: 'inventario', titulo: 'Inventario', movil: 'Inventario', corta: 'Inventario', icono: 'package' },
    { ruta: 'compras', titulo: 'Compras y proveedores', movil: 'Compras', corta: 'Compras', icono: 'shopping-cart' },
    { ruta: 'carta', titulo: 'Carta y precios', movil: 'Carta y precios', corta: 'Carta', icono: 'utensils-crossed' },
    { ruta: 'finanzas', titulo: 'Finanzas', movil: 'Finanzas', corta: 'Finanzas', icono: 'wallet', permiso: 'verFinanzas' }
  ];

  var raiz;
  var marcoMontado = false;
  var rutaAnterior = null;
  var ctxActual = null;
  var vistaActual = null;

  function rolActual() { var r = SB.almacen.rol(); return ROLES[r] ? r : null; }
  function puede(permiso) { var r = rolActual(); return !!r && PERMISOS[permiso].indexOf(r) > -1; }

  function leerRuta() {
    var h = location.hash.replace(/^#\/?/, '');
    var partes = h.split('?');
    var trozos = partes[0].split('/').filter(Boolean);
    var params = {};
    if (partes[1]) new URLSearchParams(partes[1]).forEach(function (v, k) { params[k] = v; });
    return { seccion: trozos[0] || 'inicio', sub: trozos[1] || null, params: params };
  }

  function rutaTexto(r) {
    var q = new URLSearchParams();
    Object.keys(r.params).forEach(function (k) { if (r.params[k] !== '' && r.params[k] !== undefined && r.params[k] !== null) q.set(k, r.params[k]); });
    var s = q.toString();
    return '#/' + r.seccion + (r.sub ? '/' + r.sub : '') + (s ? '?' + s : '');
  }

  /* Cambia los filtros en la dirección sin crear entradas en el historial */
  function fijarParams(params) {
    var r = leerRuta();
    r.params = params;
    history.replaceState(null, '', rutaTexto(r));
  }

  function navegar(hash) { if (location.hash === hash) render(); else location.hash = hash; }

  /* ---------- Marco ---------- */
  function montarMarco() {
    raiz.innerHTML =
      '<a class="saltar" href="#contenido" data-saltar>Saltar al contenido</a>' +
      '<div class="marco">' +
        '<nav class="nav-principal noche" aria-label="Secciones">' +
          '<a class="marca" href="#/inicio" aria-label="Shabono by Nelson Méndez, ir a Inicio">' +
            '<img class="marca__logo" src="img/logo-nm.svg" alt="" width="95" height="40" loading="lazy" decoding="async">' +
            '<span class="marca__nombre">Shabono <small>by Nelson Méndez</small></span></a>' +
          '<ul class="nav-principal__lista" role="list" data-nav></ul>' +
          '<div class="nav-principal__pie"><span>Entraste como</span><strong data-rol-lateral></strong>Gestión interna, no fiscal.</div>' +
        '</nav>' +
        '<div class="columna">' +
          '<header class="franja" data-franja></header>' +
          '<main id="contenido" tabindex="-1">' +
            '<div class="cabecera-pantalla">' +
              '<div class="cabecera-pantalla__textos">' +
                '<h1 class="titulo titulo--pantalla" id="titulo-pantalla" tabindex="-1"></h1>' +
                '<div data-tasa-cabecera></div>' +
              '</div>' +
              '<div class="acciones acciones--bloque" data-acciones-pantalla></div>' +
            '</div>' +
            '<div class="contenido" data-vista></div>' +
          '</main>' +
        '</div>' +
      '</div>';
    marcoMontado = true;

    // Las cabeceras fijas de las tablas se pegan justo debajo de la franja, mida lo que mida
    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(function (en) {
        document.documentElement.style.setProperty('--franja-alto', Math.ceil(en[0].target.getBoundingClientRect().height) + 'px');
      }).observe(raiz.querySelector('[data-franja]'));
    }

    raiz.querySelector('[data-saltar]').addEventListener('click', function (ev) {
      ev.preventDefault();
      document.getElementById('contenido').focus();
    });

    var main = raiz.querySelector('[data-vista]');
    [raiz.querySelector('#contenido')].forEach(function (zona) {
      zona.addEventListener('click', function (ev) {
        var el = ev.target.closest('[data-accion]');
        if (!el) {
          // toda la fila de una tabla abre su detalle
          var fila = ev.target.closest('tr[data-fila]');
          if (fila && !ev.target.closest('a, button, input, select, textarea, label')) {
            var b = fila.querySelector('[data-accion]');
            if (b) b.click();
          }
          return;
        }
        if (!vistaActual || !vistaActual.acciones || !vistaActual.acciones[el.getAttribute('data-accion')]) return;
        ev.preventDefault();
        ui.fijarDisparador(el);
        vistaActual.acciones[el.getAttribute('data-accion')](el, ctxActual, ev);
      });
    });
    var temporizador;
    main.addEventListener('input', function (ev) {
      if (!ev.target.matches('[data-filtro]') || !vistaActual || !vistaActual.filtrar) return;
      clearTimeout(temporizador);
      temporizador = setTimeout(function () { aplicarFiltro(); }, ev.target.type === 'search' ? 180 : 0);
    });
    main.addEventListener('change', function (ev) {
      if (!ev.target.matches('[data-filtro]') || !vistaActual || !vistaActual.filtrar) return;
      aplicarFiltro();
    });
    main.addEventListener('submit', function (ev) { ev.preventDefault(); });

    document.addEventListener('click', function (ev) {
      var menu = document.querySelector('[data-menu-rol]');
      if (menu && !menu.contains(ev.target)) cerrarMenuRol();
    });
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && document.querySelector('[data-menu-rol-panel]:not([hidden])')) {
        cerrarMenuRol();
        var b = document.querySelector('[data-menu-rol-boton]');
        if (b) b.focus();
      }
    });
  }

  function aplicarFiltro() {
    var main = raiz.querySelector('[data-vista]');
    var params = vistaActual.filtrar(main, ctxActual);
    fijarParams(params);
    ctxActual.params = params;
    vistaActual.pintarLista(main, ctxActual);
  }

  function pintarNav(rutaActiva) {
    var nav = raiz.querySelector('[data-nav]');
    nav.innerHTML = SECCIONES.filter(function (s) { return !s.permiso || puede(s.permiso); }).map(function (s) {
      var activa = s.ruta === rutaActiva;
      return '<li><a class="nav-principal__enlace" href="#/' + s.ruta + '"' + (activa ? ' aria-current="page"' : '') + '>' +
        ui.icono(s.icono, 'icono--24') +
        '<span class="nav-principal__larga">' + esc(s.titulo) + '</span>' +
        '<span class="nav-principal__movil">' + esc(s.movil) + '</span>' +
        '<span class="nav-principal__corta">' + esc(s.corta) + '</span></a></li>';
    }).join('');
  }

  function tasaHTML(e, hoy, variante) {
    var t = SB.calc.tasaActual(e);
    var vieja = t.fecha !== hoy;
    return '<button type="button" class="tasa tasa--' + variante + '" data-tasa>' +
      '<span class="tasa__texto">' + ui.icono('refresh-cw', 'icono--16') + 'Tasa BCV · ' + f.tasaTexto(t.valor) + ' · ' + f.fecha(t.fecha) + '</span>' +
      (vieja ? ui.estado({ nivel: 'aviso', texto: 'Tasa del ' + f.fechaCorta(t.fecha) }) : '') +
      '<span class="sr">' + (puede('editarTasa') ? 'Actualizar tasa' : 'Ver tasa') + '</span></button>';
  }

  function pintarFranja(e, hoy) {
    var r = ROLES[rolActual()];
    var franja = raiz.querySelector('[data-franja]');
    franja.innerHTML =
      '<span class="aviso-demo">' + ui.icono('info', 'icono--16') + 'Datos de ejemplo</span>' +
      tasaHTML(e, hoy, 'franja') +
      '<div class="menu-rol franja__rol" data-menu-rol>' +
        '<button type="button" class="rol-boton" aria-expanded="false" aria-controls="menu-rol-panel" data-menu-rol-boton>' +
          ui.icono(r.icono) + '<span class="rol-boton__texto"><span class="sr">Rol: </span>' + esc(r.nombre) + '</span>' + ui.icono('chevron-down', 'icono--16') + '</button>' +
        '<div class="menu-rol__panel" id="menu-rol-panel" hidden data-menu-rol-panel>' +
          '<p>Entraste como ' + esc(r.nombre) + '. Demo sin contraseñas.</p>' +
          '<button type="button" class="menu-rol__opcion" data-cambiar-rol>' + ui.icono('log-out') + 'Cambiar de rol</button>' +
          '<button type="button" class="menu-rol__opcion" data-restablecer>' + ui.icono('rotate-ccw') + 'Restablecer datos de ejemplo</button>' +
        '</div>' +
      '</div>';
    raiz.querySelector('[data-tasa-cabecera]').innerHTML = tasaHTML(e, hoy, 'cabecera');
    raiz.querySelector('[data-rol-lateral]').textContent = r.nombre;

    var boton = franja.querySelector('[data-menu-rol-boton]');
    boton.addEventListener('click', function () {
      var panel = franja.querySelector('[data-menu-rol-panel]');
      var abrir = panel.hidden;
      panel.hidden = !abrir;
      boton.setAttribute('aria-expanded', String(abrir));
      if (abrir) panel.querySelector('button').focus();
    });
    franja.querySelector('[data-cambiar-rol]').addEventListener('click', function () {
      SB.almacen.fijarRol(null);
      location.hash = '#/inicio';
      render();
    });
    franja.querySelector('[data-restablecer]').addEventListener('click', function () {
      cerrarMenuRol();
      ui.confirmar({
        titulo: 'Restablecer datos de ejemplo',
        texto: 'Se borran todos los cambios hechos en esta demo y se vuelven a crear los datos de ejemplo con fecha de hoy. No se puede deshacer.',
        aceptar: 'Restablecer datos'
      }).then(function (si) {
        if (!si) return;
        SB.almacen.restablecer();
        ui.avisar('Datos de ejemplo restablecidos.');
      });
    });
    raiz.querySelectorAll('[data-tasa]').forEach(function (b) { b.addEventListener('click', abrirTasa); });
  }

  function cerrarMenuRol() {
    var panel = document.querySelector('[data-menu-rol-panel]');
    var boton = document.querySelector('[data-menu-rol-boton]');
    if (panel && !panel.hidden) { panel.hidden = true; if (boton) boton.setAttribute('aria-expanded', 'false'); }
  }

  /* ---------- Tasa del día ---------- */
  function abrirTasa() {
    var e = SB.almacen.estado;
    var hoy = f.hoyISO();
    var t = SB.calc.tasaActual(e);
    var historial = e.tasas.slice().sort(function (a, b) { return a.fecha < b.fecha ? 1 : -1; }).slice(0, 5);
    var lista = '<ul class="lista-simple" role="list">' + historial.map(function (x) {
      return '<li><span class="lista-simple__principal"><strong>' + f.tasaTexto(x.valor, true) + '</strong></span><span class="lista-simple__lado">' + f.fecha(x.fecha) + '</span></li>';
    }).join('') + '</ul>';
    if (!puede('editarTasa')) {
      ui.dialogo({
        titulo: 'Tasa BCV del euro',
        cuerpo: '<p>La tasa la actualizan Administración y Chef jefe.</p><div class="dialogo__seccion"><h3 class="etiqueta suave">Últimas tasas</h3>' + lista + '</div>',
        pie: '<button type="button" class="btn btn--principal" data-cerrar>Entendido</button>'
      });
      return;
    }
    var d = ui.dialogo({
      titulo: 'Actualizar tasa',
      formulario: true,
      cuerpo:
        '<div class="formulario">' +
        '<p>Escribe la tasa euro que publica el BCV, con todos sus decimales. Las cifras en Bs. de hoy se calculan con ella; los registros anteriores conservan la suya.</p>' +
        ui.campo({ id: 'tasa-valor', nombre: 'valor', etiqueta: 'Bs. por € 1', importe: true, decimales: 8, requerido: true,
          valor: f.tasaCompleta(t.valor), ayuda: 'Por ejemplo: 988,97203073' }) +
        ui.campo({ id: 'tasa-fecha', nombre: 'fecha', etiqueta: 'Fecha valor', tipo: 'date', requerido: true, valor: hoy }) +
        '</div>' +
        '<div class="dialogo__seccion"><h3 class="etiqueta suave">Últimas tasas</h3>' + lista + '</div>',
      pie: '<button type="button" class="btn btn--secundario" data-cerrar>Cancelar</button>' +
        '<button type="submit" class="btn btn--principal">' + ui.icono('check') + 'Guardar tasa</button>',
      foco: '#tasa-valor'
    });
    d.querySelector('form').addEventListener('submit', function (ev) {
      ev.preventDefault();
      var form = ev.target;
      if (ui.validar(form, [
        { nombre: 'valor', requerido: true, numero: true, positivo: true, texto: 'la tasa' },
        { nombre: 'fecha', requerido: true, texto: 'la fecha' }
      ])) return;
      var valor = ui.numero(form, 'valor');
      var fecha = ui.valor(form, 'fecha');
      SB.almacen.cambiar(function (est) {
        est.tasas = est.tasas.filter(function (x) { return x.fecha !== fecha; });
        est.tasas.push({ id: SB.almacen.nuevoId('tasa'), fecha: fecha, valor: valor });
      });
      d.close();
      ui.avisar('Tasa guardada: ' + f.tasaTexto(valor, true) + ' · ' + f.fecha(fecha) + '.');
    });
  }

  /* ---------- Pintar ---------- */
  function render() {
    var rol = rolActual();
    if (!rol) {
      marcoMontado = false;
      vistaActual = null;
      document.title = 'Entrar · Shabono gestión interna';
      SB.vistas.acceso.render(raiz, function (nuevoRol) {
        SB.almacen.fijarRol(nuevoRol);
        rutaAnterior = null;
        if (!location.hash || location.hash === '#/' || location.hash === '#/inicio') render(); else location.hash = '#/inicio';
        setTimeout(function () { var h = document.getElementById('titulo-pantalla'); if (h) h.focus(); }, 0);
      });
      return;
    }
    if (!marcoMontado) montarMarco();
    var e = SB.almacen.estado;
    var hoy = f.hoyISO();
    var r = leerRuta();
    var seccion = SECCIONES.find(function (s) { return s.ruta === r.seccion; });
    if (!seccion || (seccion.permiso && !puede(seccion.permiso))) {
      if (seccion) ui.avisar('Tu rol no tiene acceso a ' + seccion.titulo + '.');
      history.replaceState(null, '', '#/inicio');
      r = leerRuta();
      seccion = SECCIONES[0];
    }
    var vista = SB.vistas[seccion.ruta];
    var ctx = { e: e, hoy: hoy, rol: rol, rolNombre: ROLES[rol].nombre, puede: puede, params: r.params, sub: r.sub,
      navegar: navegar, fijarParams: fijarParams, seccion: seccion };
    var cambioDeRuta = rutaAnterior !== r.seccion + '/' + (r.sub || '');
    var scroll = window.scrollY;

    pintarNav(seccion.ruta);
    pintarFranja(e, hoy);
    var titulo = vista.titulo ? vista.titulo(ctx) : seccion.titulo;
    document.title = titulo + ' · Shabono gestión interna';
    raiz.querySelector('#titulo-pantalla').textContent = titulo;
    raiz.querySelector('[data-acciones-pantalla]').innerHTML = vista.accionesPantalla ? vista.accionesPantalla(ctx) : '';
    var main = raiz.querySelector('[data-vista]');
    vistaActual = vista;
    ctxActual = ctx;
    main.innerHTML = vista.render(ctx);
    if (vista.despues) vista.despues(main, ctx);
    ui.pintarGraficos(main);
    ui.enlazarImportes(main);

    if (cambioDeRuta) {
      window.scrollTo(0, 0);
      if (rutaAnterior !== null) raiz.querySelector('#titulo-pantalla').focus();
    } else {
      window.scrollTo(0, scroll);
    }
    rutaAnterior = r.seccion + '/' + (r.sub || '');
  }

  function iniciar() {
    raiz = document.getElementById('app');
    SB.almacen.cargar();
    SB.almacen.alCambiar(function () { if (rolActual()) render(); });
    window.addEventListener('hashchange', render);
    render();
  }

  SB.app = { ROLES: ROLES, puede: puede, render: render, navegar: navegar, abrirTasa: abrirTasa };
  document.addEventListener('DOMContentLoaded', iniciar);
})(window.SB = window.SB || {});
