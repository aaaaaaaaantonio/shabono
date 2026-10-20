/* Almacén de la demo: todo vive en el navegador (localStorage), sin servidor.
   Si el navegador no deja guardar (ventana privada, vista previa), la demo funciona en memoria. */
(function (SB) {
  'use strict';

  var CLAVE = 'shabono-gestion-demo';
  var CLAVE_ROL = 'shabono-gestion-rol';
  var VERSION = 1;
  var memoria = {};
  var estado = null;
  var oyentes = [];

  function leer(k) {
    try { var v = window.localStorage.getItem(k); return v === null && k in memoria ? memoria[k] : v; }
    catch (e) { return k in memoria ? memoria[k] : null; }
  }
  function escribir(k, v) {
    memoria[k] = v;
    try { window.localStorage.setItem(k, v); } catch (e) { /* sin almacenamiento: queda en memoria */ }
  }
  function quitar(k) {
    delete memoria[k];
    try { window.localStorage.removeItem(k); } catch (e) { /* nada */ }
  }

  function cargar() {
    var texto = leer(CLAVE);
    if (texto) {
      try {
        var e = JSON.parse(texto);
        if (e && e.version === VERSION) { estado = e; return estado; }
      } catch (err) { /* datos dañados: se regeneran */ }
    }
    estado = SB.semilla.generar(SB.f.hoyISO());
    guardar();
    return estado;
  }

  function guardar() { escribir(CLAVE, JSON.stringify(estado)); }

  function avisar() { oyentes.slice().forEach(function (fn) { fn(estado); }); }

  /* Toda modificación pasa por aquí: cambia, guarda y repinta */
  function cambiar(mutador) {
    var r = mutador(estado);
    guardar();
    avisar();
    return r;
  }

  function restablecer() {
    estado = SB.semilla.generar(SB.f.hoyISO());
    guardar();
    avisar();
  }

  var contador = 0;
  function nuevoId(prefijo) {
    contador += 1;
    return prefijo + '-' + Date.now().toString(36) + contador.toString(36) + Math.random().toString(36).slice(2, 5);
  }

  /* Quita un registro y devuelve cómo deshacerlo (aviso «Eliminado · Deshacer» de 8 s) */
  function eliminar(coleccion, id) {
    var lista = estado[coleccion];
    var i = lista.findIndex(function (r) { return r.id === id; });
    if (i < 0) return null;
    var registro = lista[i];
    cambiar(function (e) { e[coleccion].splice(i, 1); });
    return function deshacer() {
      cambiar(function (e) {
        if (e[coleccion].some(function (r) { return r.id === id; })) return;
        e[coleccion].splice(Math.min(i, e[coleccion].length), 0, registro);
      });
    };
  }

  function rol() { return leer(CLAVE_ROL); }
  function fijarRol(r) { if (r) escribir(CLAVE_ROL, r); else quitar(CLAVE_ROL); }

  SB.almacen = {
    cargar: cargar,
    get estado() { return estado; },
    cambiar: cambiar,
    restablecer: restablecer,
    nuevoId: nuevoId,
    eliminar: eliminar,
    alCambiar: function (fn) { oyentes.push(fn); },
    rol: rol,
    fijarRol: fijarRol,
    leer: leer,
    escribir: escribir
  };
})(window.SB = window.SB || {});
