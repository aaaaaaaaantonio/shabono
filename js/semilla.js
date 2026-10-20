/* Datos de ejemplo: ficticios pero verosímiles (design.md · Voz).
   - Productos y proveedores inventados, sin marcas, teléfonos ni RIF.
   - Nombres de platos tomados de la carta pública; fichas técnicas y precios de venta inventados.
   - Las fechas se calculan desde el día en que se abre la demo (8 semanas hacia atrás).
   - La tasa actual es la euro BCV del 20/10/2026 que dio el cliente. Las tasas de los registros
     anteriores son ficticias: bajan poco a poco hacia atrás desde esa.
   Todo total, margen o alerta se calcula después a partir de estos registros. */
(function (SB) {
  'use strict';

  var f = SB.f;
  var TASA_REAL = { fecha: '2026-10-20', valor: 988.97203073 };
  var DIAS = 56;

  function azar(semilla) {
    var a = semilla >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* Tasa de ejemplo para un registro pasado (fin de semana: la del viernes) */
  function tasaDe(fechaISO) {
    var d = fechaISO;
    var dia = f.aFecha(d).getDay();
    if (dia === 6) d = f.sumarDias(d, -1);
    if (dia === 0) d = f.sumarDias(d, -2);
    var dias = f.diasEntre(d, TASA_REAL.fecha);
    if (dias <= 0) return TASA_REAL.valor;
    return f.redondear(TASA_REAL.valor * Math.exp(-0.00228 * dias), 8);
  }

  function serie(ultimo, pasos) {
    var r = [];
    var d = ultimo;
    var i = 0;
    while (d <= DIAS) { r.push(d); d += pasos[i % pasos.length]; i += 1; }
    return r;
  }

  var PROVEEDORES = [
    { id: 'prov-remanso', nombre: 'Pescadería El Remanso', vende: 'Pescado de río', moneda: 'VES', credito: 0, dias: serie(3, [4, 3]) },
    { id: 'prov-litoral', nombre: 'Mariscos del Litoral', vende: 'Mariscos congelados', moneda: 'EUR', credito: 15, dias: serie(9, [14]) },
    { id: 'prov-sabana', nombre: 'Frigorífico Sabana Alta', vende: 'Carnes, cerdo, pollo y charcutería', moneda: 'EUR', credito: 7, dias: serie(3, [7]) },
    { id: 'prov-tapiz', nombre: 'Lácteos El Tapiz', vende: 'Lácteos y huevos', moneda: 'VES', credito: 0, dias: serie(4, [7]) },
    { id: 'prov-saman', nombre: 'Hortalizas El Samán', vende: 'Frutas y verduras', moneda: 'VES', credito: 0, dias: serie(1, [3, 4]) },
    { id: 'prov-raiz', nombre: 'Cooperativa Raíz del Monte', vende: 'Productos amazónicos', moneda: 'VES', credito: 0, dias: serie(3, [14]) },
    { id: 'prov-central', nombre: 'Abastos Central Ayacucho', vende: 'Despensa, quesos importados, pollo y mozzarella', moneda: 'EUR', credito: 15, dias: serie(6, [14]) }
  ];

  var CATEGORIAS = ['Pescado de río', 'Mariscos', 'Carnes y aves', 'Lácteos y huevos', 'Frutas y verduras', 'Productos amazónicos', 'Despensa'];

  /* id, nombre, categoría, unidad, mínimo, proveedor, precio base en € (hace 8 semanas), tendencia en 8 semanas,
     vida útil en días (null: sin vencimiento), consumo por semana, existencias que quedan en las últimas compras */
  function P(id, nombre, cat, unidad, minimo, prov, base, tend, vida, semana, resta, extra) {
    var p = { id: id, nombre: nombre, categoria: CATEGORIAS[cat], unidad: unidad, minimo: minimo, proveedorId: prov,
      base: base, tend: tend, vida: vida, semana: semana, resta: resta };
    return Object.assign(p, extra || {});
  }
  var PRODUCTOS = [
    P('dorado', 'Dorado (filete fresco)', 0, 'kg', 6, 'prov-remanso', 7.22, 0.08, 5, 14, [7]),
    P('morocoto', 'Morocoto', 0, 'kg', 4, 'prov-remanso', 4.80, 0, 30, 5, [6, 2], { alternas: true }),
    P('cachama', 'Cachama', 0, 'kg', 4, 'prov-remanso', 4.20, 0, 30, 4, [5, 1.5], { alternas: true }),
    P('palometa', 'Palometa', 0, 'kg', 3, 'prov-remanso', 4.50, 0, 30, 3, [4.5], { alternas: true }),
    P('bagre', 'Bagre rayado', 0, 'kg', 5, 'prov-remanso', 6.50, 0, 30, 7, [8, 2], { alternas: true }),
    P('camaron', 'Camarón mediano (congelado)', 1, 'kg', 5, 'prov-litoral', 13.20, 0.02, 90, 2.5, [3]),
    P('pulpo', 'Pulpo (congelado)', 1, 'kg', 2, 'prov-litoral', 16.80, 0.01, 90, 1.5, [], { desde: 20 }),
    P('calamar', 'Calamar (congelado)', 1, 'kg', 2, 'prov-litoral', 9.00, 0, 90, 1.2, [3.5]),
    P('mejillon', 'Mejillón (congelado)', 1, 'kg', 2, 'prov-litoral', 7.50, 0, 90, 1.2, [3]),
    P('centro-lomito', 'Centro de lomito', 2, 'kg', 8, 'prov-sabana', 14.02, 0.12, 21, 9, [5]),
    P('lomito', 'Lomito', 2, 'kg', 5, 'prov-sabana', 12.00, 0.05, 21, 5, [7, 1]),
    P('pollo', 'Pechuga de pollo', 2, 'kg', 6, 'prov-sabana', 5.80, 0, 60, 8, [9, 3], { prov2: { id: 'prov-central', base: 5.50 } }),
    P('costilla', 'Costilla de cerdo', 2, 'kg', 4, 'prov-sabana', 7.20, 0, 21, 4, [6]),
    P('panceta', 'Panceta de cerdo', 2, 'kg', 3, 'prov-sabana', 8.00, 0, 21, 3, [4.5]),
    P('tocineta', 'Tocineta', 2, 'kg', 1.5, 'prov-sabana', 10.50, 0, 30, 1.5, [2.5]),
    P('jamon', 'Jamón serrano', 2, 'kg', 1, 'prov-sabana', 28.00, 0, 90, 0.7, [1.8], { alternas: true }),
    P('mozzarella', 'Queso mozzarella', 3, 'kg', 3, 'prov-tapiz', 8.50, 0, 21, 4, [5], { prov2: { id: 'prov-central', base: 8.90 } }),
    P('queso-blanco', 'Queso blanco llanero', 3, 'kg', 3, 'prov-tapiz', 6.20, 0, 14, 4, [5.5]),
    P('leche', 'Leche entera', 3, 'L', 8, 'prov-tapiz', 1.40, 0, 7, 20, [12]),
    P('crema', 'Crema de leche', 3, 'L', 2, 'prov-tapiz', 4.80, 0, 17, 2, [2.5, 0, 1]),
    P('mantequilla', 'Mantequilla', 3, 'kg', 1, 'prov-tapiz', 9.00, 0, 60, 1, [2], { alternas: true }),
    P('huevos', 'Huevos', 3, 'und', 60, 'prov-tapiz', 0.16, 0, 21, 150, [120]),
    P('tomate', 'Tomate', 4, 'kg', 5, 'prov-saman', 1.80, 0, null, 12, [7]),
    P('cebolla', 'Cebolla', 4, 'kg', 5, 'prov-saman', 1.30, 0, null, 10, [8, 2]),
    P('ajo', 'Ajo', 4, 'kg', 1, 'prov-saman', 5.00, 0, null, 1, [1.6], { alternas: true }),
    P('pimenton', 'Pimentón', 4, 'kg', 3, 'prov-saman', 2.40, 0, null, 6, [4]),
    P('lechuga', 'Lechuga', 4, 'und', 10, 'prov-saman', 1.20, 0, null, 30, [14]),
    P('cilantro', 'Cilantro', 4, 'manojo', 5, 'prov-saman', 0.60, 0, 5, 20, [6, 3]),
    P('albahaca', 'Albahaca', 4, 'manojo', 4, 'prov-saman', 0.90, 0, 5, 14, [6]),
    P('limon', 'Limón', 4, 'kg', 3, 'prov-saman', 2.00, 0, null, 6, [5]),
    P('platano', 'Plátano', 4, 'und', 20, 'prov-saman', 0.45, 0, null, 70, [36]),
    P('papa', 'Papa', 4, 'kg', 8, 'prov-saman', 1.40, 0, null, 20, [14, 3]),
    P('catara', 'Catara', 5, 'L', 1.5, 'prov-raiz', 12.00, 0, 120, 1.2, [3]),
    P('manoco', 'Mañoco', 5, 'kg', 4, 'prov-raiz', 3.20, 0, 180, 2.5, [2.5]),
    P('casabe', 'Casabe (torta)', 5, 'und', 10, 'prov-raiz', 1.60, 0, 30, 18, [22]),
    P('tupiro', 'Túpiro', 5, 'kg', 2, 'prov-raiz', 3.00, 0, 10, 2, [], { desde: 15 }),
    P('aji', 'Ají amazónico', 5, 'kg', 0.5, 'prov-raiz', 4.50, 0, 20, 0.4, [0.9]),
    P('manaca', 'Pulpa de manaca (açaí)', 5, 'kg', 2, 'prov-raiz', 5.50, 0, 8, 3, [3.5]),
    P('copoazu', 'Pulpa de copoazú', 5, 'kg', 2, 'prov-raiz', 4.80, 0, 90, 3, [5]),
    P('merey', 'Merey tostado', 5, 'kg', 0.5, 'prov-raiz', 13.00, 0, 120, 0.4, [1.1]),
    P('arroz', 'Arroz', 6, 'kg', 10, 'prov-central', 1.30, 0, 365, 10, [16]),
    P('pasta', 'Pasta larga', 6, 'kg', 6, 'prov-central', 2.10, 0, 365, 6, [9]),
    P('harina-maiz', 'Harina de maíz precocida', 6, 'kg', 8, 'prov-central', 1.25, 0, 180, 8, [12]),
    P('harina-trigo', 'Harina de trigo', 6, 'kg', 4, 'prov-central', 1.10, 0, 180, 3, [6]),
    P('aceite', 'Aceite vegetal', 6, 'L', 6, 'prov-central', 2.90, 0, 365, 8, [10]),
    P('oliva', 'Aceite de oliva', 6, 'L', 2, 'prov-central', 9.50, 0, 365, 1.5, [3]),
    P('pan-arabe', 'Pan árabe', 6, 'und', 20, 'prov-central', 0.40, 0, 30, 25, [34]),
    P('cafe', 'Café molido', 6, 'kg', 2, 'prov-central', 9.00, 0, 120, 2, [3.5]),
    P('parmesano', 'Queso parmesano', 3, 'kg', 2, 'prov-central', 22.00, 0, 120, 1, [1.2]),
    P('manchego', 'Queso manchego', 3, 'kg', 1, 'prov-central', 24.00, 0, 90, 0.6, [1.5])
  ];

  /* Platos de la carta (nombres públicos). Fichas técnicas y precios de venta: de ejemplo. */
  var PLATOS = [
    ['centro-lomito', 'Centro de lomito Shabono', 'Carnes', 26, [['centro-lomito', 0.45], ['papa', 0.3], ['mantequilla', 0.03], ['catara', 0.05], ['oliva', 0.03], ['ajo', 0.01], ['cebolla', 0.05], ['pimenton', 0.05]]],
    ['costillitas', 'Costillitas BBQ', 'Cerdo', 18, [['costilla', 0.5], ['papa', 0.25], ['cebolla', 0.05], ['ajo', 0.01], ['aceite', 0.05]]],
    ['catara', 'Pescado a la catara', 'Pescados y mariscos', 19, [['bagre', 0.35], ['catara', 0.06], ['manoco', 0.06], ['aji', 0.02], ['cebolla', 0.05], ['ajo', 0.01], ['casabe', 1], ['cilantro', 0.25]]],
    ['cubos-dorado', 'Cubos de dorado rebozados', 'Pescados y mariscos', 14.5, [['dorado', 0.35], ['harina-trigo', 0.06], ['huevos', 2], ['aceite', 0.2], ['limon', 0.05], ['platano', 1], ['catara', 0.03], ['aji', 0.02], ['manoco', 0.05]]],
    ['pulpo', 'Pulpo a la gallega o al ajillo', 'Pescados y mariscos', 24, [['pulpo', 0.3], ['papa', 0.2], ['oliva', 0.04], ['ajo', 0.015], ['pimenton', 0.03]]],
    ['paella', 'Paella x2', 'Pescados y mariscos', 42, [['arroz', 0.3], ['camaron', 0.2], ['calamar', 0.15], ['mejillon', 0.2], ['pollo', 0.15], ['pimenton', 0.1], ['cebolla', 0.1], ['ajo', 0.02], ['tomate', 0.1], ['oliva', 0.06]]],
    ['ceviche', 'Ceviche clásico', 'Entradas', 12, [['dorado', 0.18], ['limon', 0.15], ['cebolla', 0.06], ['cilantro', 0.5], ['aji', 0.01], ['platano', 0.5]]],
    ['ajicero', 'Ajicero', 'Entradas', 8, [['aji', 0.05], ['catara', 0.04], ['manoco', 0.05], ['casabe', 1], ['cebolla', 0.03]]],
    ['autana', 'Ensalada Autana', 'Entradas', 10, [['lechuga', 0.5], ['tomate', 0.1], ['queso-blanco', 0.06], ['merey', 0.02], ['copoazu', 0.03], ['oliva', 0.02]]],
    ['tequenos', 'Tequeños', 'Entradas', 7, [['harina-trigo', 0.1], ['queso-blanco', 0.12], ['mantequilla', 0.02], ['huevos', 1], ['aceite', 0.1]]],
    ['pasta-shabono', 'Pasta Shabono', 'Pastas', 14, [['pasta', 0.15], ['albahaca', 1], ['merey', 0.03], ['oliva', 0.04], ['mozzarella', 0.08], ['parmesano', 0.03], ['pan-arabe', 1], ['lechuga', 0.25], ['ajo', 0.005]]],
    ['carbonara', 'Carbonara', 'Pastas', 13, [['pasta', 0.15], ['tocineta', 0.08], ['huevos', 2], ['parmesano', 0.03], ['crema', 0.05]]],
    ['arepa-shabono', 'Arepa Shabono', 'Arepas', 7, [['harina-maiz', 0.12], ['panceta', 0.08], ['queso-blanco', 0.05], ['platano', 0.5], ['mantequilla', 0.01]]],
    ['sandwich-shabono', 'Sándwich Shabono', 'Sándwiches', 11, [['jamon', 0.06], ['tomate', 0.08], ['manchego', 0.04], ['oliva', 0.01], ['pan-arabe', 1]]],
    ['jugos', 'Jugos amazónicos', 'Bebidas', 4, [['copoazu', 0.1], ['manaca', 0.05]]],
    ['cafe-leche', 'Café con leche grande', 'Café y té', 2.5, [['cafe', 0.02], ['leche', 0.2]]]
  ];

  function paso(unidad) { return unidad === 'kg' || unidad === 'L' ? 0.5 : 1; }
  function aPaso(n, unidad) { var p = paso(unidad); return Math.max(p, Math.round(n / p) * p); }

  function generar(hoy) {
    var r = azar(20261020);
    var id = (function () { var n = 0; return function (p) { n += 1; return p + '-' + n; }; })();
    var dia = function (haceDias) { return f.sumarDias(hoy, -haceDias); };

    var e = {
      version: 1,
      creado: hoy,
      config: { objetivoCosto: 0.33, diasAviso: 3 },
      tasas: [{ id: 'tasa-real', fecha: TASA_REAL.fecha, valor: TASA_REAL.valor }],
      proveedores: [],
      productos: [],
      lotes: [],
      movimientos: [],
      compras: [],
      platos: [],
      ingresos: [],
      gastos: [],
      cuentas: []
    };

    PROVEEDORES.forEach(function (p) {
      e.proveedores.push({ id: p.id, nombre: p.nombre, vende: p.vende, moneda: p.moneda, credito: p.credito, nota: '' });
    });
    PRODUCTOS.forEach(function (p) {
      e.productos.push({ id: p.id, nombre: p.nombre, categoria: p.categoria, unidad: p.unidad, minimo: p.minimo,
        diasAviso: null, proveedorId: p.proveedorId });
    });

    function precioEUR(p, base, hace) {
      var avance = (DIAS - hace) / DIAS;
      var ruido = p.tend ? 0 : 0.012 * Math.sin(hace * 1.7 + p.id.length);
      return base * (1 + p.tend * avance) * (1 + ruido);
    }
    function precioEn(moneda, eur, tasa) {
      return moneda === 'VES' ? Math.round(eur * tasa / 10) * 10 : Math.round(eur * 20) / 20;
    }

    /* ---------- Compras recibidas, lotes y movimientos ---------- */
    var compraUnpaid = {};     // compras a crédito que siguen sin pagar a propósito
    PROVEEDORES.forEach(function (prov) {
      var dias = prov.dias.slice();       // de la más reciente a la más antigua
      dias.forEach(function (hace, k) {
        var fecha = dia(hace);
        var tasa = tasaDe(fecha);
        var lineas = [];
        PRODUCTOS.forEach(function (p) {
          var esPrincipal = p.proveedorId === prov.id;
          var esSegundo = p.prov2 && p.prov2.id === prov.id;
          if (!esPrincipal && !esSegundo) return;
          if (p.desde && hace < p.desde) return;
          if (esPrincipal && p.alternas && k % 2 === 1) return;
          var siguiente = k > 0 ? dias[k - 1] : 0;
          var intervalo = esPrincipal ? (p.alternas ? 2 : 1) * Math.max(3, (dias[k + 1] || hace + 7) - hace) : 14;
          var cant = aPaso(p.semana * intervalo / 7 * (esSegundo ? 0.35 : 1) * (0.9 + r() * 0.2), p.unidad);
          lineas.push({ p: p, esPrincipal: esPrincipal, cant: cant, siguiente: siguiente,
            precioEUR: precioEUR(p, esSegundo ? p.prov2.base : p.base, hace) });
        });
        if (!lineas.length) return;

        var compraId = id('compra');
        var total = 0;
        var lineasCompra = lineas.map(function (l) {
          var precio = precioEn(prov.moneda, l.precioEUR, tasa);
          total += precio * l.cant;
          return { productoId: l.p.id, cantidad: l.cant, precio: precio };
        });
        var compra = {
          id: compraId, proveedorId: prov.id, fecha: fecha, recibida: fecha, estado: 'recibida',
          moneda: prov.moneda, tasa: tasa, lineas: lineasCompra, total: f.dinero(prov.moneda, total, tasa),
          pago: prov.credito ? 'credito' : 'contado', vencePago: prov.credito ? f.sumarDias(fecha, prov.credito) : null,
          por: 'Chef jefe', recibidaPor: 'Equipo de cocina'
        };
        e.compras.push(compra);

        lineas.forEach(function (l, i) {
          var p = l.p;
          var precio = lineasCompra[i].precio;
          var costoEUR = prov.moneda === 'EUR' ? precio : f.redondear(precio / tasa, 4);
          // qué queda de este lote: solo cuenta el proveedor principal (el segundo ya se consumió)
          var orden = 0;
          if (l.esPrincipal) {
            for (var j = 0; j < k; j += 1) {
              var h = dias[j];
              if (!(p.desde && h < p.desde) && !(p.alternas && j % 2 === 1)) orden += 1;
            }
          }
          var resta = l.esPrincipal && p.resta[orden] ? p.resta[orden] : 0;
          var cant = Math.max(l.cant, resta ? aPaso(resta + p.semana / 7 * Math.min(hace, 3) + paso(p.unidad), p.unidad) : l.cant);
          lineasCompra[i].cantidad = cant;
          var lote = {
            id: id('lote'), productoId: p.id, compraId: compraId, proveedorId: prov.id,
            entrada: fecha, vence: p.vida ? f.sumarDias(fecha, p.vida) : null,
            cantidadInicial: cant, cantidad: resta, costoEUR: costoEUR, moneda: prov.moneda, precio: precio, tasa: tasa
          };
          e.lotes.push(lote);
          e.movimientos.push({ id: id('mov'), fecha: fecha, productoId: p.id, loteId: lote.id, tipo: 'entrada',
            cantidad: cant, nota: 'Compra a ' + prov.nombre, por: 'Equipo de cocina' });
          var usado = f.redondear(cant - resta, 3);
          if (usado > 0) {
            // el consumo se anota a mitad de camino entre esta compra y la siguiente (o hoy)
            var hueco = hace - l.siguiente;
            var fechaUso = dia(Math.max(0, hace - Math.max(1, Math.round(hueco / 2))));
            e.movimientos.push({ id: id('mov'), fecha: fechaUso, productoId: p.id, loteId: lote.id, tipo: 'consumo',
              cantidad: usado, nota: 'Consumo de cocina', por: 'Equipo de cocina' });
          }
        });
        // recalcula el total con las cantidades finales
        var suma = lineasCompra.reduce(function (s, l) { return s + l.precio * l.cantidad; }, 0);
        compra.total = f.dinero(prov.moneda, suma, tasa);

        if (prov.credito && prov.id === 'prov-sabana' && hace === 10) compraUnpaid[compraId] = true;
      });
    });

    /* Mermas registradas (salen de lotes ya consumidos: se reparte el consumo) */
    function merma(productoId, hace, cantidad, nota) {
      var fecha = dia(hace);
      var mov = e.movimientos.filter(function (m) {
        return m.productoId === productoId && m.tipo === 'consumo' && f.diasEntre(m.fecha, fecha) >= 0;
      }).sort(function (a, b) { return a.fecha < b.fecha ? 1 : -1; })[0];
      if (!mov || mov.cantidad <= cantidad) return;
      mov.cantidad = f.redondear(mov.cantidad - cantidad, 3);
      e.movimientos.push({ id: id('mov'), fecha: fecha, productoId: productoId, loteId: mov.loteId, tipo: 'merma',
        cantidad: cantidad, nota: nota, por: 'Equipo de cocina' });
    }
    merma('tomate', 5, 1.5, 'Tomates golpeados');
    merma('lechuga', 2, 4, 'Hojas dañadas');
    merma('leche', 9, 2, 'Se cortó');

    /* ---------- Compras pendientes de recibir ---------- */
    function pendiente(provId, hace, items) {
      var prov = PROVEEDORES.find(function (p) { return p.id === provId; });
      var fecha = dia(hace);
      var tasa = TASA_REAL.valor;
      var total = 0;
      var lineas = items.map(function (it) {
        var p = PRODUCTOS.find(function (x) { return x.id === it[0]; });
        var precio = precioEn(prov.moneda, precioEUR(p, p.base, 0), tasa);
        total += precio * it[1];
        return { productoId: p.id, cantidad: it[1], precio: precio };
      });
      e.compras.push({ id: id('compra'), proveedorId: provId, fecha: fecha, recibida: null, estado: 'pendiente',
        moneda: prov.moneda, tasa: tasa, lineas: lineas, total: f.dinero(prov.moneda, total, tasa),
        pago: prov.credito ? 'credito' : 'contado', vencePago: null, por: 'Chef jefe' });
    }
    pendiente('prov-litoral', 2, [['camaron', 8], ['pulpo', 6]]);
    pendiente('prov-central', 1, [['arroz', 25], ['pasta', 10], ['aceite', 12]]);

    /* ---------- Gastos y cuentas por pagar ---------- */
    function gasto(fecha, categoria, concepto, moneda, montoEUR, extra) {
      var tasa = tasaDe(fecha);
      var monto = moneda === 'VES' ? Math.round(montoEUR * tasa / 10) * 10 : montoEUR;
      var g = Object.assign({ id: id('gasto'), fecha: fecha, categoria: categoria, concepto: concepto,
        proveedorId: null, dinero: f.dinero(moneda, monto, tasa), origen: 'manual', por: 'Administración' }, extra || {});
      e.gastos.push(g);
      return g;
    }

    e.compras.forEach(function (c) {
      if (c.estado !== 'recibida') return;
      var prov = e.proveedores.find(function (p) { return p.id === c.proveedorId; });
      if (c.pago === 'contado') {
        var g = gasto(c.recibida, 'Insumos', 'Compra a ' + prov.nombre, c.moneda, 0, { proveedorId: prov.id, compraId: c.id, origen: 'compra' });
        g.dinero = c.total;
        c.gastoId = g.id;
        return;
      }
      var cuenta = { id: id('cuenta'), proveedorId: prov.id, acreedor: prov.nombre, concepto: 'Compra del ' + f.fecha(c.recibida),
        compraId: c.id, emitida: c.recibida, vence: c.vencePago, dinero: c.total, pagada: null, gastoId: null, origen: 'compra' };
      c.cuentaId = cuenta.id;
      var pagar = f.diasEntre(c.vencePago, hoy) > 0 && !compraUnpaid[c.id];
      if (pagar) {
        var fechaPago = f.sumarDias(c.vencePago, -1);
        var gp = gasto(fechaPago, 'Insumos', 'Pago a ' + prov.nombre + ' · compra del ' + f.fechaCorta(c.recibida), c.moneda, 0,
          { proveedorId: prov.id, compraId: c.id, cuentaId: cuenta.id, origen: 'cuenta' });
        gp.dinero = f.dinero(c.moneda, c.total.monto, tasaDe(fechaPago));
        cuenta.pagada = fechaPago;
        cuenta.gastoId = gp.id;
      }
      e.cuentas.push(cuenta);
    });

    // Gastos fijos y de funcionamiento
    for (var hace = DIAS; hace >= 1; hace -= 1) {
      var fecha = dia(hace);
      var d = f.aFecha(fecha);
      var ultimoDelMes = f.aFecha(f.sumarDias(fecha, 1)).getDate() === 1;
      if (d.getDate() === 15 || ultimoDelMes) gasto(fecha, 'Nómina', 'Nómina de la quincena', 'VES', 3000);
      if (d.getDate() === 5) {
        gasto(fecha, 'Servicios', 'Electricidad', 'VES', 55);
        gasto(fecha, 'Servicios', 'Agua potable (cisterna)', 'VES', 18);
      }
      if (d.getDay() === 1) gasto(fecha, 'Gas y combustible', 'Gas · 2 bombonas', 'VES', 38);
      if (hace % 9 === 4) gasto(fecha, 'Gas y combustible', 'Gasoil para la planta eléctrica', 'VES', 70);
      if (hace % 14 === 12) gasto(fecha, 'Limpieza y desechables', 'Productos de limpieza', 'VES', 42);
      if (hace === 26 || hace === 54) gasto(fecha, 'Limpieza y desechables', 'Envases para llevar', 'EUR', 60);
    }
    gasto(dia(33), 'Servicios', 'Internet del local', 'EUR', 45);
    gasto(dia(40), 'Mantenimiento', 'Mantenimiento de la cava de frío', 'EUR', 180);
    gasto(dia(12), 'Mantenimiento', 'Reparación de la campana extractora', 'VES', 95);

    // Cuentas de servicios por pagar (sin proveedor de insumos)
    function cuentaServicio(acreedor, concepto, haceEmitida, venceEn, moneda, montoEUR) {
      var tasa = tasaDe(dia(haceEmitida));
      var monto = moneda === 'VES' ? Math.round(montoEUR * tasa / 10) * 10 : montoEUR;
      e.cuentas.push({ id: id('cuenta'), proveedorId: null, acreedor: acreedor, concepto: concepto, compraId: null,
        emitida: dia(haceEmitida), vence: f.sumarDias(hoy, venceEn), dinero: f.dinero(moneda, monto, tasa),
        pagada: null, gastoId: null, origen: 'manual', categoria: 'Servicios' });
    }
    cuentaServicio('Proveedor de internet', 'Internet del local · mes en curso', 3, 12, 'EUR', 45);
    cuentaServicio('Técnico de refrigeración', 'Revisión del aire acondicionado del salón', 2, 20, 'EUR', 150);
    e.cuentas[e.cuentas.length - 1].categoria = 'Mantenimiento';

    /* ---------- Ingresos: cierre de cada día (Bs. y divisas) ---------- */
    var BASE = [700, 350, 370, 420, 480, 760, 880];   // domingo a sábado, en €
    for (var h = DIAS; h >= 1; h -= 1) {
      var fe = dia(h);
      var t = tasaDe(fe);
      var total = BASE[f.aFecha(fe).getDay()] * (0.88 + r() * 0.24);
      var enBs = Math.round(total * 0.55 * t / 10) * 10;
      var enDivisas = Math.round(total * 0.45 / 5) * 5;
      e.ingresos.push({ id: id('ingreso'), fecha: fe, concepto: 'Ventas del día', metodo: 'bolivares',
        dinero: f.dinero('VES', enBs, t), por: 'Administración' });
      e.ingresos.push({ id: id('ingreso'), fecha: fe, concepto: 'Ventas del día', metodo: 'divisas',
        dinero: f.dinero('EUR', enDivisas, t), por: 'Administración' });
    }

    /* ---------- Platos ---------- */
    PLATOS.forEach(function (p) {
      e.platos.push({ id: 'plato-' + p[0], nombre: p[1], categoria: p[2], precio: p[3],
        receta: p[4].map(function (x) { return { productoId: x[0], cantidad: x[1] }; }) });
    });

    // Orden cronológico estable
    ['movimientos', 'compras', 'gastos', 'ingresos'].forEach(function (k) {
      e[k].sort(function (a, b) { return a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0; });
    });
    return e;
  }

  SB.semilla = { generar: generar, tasaDe: tasaDe, TASA_REAL: TASA_REAL, CATEGORIAS: CATEGORIAS };
})(window.SB = window.SB || {});
