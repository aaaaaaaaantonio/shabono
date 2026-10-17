/* ==========================================================================
   Shabono by Nelson Méndez — main.js
   Sin frameworks. Contiene:
     1. CONFIG: datos de contacto (WhatsApp y enlace de Google Maps)
     2. TRADUCCIONES: todos los textos del sitio en español e inglés
     3. Funciones del sitio (idioma, menú, galería, WhatsApp y enlaces de Google Maps)

   Cualquier texto entre corchetes [ASÍ] es un dato pendiente de confirmar con
   el restaurante y se resalta automáticamente en la página. Al sustituirlo por
   el dato real, el resaltado desaparece solo.
   ========================================================================== */
'use strict';

/* --------------------------------------------------------------------------
   1. CONFIGURACIÓN
   -------------------------------------------------------------------------- */
const CONFIG = {
  // Número de WhatsApp en formato internacional, p. ej. '+58 412 000 0000'
  // (se usa tal cual para mostrarlo y sin espacios ni '+' para el enlace wa.me).
  telefono: '+58 416-685-2153',

  // Enlace para abrir la ubicación en Google Maps (botón «Compartir» > «Copiar enlace»).
  mapsEnlace: 'https://maps.app.goo.gl/cwKJK5V7sSogdyap6',

  // El mapa insertado (código «Insertar un mapa» de Google) está directamente en index.html,
  // sección Visítanos, porque se carga solo con loading="lazy".
};

/* --------------------------------------------------------------------------
   2. TRADUCCIONES
   Edita aquí los textos. Las claves coinciden con los atributos data-i18n
   de index.html. Si cambias un texto en español, el HTML guarda una copia
   de respaldo para quien navega sin JavaScript: conviene actualizarla también.
   -------------------------------------------------------------------------- */
const TRADUCCIONES = {
  es: {
    meta: {
      titulo: 'Shabono by Nelson Méndez | Alta cocina de autor en Puerto Ayacucho, Amazonas',
      descripcion: 'Restaurante de alta cocina de autor del chef venezolano Nelson Méndez en Puerto Ayacucho, estado Amazonas, Venezuela. Ingredientes amazónicos y productores locales. Reservas por WhatsApp.',
      ogTitulo: 'Shabono by Nelson Méndez · Alta cocina de autor en Puerto Ayacucho',
      ogDescripcion: 'Cocina de autor con ingredientes amazónicos del chef venezolano Nelson Méndez, en Puerto Ayacucho, Amazonas. Reserva tu mesa por WhatsApp.',
      ogLocale: 'es_VE',
    },
    general: {
      saltar: 'Saltar al contenido',
      inicio: 'Shabono by Nelson Méndez, ir al inicio',
      menuAbrir: 'Abrir navegación',
      menuCerrar: 'Cerrar navegación',
      idioma: 'Idioma',
      accesos: 'Accesos rápidos',
    },
    nav: {
      etiqueta: 'Principal',
      chef: 'El chef',
      concepto: 'El concepto',
      menu: 'Menú',
      galeria: 'Galería',
      reconocimientos: 'Reconocimientos',
      visitanos: 'Visítanos',
      reservar: 'Reservar',
    },
    portada: {
      ladoIzq: 'Alta cocina de autor',
      ladoDer: 'Puerto Ayacucho · Amazonas',
      frase: 'Donde la tierra amazónica se convierte en alta cocina.',
      reservar: 'Reservar',
      verMenu: 'Ver menú',
      imagenAlt: 'Roca de granito con cascada en el interior de Shabono, de noche',
    },
    chef: {
      rol: 'Chef y propietario · Chef venezolano con reconocimiento internacional',
      // Biografía provisional, solo con datos confirmados. Sustituir por la biografía real.
      bio: 'Nelson Méndez es chef y propietario de Shabono, en Puerto Ayacucho, y dueño del Instituto Culinario de Investigación Amazonas. Cocina con ingredientes originarios del estado Amazonas.',
      // Cita real del chef. Mientras esté vacía, el bloque de la cita no se muestra.
      cita: '',
      fotoAlt: 'El chef Nelson Méndez sonriente, con su chaqueta blanca de chef',
    },
    concepto: {
      titulo: 'Cocina de autor con raíz amazónica',
      intro: 'En Shabono, cada plato parte de la tierra amazónica. Cocinamos con ingredientes originarios del estado Amazonas, cultivados y cuidados con esmero, y los llevamos a la mesa con técnica y mirada de autor.',
      ingredientesTitulo: 'Ingredientes amazónicos',
      ingredientesTexto: 'Productos originarios del estado Amazonas son la base de nuestra cocina.',
      origenTitulo: 'Origen',
      origenTexto: 'Cada ingrediente tiene un origen, y en cada plato queremos que se note.',
      productoresTitulo: 'Productores locales',
      productoresTexto: 'Trabajamos con quienes cultivan y cuidan estos ingredientes con la mayor dedicación.',
    },
    menu: {
      titulo: 'La carta',
      intro: 'Una selección de platos de la casa. Más abajo encontrarás la carta completa.',
      fotoAlt: 'Paella con cangrejo, pulpo, mejillones y camarones',
      // Platos destacados. Si la descripción está vacía, no se muestra.
      platos: [
        { nombre: 'Centro de lomito Shabono', categoria: 'Carnes', descripcion: '' },
        { nombre: 'Pasta Shabono', categoria: 'Pastas', descripcion: 'Aderezo de pesto, queso mozzarella, queso parmesano, pan árabe y lechuga.' },
        { nombre: 'Pescado a la catara', categoria: 'Pescados y mariscos', descripcion: '' },
        { nombre: 'Cubos de dorado rebozados', categoria: 'Pescados y mariscos', descripcion: '' },
        { nombre: 'Ensalada Autana', categoria: 'Entradas', descripcion: '' },
        { nombre: 'Ajicero', categoria: 'Entradas', descripcion: '' },
      ],
      // Carta completa (los nombres de los platos están en index.html y no se traducen)
      cartaCompleta: 'Ver carta completa',
      cartaNota: '',
      categorias: {
        desayunos: 'Desayunos', waffles: 'Waffles', arepas: 'Arepas', sandwiches: 'Sándwiches',
        entradas: 'Entradas', pollo: 'Pollo', carnes: 'Carnes', pescados: 'Pescados y mariscos',
        pastas: 'Pastas', cerdo: 'Cerdo', guarniciones: 'Guarniciones', postres: 'Postres',
        cafe: 'Café y té', bebidas: 'Bebidas', alcohol: 'Bebidas alcohólicas',
      },
      detalles: {
        sandwichShabono: 'Jamón serrano, tomate confitado y queso manchego.',
        pastaShabono: 'Aderezo de pesto, queso mozzarella, queso parmesano, pan árabe y lechuga.',
      },
      degustacionTitulo: 'Menú degustación',
      degustacionTexto: '[DETALLE DEGUSTACIÓN: número de tiempos, precio USD, maridaje]',
      degustacionBoton: 'Reservar degustación',
      alergias: '¿Alergias o restricciones alimentarias? Indícalo al hacer tu reserva. [NOTA SOBRE ALERGIAS]',
      impuestos: '[IMPUESTOS Y SERVICIO: indicar si los precios los incluyen]',
    },
    galeria: {
      titulo: 'Shabono por dentro',
      intro: 'Toca una imagen para ampliarla.',
      ampliar: 'Ampliar:',
      // Texto alternativo de cada foto, en el mismo orden que en index.html
      fotos: [
        'Salón de Shabono con el letrero iluminado «Shabono by Nelson Méndez» y las mesas servidas',
        'Filete de pescado empanizado con camarones en salsa, tostones y ensalada',
        'Pasta con camarones, calamares y mejillones',
        'Carne con hueso a la parrilla con puré de açaí y ensalada de tomate',
        'Salón de eventos de Shabono con luces circulares en la pared',
        'Pollo relleno empanizado con salsa, papas fritas y ensalada',
        'Nelson Méndez junto a integrantes de una comunidad indígena de Amazonas',
        'Mesa servida en el salón de eventos, bajo las luces circulares',
        'Medallones de carne con cebolla, ravioles gratinados y espinaca',
      ],
    },
    visor: {
      etiqueta: 'Visor de imágenes',
      cerrar: 'Cerrar',
      anterior: 'Imagen anterior',
      siguiente: 'Imagen siguiente',
    },
    reconocimientos: {
      titulo: 'Premios y prensa',
      premios: 'Premios',
      prensa: 'Prensa',
    },
    visitanos: {
      titulo: 'Te esperamos en Puerto Ayacucho',
      direccionTitulo: 'Dirección',
      direccion: 'Av. La Raza, al lado de Protección Civil Amazonas',
      ciudad: 'Puerto Ayacucho 7101, estado Amazonas, Venezuela',
      abrirMaps: 'Abrir en Google Maps',
      horariosTitulo: 'Horarios',
      horarios: 'De 7:00 a. m. a 11:00 p. m.',
      pagoTitulo: 'Métodos de pago',
      pago: 'Bolívares y divisas.',
      llegarTitulo: 'Cómo llegar',
      llegarTexto: 'En carro, por la Av. La Raza: estamos al lado de Protección Civil Amazonas.',
      llegarBoton: 'Ver la ruta en Google Maps',
      mapaCargando: 'Cargando mapa…',
      mapaTitulo: 'Mapa con la ubicación de Shabono en Puerto Ayacucho',
    },
    reserva: {
      titulo: 'Reserva tu mesa',
      texto: 'Escríbenos por WhatsApp con la fecha y el número de personas.',
      boton: 'Reservar por WhatsApp',
      telefono: 'WhatsApp:',
      // Mensaje que aparece ya escrito al abrir WhatsApp
      mensaje: 'Hola, quisiera reservar en Shabono para [fecha] y [número] personas',
      politicasTitulo: 'Política de reservas',
      politicas: '[POLÍTICAS DE RESERVA]',
      cancelacionTitulo: 'Cancelaciones',
      cancelacion: '[POLÍTICAS DE CANCELACIÓN]',
    },
    pie: {
      lema: 'Alta cocina de autor en Puerto Ayacucho, Amazonas, Venezuela.',
      contacto: 'Contacto',
      whatsapp: 'WhatsApp:',
      ubicacion: 'Ubicación',
      verMaps: 'Ver en Google Maps',
      idioma: 'Idioma',
      derechos: 'Todos los derechos reservados.',
    },
    flotante: 'Reservar',
  },

  en: {
    meta: {
      titulo: 'Shabono by Nelson Méndez | Signature fine dining in Puerto Ayacucho, Amazonas',
      descripcion: 'Signature fine-dining restaurant by Venezuelan chef Nelson Méndez in Puerto Ayacucho, Amazonas State, Venezuela. Amazonian ingredients and local producers. Book via WhatsApp.',
      ogTitulo: 'Shabono by Nelson Méndez · Signature fine dining in Puerto Ayacucho',
      ogDescripcion: 'Signature cuisine with Amazonian ingredients by Venezuelan chef Nelson Méndez, in Puerto Ayacucho, Amazonas. Book your table via WhatsApp.',
      ogLocale: 'en_US',
    },
    general: {
      saltar: 'Skip to content',
      inicio: 'Shabono by Nelson Méndez, back to top',
      menuAbrir: 'Open navigation',
      menuCerrar: 'Close navigation',
      idioma: 'Language',
      accesos: 'Quick links',
    },
    nav: {
      etiqueta: 'Main',
      chef: 'The chef',
      concepto: 'Our concept',
      menu: 'Menu',
      galeria: 'Gallery',
      reconocimientos: 'Recognition',
      visitanos: 'Visit us',
      reservar: 'Book a table',
    },
    portada: {
      ladoIzq: 'Signature fine dining',
      ladoDer: 'Puerto Ayacucho · Amazonas',
      frase: 'Where the land of the Amazon becomes fine dining.',
      reservar: 'Book a table',
      verMenu: 'View menu',
      imagenAlt: 'Granite rock with a waterfall inside Shabono, at night',
    },
    chef: {
      rol: 'Chef and owner · Internationally recognized Venezuelan chef',
      bio: 'Nelson Méndez is the chef and owner of Shabono in Puerto Ayacucho, and the owner of the Instituto Culinario de Investigación Amazonas. The cooking at Shabono is built on ingredients native to Amazonas State.',
      cita: '',
      fotoAlt: 'Chef Nelson Méndez smiling, wearing his white chef’s jacket',
    },
    concepto: {
      titulo: 'Signature cuisine with Amazonian roots',
      intro: 'At Shabono, every dish starts with the land of the Amazon. We cook with ingredients native to Amazonas State, grown and tended with care, and bring them to the table with technique and a signature point of view.',
      ingredientesTitulo: 'Amazonian ingredients',
      ingredientesTexto: 'Products native to Amazonas State are the foundation of our cooking.',
      origenTitulo: 'Origin',
      origenTexto: 'Every ingredient has an origin, and we want you to taste it in every dish.',
      productoresTitulo: 'Local producers',
      productoresTexto: 'We work with the people who grow and tend these ingredients with the utmost dedication.',
    },
    menu: {
      titulo: 'À la carte',
      intro: 'A selection of house dishes. The full menu is further down.',
      fotoAlt: 'Paella with crab, octopus, mussels and shrimp',
      platos: [
        { nombre: 'Shabono center-cut tenderloin', categoria: 'Meat', descripcion: '' },
        { nombre: 'Shabono pasta', categoria: 'Pasta', descripcion: 'Pesto dressing, mozzarella, parmesan, pita bread and lettuce.' },
        { nombre: 'Fish a la catara', categoria: 'Fish & seafood', descripcion: '' },
        { nombre: 'Battered dorado bites', categoria: 'Fish & seafood', descripcion: '' },
        { nombre: 'Autana salad', categoria: 'Starters', descripcion: '' },
        { nombre: 'Ajicero', categoria: 'Starters', descripcion: '' },
      ],
      cartaCompleta: 'View the full menu',
      cartaNota: 'Dish names are shown in Spanish, as on our printed menu.',
      categorias: {
        desayunos: 'Breakfast', waffles: 'Waffles', arepas: 'Arepas', sandwiches: 'Sandwiches',
        entradas: 'Starters', pollo: 'Chicken', carnes: 'Meat', pescados: 'Fish & seafood',
        pastas: 'Pasta', cerdo: 'Pork', guarniciones: 'Sides', postres: 'Desserts',
        cafe: 'Coffee & tea', bebidas: 'Drinks', alcohol: 'Alcoholic drinks',
      },
      detalles: {
        sandwichShabono: 'Serrano ham, confit tomato and manchego cheese.',
        pastaShabono: 'Pesto dressing, mozzarella, parmesan, pita bread and lettuce.',
      },
      degustacionTitulo: 'Tasting menu',
      degustacionTexto: '[DETALLE DEGUSTACIÓN · EN]',
      degustacionBoton: 'Book the tasting menu',
      alergias: 'Allergies or dietary restrictions? Please let us know when you book. [NOTA SOBRE ALERGIAS · EN]',
      impuestos: '[IMPUESTOS Y SERVICIO · EN]',
    },
    galeria: {
      titulo: 'Inside Shabono',
      intro: 'Tap an image to enlarge it.',
      ampliar: 'Enlarge:',
      fotos: [
        'Shabono’s dining room with the illuminated “Shabono by Nelson Méndez” sign and set tables',
        'Breaded fish fillet with shrimp in sauce, tostones and salad',
        'Pasta with shrimp, squid and mussels',
        'Grilled bone-in steak with açaí purée and tomato salad',
        'Shabono’s event room with circular lights on the wall',
        'Breaded stuffed chicken with sauce, fries and salad',
        'Nelson Méndez with members of an Indigenous community from Amazonas',
        'A set table in the event room, under the circular lights',
        'Beef medallions with onion, gratinéed ravioli and spinach',
      ],
    },
    visor: {
      etiqueta: 'Image viewer',
      cerrar: 'Close',
      anterior: 'Previous image',
      siguiente: 'Next image',
    },
    reconocimientos: {
      titulo: 'Awards and press',
      premios: 'Awards',
      prensa: 'Press',
    },
    visitanos: {
      titulo: 'Find us in Puerto Ayacucho',
      direccionTitulo: 'Address',
      direccion: 'Av. La Raza, next to Protección Civil Amazonas',
      ciudad: 'Puerto Ayacucho 7101, Amazonas State, Venezuela',
      abrirMaps: 'Open in Google Maps',
      horariosTitulo: 'Opening hours',
      horarios: '7:00 a.m. to 11:00 p.m.',
      pagoTitulo: 'Payment methods',
      pago: 'Bolívares and foreign currency.',
      llegarTitulo: 'Getting here',
      llegarTexto: 'By car, along Av. La Raza: we are next to Protección Civil Amazonas.',
      llegarBoton: 'Get directions on Google Maps',
      mapaCargando: 'Loading map…',
      mapaTitulo: 'Map showing the location of Shabono in Puerto Ayacucho',
    },
    reserva: {
      titulo: 'Book your table',
      texto: 'Message us on WhatsApp with the date and the number of guests.',
      boton: 'Book via WhatsApp',
      telefono: 'WhatsApp:',
      mensaje: 'Hello, I would like to book a table at Shabono on [date] for [number] people',
      politicasTitulo: 'Booking policy',
      politicas: '[POLÍTICAS DE RESERVA · EN]',
      cancelacionTitulo: 'Cancellations',
      cancelacion: '[POLÍTICAS DE CANCELACIÓN · EN]',
    },
    pie: {
      lema: 'Signature fine dining in Puerto Ayacucho, Amazonas, Venezuela.',
      contacto: 'Contact',
      whatsapp: 'WhatsApp:',
      ubicacion: 'Location',
      verMaps: 'View on Google Maps',
      idioma: 'Language',
      derechos: 'All rights reserved.',
    },
    flotante: 'Book',
  },
};

/* --------------------------------------------------------------------------
   3. FUNCIONES DEL SITIO
   -------------------------------------------------------------------------- */
const IDIOMAS = ['es', 'en'];
const IDIOMA_POR_DEFECTO = 'es';
const CLAVE_IDIOMA = 'shabono-idioma';

let idiomaActual = IDIOMA_POR_DEFECTO;

const $ = (selector, contexto = document) => contexto.querySelector(selector);
const $$ = (selector, contexto = document) => Array.from(contexto.querySelectorAll(selector));

/** true si el valor falta o todavía contiene un marcador entre corchetes. */
const esPendiente = (valor) => !valor || /\[[^\]]*\]/.test(valor);

/** Busca un texto por su ruta, p. ej. 'menu.platos.0.nombre'. */
function t(ruta, idioma = idiomaActual) {
  const valor = ruta.split('.').reduce((obj, clave) => (obj == null ? undefined : obj[clave]), TRADUCCIONES[idioma]);
  if (valor === undefined && idioma !== IDIOMA_POR_DEFECTO) return t(ruta, IDIOMA_POR_DEFECTO);
  return valor === undefined ? '' : String(valor);
}

const escaparHTML = (texto) =>
  texto.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** Convierte un texto en HTML seguro y resalta los marcadores [ ... ]. */
const marcarPendientes = (texto) =>
  escaparHTML(texto).replace(/\[[^\]]*\]/g, (m) => `<mark class="pendiente">${m}</mark>`);

/* ---------- Idioma ---------- */
function leerIdiomaGuardado() {
  try {
    return localStorage.getItem(CLAVE_IDIOMA);
  } catch {
    return null;
  }
}

function guardarIdioma(idioma) {
  try {
    localStorage.setItem(CLAVE_IDIOMA, idioma);
  } catch {
    /* almacenamiento no disponible: no pasa nada */
  }
}

function idiomaInicial() {
  const deUrl = new URLSearchParams(location.search).get('lang');
  if (IDIOMAS.includes(deUrl)) return deUrl;
  const guardado = leerIdiomaGuardado();
  return IDIOMAS.includes(guardado) ? guardado : IDIOMA_POR_DEFECTO;
}

function ponerMeta(selector, valor) {
  const el = $(selector);
  if (el) el.setAttribute('content', valor);
}

function aplicarIdioma(idioma, { actualizarUrl = true } = {}) {
  idiomaActual = IDIOMAS.includes(idioma) ? idioma : IDIOMA_POR_DEFECTO;
  document.documentElement.lang = idiomaActual;

  $$('[data-i18n]').forEach((el) => {
    el.innerHTML = marcarPendientes(t(el.dataset.i18n));
  });

  // data-i18n-attr="alt:clave; aria-label:otra.clave"
  $$('[data-i18n-attr]').forEach((el) => {
    el.dataset.i18nAttr.split(';').forEach((par) => {
      const [atributo, clave] = par.split(':').map((s) => s.trim());
      if (atributo && clave) el.setAttribute(atributo, t(clave));
    });
  });

  document.title = t('meta.titulo');
  ponerMeta('meta[name="description"]', t('meta.descripcion'));
  ponerMeta('meta[property="og:title"]', t('meta.ogTitulo'));
  ponerMeta('meta[property="og:description"]', t('meta.ogDescripcion'));
  ponerMeta('meta[property="og:locale"]', t('meta.ogLocale'));
  ponerMeta('meta[property="og:locale:alternate"]', idiomaActual === 'es' ? 'en_US' : 'es_VE');

  $$('[data-lang]').forEach((btn) => btn.setAttribute('aria-pressed', String(btn.dataset.lang === idiomaActual)));

  actualizarMenuBoton();
  actualizarContacto();

  // La cita del chef y los textos opcionales (descripciones de platos, nota de la carta) solo se muestran cuando hay texto
  $$('[data-cita]').forEach((el) => { el.hidden = !t('chef.cita'); });
  $$('[data-opcional]').forEach((el) => { el.hidden = !el.textContent.trim(); });

  guardarIdioma(idiomaActual);
  if (actualizarUrl) {
    try {
      const url = new URL(location.href);
      if (idiomaActual === IDIOMA_POR_DEFECTO) url.searchParams.delete('lang');
      else url.searchParams.set('lang', idiomaActual);
      history.replaceState(null, '', url);
    } catch {
      /* abierto como archivo local o dentro de un visor: el idioma cambia igual, sin tocar la URL */
    }
  }
}

function iniciarIdioma() {
  $$('[data-lang]').forEach((btn) => {
    btn.addEventListener('click', () => aplicarIdioma(btn.dataset.lang));
  });
  aplicarIdioma(idiomaInicial(), { actualizarUrl: false });
}

/* ---------- Contacto: WhatsApp y Google Maps ---------- */
function enlaceWhatsApp() {
  const mensaje = encodeURIComponent(t('reserva.mensaje'));
  const numero = esPendiente(CONFIG.telefono) ? '' : CONFIG.telefono.replace(/\D/g, '');
  // Sin número confirmado, wa.me abre WhatsApp con el mensaje y deja elegir el contacto (útil en la demo).
  return `https://wa.me/${numero}?text=${mensaje}`;
}

/** Activa un enlace si el dato está confirmado; si no, lo deja inerte y muestra su marcador. */
function configurarEnlace(enlace, valor, href, marcadores) {
  const pendiente = esPendiente(valor);
  if (pendiente) enlace.removeAttribute('href');
  else enlace.setAttribute('href', href);
  marcadores.forEach((m) => { m.hidden = !pendiente; });
}

function actualizarContacto() {
  const telefonoPendiente = esPendiente(CONFIG.telefono);
  const telefonoHTML = telefonoPendiente ? marcarPendientes(CONFIG.telefono || '[TELÉFONO]') : escaparHTML(CONFIG.telefono);

  $$('[data-whatsapp]').forEach((a) => a.setAttribute('href', enlaceWhatsApp()));
  $$('[data-telefono]').forEach((el) => { el.innerHTML = telefonoHTML; });
  $$('[data-whatsapp-texto]').forEach((a) => {
    a.innerHTML = telefonoHTML;
    if (telefonoPendiente) a.removeAttribute('href');
    else a.setAttribute('href', enlaceWhatsApp());
  });

  $$('[data-enlace-maps]').forEach((a) => configurarEnlace(a, CONFIG.mapsEnlace, CONFIG.mapsEnlace, []));
  $$('[data-pendiente-maps]').forEach((m) => { m.hidden = !esPendiente(CONFIG.mapsEnlace); });
}


/* ---------- Navegación ---------- */
const nav = $('[data-nav]');
const menuBoton = $('[data-menu-boton]');

function actualizarMenuBoton() {
  if (!menuBoton) return;
  const abierto = menuBoton.getAttribute('aria-expanded') === 'true';
  menuBoton.setAttribute('aria-label', t(abierto ? 'general.menuCerrar' : 'general.menuAbrir'));
}

function abrirMenu(abrir) {
  if (!nav || !menuBoton) return;
  nav.classList.toggle('nav--abierta', abrir);
  document.body.classList.toggle('menu-abierto', abrir);
  menuBoton.setAttribute('aria-expanded', String(abrir));
  actualizarMenuBoton();
  // Mientras el menú está abierto, el resto de la página no recibe foco
  ['main', '.pie', '[data-flotante]'].forEach((sel) => {
    const el = $(sel);
    if (el) el.inert = abrir;
  });
  if (abrir) $('[data-menu] a')?.focus();
}

function iniciarNavegacion() {
  if (!nav) return;

  menuBoton?.addEventListener('click', () => abrirMenu(menuBoton.getAttribute('aria-expanded') !== 'true'));

  $$('[data-menu] a').forEach((a) => a.addEventListener('click', () => {
    abrirMenu(false);
  }));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('nav--abierta')) {
      abrirMenu(false);
      menuBoton.focus();
    }
  });


  // Fondo sólido al bajar
  let pendienteFrame = false;
  const actualizarFondo = () => {
    nav.classList.toggle('nav--solida', window.scrollY > 24);
    pendienteFrame = false;
  };
  window.addEventListener('scroll', () => {
    if (!pendienteFrame) {
      pendienteFrame = true;
      requestAnimationFrame(actualizarFondo);
    }
  }, { passive: true });
  actualizarFondo();

  // Secciones ocultas (p. ej. Reconocimientos con la clase seccion--oculta): ocultar su enlace
  $$('[data-seccion]').forEach((li) => {
    const seccion = document.getElementById(li.dataset.seccion);
    li.hidden = !seccion || seccion.classList.contains('seccion--oculta');
  });

  // Marcar el enlace de la sección visible
  if ('IntersectionObserver' in window) {
    const enlaces = $$('.nav__enlaces a');
    const observador = new IntersectionObserver((entradas) => {
      entradas.forEach((entrada) => {
        if (!entrada.isIntersecting) return;
        enlaces.forEach((a) => {
          if (a.getAttribute('href') === `#${entrada.target.id}`) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main section[id]').forEach((s) => observador.observe(s));
  }
}

/* ---------- Galería y visor ---------- */
function iniciarGaleria() {
  const items = $$('[data-galeria] a');
  const visor = $('[data-visor]');
  if (!items.length || !visor || typeof visor.showModal !== 'function') return; // sin <dialog>: los enlaces abren la imagen

  const img = $('[data-visor-img]', visor);
  const contador = $('[data-visor-contador]', visor);
  let indice = 0;
  let disparador = null;

  const mostrar = (i) => {
    indice = (i + items.length) % items.length;
    const miniatura = $('img', items[indice]);
    img.src = items[indice].getAttribute('href');
    img.alt = miniatura ? miniatura.alt : '';
    contador.textContent = `${indice + 1} / ${items.length}`;
  };

  items.forEach((a, i) => a.addEventListener('click', (e) => {
    e.preventDefault();
    disparador = a;
    mostrar(i);
    visor.showModal();
  }));

  $('[data-visor-cerrar]', visor).addEventListener('click', () => visor.close());
  $('[data-visor-ant]', visor).addEventListener('click', () => mostrar(indice - 1));
  $('[data-visor-sig]', visor).addEventListener('click', () => mostrar(indice + 1));

  visor.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') mostrar(indice - 1);
    if (e.key === 'ArrowRight') mostrar(indice + 1);
  });

  // Tocar fuera de la imagen cierra el visor
  visor.addEventListener('click', (e) => {
    if (e.target === visor || e.target.classList.contains('visor__figura')) visor.close();
  });

  // Deslizar para cambiar de imagen
  let inicioX = 0;
  let inicioY = 0;
  visor.addEventListener('touchstart', (e) => {
    inicioX = e.changedTouches[0].clientX;
    inicioY = e.changedTouches[0].clientY;
  }, { passive: true });
  visor.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - inicioX;
    const dy = e.changedTouches[0].clientY - inicioY;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) mostrar(indice + (dx < 0 ? 1 : -1));
  }, { passive: true });

  visor.addEventListener('close', () => {
    img.removeAttribute('src');
    disparador?.focus();
  });
}


/* ---------- Inicio ---------- */
iniciarNavegacion();
iniciarIdioma();
iniciarGaleria();
$$('[data-anio]').forEach((el) => { el.textContent = String(new Date().getFullYear()); });
