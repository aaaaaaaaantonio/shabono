/* Formato de cifras, monedas y fechas (design.md · Voz y Doble moneda).
   Números 1.234,56 · fechas dd/mm/aaaa · «€ 1.234,56» y «Bs. 45.678,90» con el símbolo puesto a mano. */
(function (SB) {
  'use strict';

  var nf2 = new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var nfCant = new Intl.NumberFormat('es-VE', { maximumFractionDigits: 3 });
  var nfPct = new Intl.NumberFormat('es-VE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  var nfTasa = new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 8 });
  var nfEntero = new Intl.NumberFormat('es-VE', { maximumFractionDigits: 0 });
  var MENOS = '−';

  /* Redondeo a d decimales sin el error de los flotantes (15,675 → 15,68) */
  function redondear(n, d) {
    var f = Math.pow(10, d === undefined ? 2 : d);
    return Math.round(Number((n * f).toPrecision(15))) / f;
  }

  function conSigno(n, texto) {
    return (n < 0 && texto.replace(/[0,.]/g, '') !== '' ? MENOS : '') + texto;
  }

  function num(n) { n = redondear(n, 2); return conSigno(n, nf2.format(Math.abs(n))); }
  /* Espacio que no se parte: «€ 1.234,56» nunca queda en dos líneas */
  function eur(n) { return '€\u00a0' + num(n); }
  function bs(n) { return 'Bs.\u00a0' + num(n); }
  function tasaTexto(v, completa) { return '€\u00a01 =\u00a0Bs.\u00a0' + (completa ? tasaCompleta(v) : tasa(v)); }
  function entero(n) { return conSigno(n, nfEntero.format(Math.abs(n))); }
  function pct(r) { return conSigno(r, nfPct.format(Math.abs(r * 100))) + ' %'; }
  function tasa(v) { return nf2.format(v); }
  function tasaCompleta(v) { return nfTasa.format(v); }

  /* Cantidades con su unidad: 0,25 kg → «250 g», 0,2 L → «200 ml» */
  var UNIDADES = { kg: 'kg', L: 'L', und: 'und.', manojo: 'manojo' };
  function cantidad(n, unidad) {
    if (unidad === 'kg' && Math.abs(n) > 0 && Math.abs(n) < 1) return nfCant.format(redondear(n * 1000, 0)) + ' g';
    if (unidad === 'L' && Math.abs(n) > 0 && Math.abs(n) < 1) return nfCant.format(redondear(n * 1000, 0)) + ' ml';
    if (unidad === 'manojo') return nfCant.format(n) + (Math.abs(n) === 1 ? ' manojo' : ' manojos');
    return nfCant.format(n) + ' ' + (UNIDADES[unidad] || unidad);
  }
  function nombreUnidad(unidad) {
    return { kg: 'kilo', L: 'litro', und: 'unidad', manojo: 'manojo' }[unidad] || unidad;
  }
  function numCantidad(n) { return nfCant.format(n); }

  /* Lee importes con coma o punto: «1.234,56», «1234,56», «1234.56», «988,97203073».
     Con un solo punto y tres cifras detrás («1.800»), en importes de 2 decimales se lee como miles,
     que es como se escribe en Venezuela; en cantidades (3 decimales) se lee como decimal. */
  function leerDecimal(texto, decimales) {
    if (texto === null || texto === undefined) return NaN;
    var s = String(texto).trim().replace(/\s|€|Bs\.?/gi, '').replace(MENOS, '-');
    if (s === '') return NaN;
    var ultimaComa = s.lastIndexOf(',');
    var ultimoPunto = s.lastIndexOf('.');
    if (ultimaComa > -1 && ultimoPunto > -1) {
      var dec = ultimaComa > ultimoPunto ? ',' : '.';
      var mil = dec === ',' ? '.' : ',';
      s = s.split(mil).join('').replace(dec, '.');
    } else if (ultimaComa > -1) {
      if ((s.match(/,/g) || []).length > 1) return NaN;
      s = s.replace(',', '.');
    } else if ((s.match(/\./g) || []).length > 1) {
      if (!/^-?\d{1,3}(\.\d{3})+$/.test(s)) return NaN;     // «1.2.3» no es un número
      s = s.split('.').join('');
    } else if (ultimoPunto > -1 && (decimales || 2) <= 2 && /^-?\d{1,3}\.\d{3}$/.test(s)) {
      s = s.replace('.', '');
    }
    if (!/^-?\d*\.?\d+$/.test(s) && !/^-?\d+\.?$/.test(s)) return NaN;
    return parseFloat(s);
  }

  /* ---------- Fechas (cadenas ISO aaaa-mm-dd en hora local) ---------- */
  function dos(n) { return (n < 10 ? '0' : '') + n; }
  function iso(d) { return d.getFullYear() + '-' + dos(d.getMonth() + 1) + '-' + dos(d.getDate()); }
  function hoyISO() { return iso(new Date()); }
  function aFecha(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function sumarDias(s, n) { var d = aFecha(s); d.setDate(d.getDate() + n); return iso(d); }
  function diasEntre(a, b) { return Math.round((aFecha(b) - aFecha(a)) / 86400000); }
  function fecha(s) { if (!s) return ''; var p = s.split('-'); return p[2] + '/' + p[1] + '/' + p[0]; }
  function fechaCorta(s) { if (!s) return ''; var p = s.split('-'); return p[2] + '/' + p[1]; }
  var dfLarga = new Intl.DateTimeFormat('es-VE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  function fechaLarga(s) { return dfLarga.format(aFecha(s)); }
  var dfMes = new Intl.DateTimeFormat('es-VE', { month: 'long', year: 'numeric' });
  function mesNombre(mes) { var t = dfMes.format(aFecha(mes + '-01')); return t.charAt(0).toUpperCase() + t.slice(1); }
  function mesDe(s) { return s.slice(0, 7); }

  /* «Vence en 2 días · 22/10/2026» */
  function vence(s, hoy) {
    if (!s) return 'Sin vencimiento';
    var d = diasEntre(hoy, s);
    var f = fecha(s);
    if (d < -1) return 'Venció hace ' + (-d) + ' días · ' + f;
    if (d === -1) return 'Venció ayer · ' + f;
    if (d === 0) return 'Vence hoy · ' + f;
    if (d === 1) return 'Vence en 1 día · ' + f;
    return 'Vence en ' + d + ' días · ' + f;
  }

  /* Dinero de un registro: moneda de origen, su tasa y el equivalente en la otra moneda */
  function dinero(moneda, monto, tasaUsada) {
    monto = redondear(monto, 2);
    return {
      moneda: moneda,
      monto: monto,
      tasa: tasaUsada,
      eur: moneda === 'EUR' ? monto : redondear(monto / tasaUsada, 2),
      bs: moneda === 'VES' ? monto : redondear(monto * tasaUsada, 2)
    };
  }
  function simbolo(moneda) { return moneda === 'EUR' ? '€' : 'Bs.'; }
  function importe(moneda, n) { return moneda === 'EUR' ? eur(n) : bs(n); }

  function esc(t) {
    return String(t === null || t === undefined ? '' : t)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function normalizar(t) {
    return String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  SB.f = {
    redondear: redondear, num: num, eur: eur, bs: bs, tasaTexto: tasaTexto, entero: entero, pct: pct, tasa: tasa, tasaCompleta: tasaCompleta,
    cantidad: cantidad, numCantidad: numCantidad, nombreUnidad: nombreUnidad, leerDecimal: leerDecimal,
    iso: iso, hoyISO: hoyISO, aFecha: aFecha, sumarDias: sumarDias, diasEntre: diasEntre,
    fecha: fecha, fechaCorta: fechaCorta, fechaLarga: fechaLarga, mesNombre: mesNombre, mesDe: mesDe, vence: vence,
    dinero: dinero, simbolo: simbolo, importe: importe, esc: esc, normalizar: normalizar
  };
})(window.SB = window.SB || {});
