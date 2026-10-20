/* Acceso: elegir el rol, sin contraseñas (demo). */
(function (SB) {
  'use strict';

  var ui = SB.ui;
  var esc = SB.f.esc;
  SB.vistas = SB.vistas || {};

  SB.vistas.acceso = {
    render: function (raiz, alElegir) {
      var roles = SB.app.ROLES;
      raiz.innerHTML =
        '<main class="acceso noche" id="contenido">' +
          '<div class="acceso__caja">' +
            '<img class="acceso__logo" src="img/logo-claro.svg" alt="Shabono by Nelson Méndez" width="302" height="151">' +
            '<div aria-hidden="true">' + ui.dibujo('procesion') + '</div>' +
            '<h1 class="titulo acceso__titulo">Gestión interna</h1>' +
            '<p class="acceso__intro">Elige tu rol para entrar. Es una demo: no hay contraseñas.</p>' +
            '<div class="roles" role="list">' +
              Object.keys(roles).map(function (k) {
                var r = roles[k];
                return '<div role="listitem"><button type="button" class="btn btn--secundario rol" data-rol="' + k + '">' +
                  ui.icono(r.icono, 'icono--24') +
                  '<span><strong>' + esc(r.nombre) + '</strong><span>' + esc(r.descripcion) + '</span></span>' +
                  ui.icono('arrow-right') + '</button></div>';
              }).join('') +
            '</div>' +
            ui.dibujo('meandro') +
            '<div class="acceso__nota">' +
              '<span class="aviso-demo">' + ui.icono('info', 'icono--16') + 'Datos de ejemplo</span>' +
              '<p>Todo lo que ves es ficticio y se guarda solo en este navegador. No es un sistema de facturación.</p>' +
              '<p>Dibujos inspirados en los petroglifos del Cerro Pintado, Puerto Ayacucho.</p>' +
            '</div>' +
          '</div>' +
        '</main>';
      raiz.querySelectorAll('[data-rol]').forEach(function (b) {
        b.addEventListener('click', function () { alElegir(b.getAttribute('data-rol')); });
      });
    }
  };
})(window.SB = window.SB || {});
