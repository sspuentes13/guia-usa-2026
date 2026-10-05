/* JD & Santi On Tour · mapa interactivo: ruta de cada día ordenada por cercanía, "cerca de mí",
   búsqueda de lugares y pantalla completa. Usa las funciones de rutas.js y app.js. */
var dayFilter = null, routeMode = 'cerca', myLL = null, legLayer = null, meMarker = null;
try { var _mr = JSON.parse(localStorage.getItem('guiaRuta') || '{}'); if (_mr.modo === 'plan' || _mr.modo === 'cerca') routeMode = _mr.modo; } catch (e) {}
function guardarRuta() { try { localStorage.setItem('guiaRuta', JSON.stringify({ modo: routeMode })); } catch (e) {} }

function rutaActiva() { return dayFilter ? rutaDia(dayFilter)[routeMode] : null; }
/* Orden de los lugares que se ven (sin repetir la estación de regreso) */
function ordenActual() {
  if (dayFilter) { var o = []; rutaActiva().orden.forEach(function (i) { if (o.indexOf(i) < 0) o.push(i); }); return o; }
  return MAPS[cur].pins.map(function (x) { return x.i; });
}
function numero(i) { if (dayFilter) { var k = ordenActual().indexOf(i); if (k > -1) return k + 1; } return numOf(i); }
function iconoPin(i) {
  var p = P[i];
  return L.divIcon({ className: '', html: '<div class="lpin' + (p.snow ? ' snow' : '') + (p.core ? '' : ' x') + (i === activeId ? ' act' : '') + '">' + (p.snow ? '❄' : numero(i)) + '</div>', iconSize: [28, 28], iconAnchor: [14, 14] });
}

/* Números y línea de ruta en el mapa dibujado y en el satélite */
function refrescarRuta() {
  if (svg && MAPS[cur]) {
    var old = svg.querySelector('.route'); if (old) old.remove();
    var pins = {}; MAPS[cur].pins.forEach(function (x) { pins[x.i] = x; });
    var ord = dayFilter ? rutaActiva().orden.filter(function (i) { return pins[i]; }) : MAPS[cur].pins.filter(function (x) { return P[x.i].core; }).map(function (x) { return x.i; });
    if (ord.length > 1 && cur !== 'snow') {
      var path = el('path', { d: 'M' + ord.map(function (i) { return pins[i].x + ' ' + pins[i].y; }).join(' L'), 'class': 'route' + (dayFilter ? ' dia' : '') });
      svg.insertBefore(path, svg.querySelector('.lb, .pn'));
    }
    [].forEach.call(svg.querySelectorAll('.pn'), function (gr) { var i = +gr.dataset.i; gr.lastChild.textContent = P[i].snow ? '❄' : numero(i); });
    setVB();
  }
  if (lmap) Object.keys(lmk).forEach(function (k) { lmk[k].setIcon(iconoPin(+k)); });
  applyFilter();
}

/* Distancia de cada tramo sobre el satélite */
function etiquetasTramos(ord) {
  var g = L.layerGroup();
  tramos(ord).forEach(function (t) {
    if (t.km < 0.05) return;
    var a = P[t.de].ll, b = P[t.a].ll, mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    var txt = t.pie ? '🚶 ' + kmF(t.km * 1.25) : '🚇 ' + kmF(t.km);
    L.marker(mid, { icon: L.divIcon({ className: 'leglbl', html: '<span class="' + (t.pie ? 'pie' : 'tr') + '">' + txt + '</span>', iconSize: null }), interactive: false, keyboard: false }).addTo(g);
  });
  return g.addTo(lmap);
}

/* Chips de días de la ciudad */
function pintarDias(id) {
  var nav = document.getElementById('dayChips'); if (!nav) return;
  var dias = diasConLugares(id);
  if (!dias.length) { nav.innerHTML = ''; nav.style.display = 'none'; return; }
  nav.style.display = '';
  nav.innerHTML = '<button class="chip sm' + (dayFilter ? '' : ' on') + '" data-dia="">🗓️ Todos los días</button>' + dias.map(function (n) {
    var d = diaDeN(n), r = rutaDia(n), it = intensidad(r);
    return '<button class="chip sm' + (dayFilter === n ? ' on' : '') + '" data-dia="' + n + '">Día ' + n + (d ? ' · ' + esc(d.date.split(' ').slice(0, 2).join(' ')) : '') + ' <small>' + it.e + '</small></button>';
  }).join('');
  [].forEach.call(nav.querySelectorAll('[data-dia]'), function (b) { b.onclick = function () { setDay(b.dataset.dia ? +b.dataset.dia : null); }; });
  var on = nav.querySelector('.on'); if (on && on.scrollIntoView) on.scrollIntoView({ block: 'nearest', inline: 'center' });
}
function setDay(n) {
  dayFilter = n; stopTour(); activeId = null;
  refrescarRuta();
  showCity(cur);
  if (!n) { if (realOn) fitCity(cur); else { vb = { x: 0, y: 0, w: 1000, h: 760 }; setVB(); } }
  else if (!realOn) encuadrarSvg();
}
/* Acerca el mapa dibujado a las paradas del día */
function encuadrarSvg() {
  if (!svg || !dayFilter) return;
  var pts = MAPS[cur].pins.filter(function (x) { return ordenActual().indexOf(x.i) > -1; });
  if (!pts.length) return;
  var xs = pts.map(function (p) { return p.x; }), ys = pts.map(function (p) { return p.y; });
  var x0 = Math.min.apply(0, xs), x1 = Math.max.apply(0, xs), y0 = Math.min.apply(0, ys), y1 = Math.max.apply(0, ys);
  var w = Math.max(160, (x1 - x0) * 1.5, (y1 - y0) * 1.5 / .76);
  vb = { x: (x0 + x1) / 2 - w / 2, y: (y0 + y1) / 2 - w * .38, w: w, h: w * .76 }; setVB();
}

/* Panel con la ruta del día */
function panelDia() {
  var n = dayFilter, r = rutaDia(n), R = r[routeMode], d = r.dia, it = intensidad(r);
  var lug = r.ids.filter(function (i) { return P[i].cat !== 'transporte'; }).length;
  var h = '<div class="pad"><div class="row spread"><span class="pill o">Día ' + n + (d ? ' · ' + esc(d.date) : '') + '</span><button class="btn sm" id="verTodo">✕ Todos los lugares</button></div>';
  h += '<h2>' + esc(d ? d.title : 'Día ' + n) + '</h2><p>' + esc(d ? d.short : '') + '</p>';
  var avB = d ? avisosBloque(d.id, n) : [];
  if (avB.length) h += '<div class="box avisos">' + avB.map(function (a) { return '<p>⚠️ ' + esc(a) + '</p>'; }).join('') + '</div>';
  h += '<div class="toggle2 full" role="group" aria-label="Orden"><button data-rm="cerca"' + (routeMode === 'cerca' ? ' class="on"' : '') + '>🧭 Más cercano</button><button data-rm="plan"' + (routeMode === 'plan' ? ' class="on"' : '') + '>📋 Orden del plan</button></div>';
  if (r.yaOptimo) h += '<div class="box g mt">✓ El orden del plan ya era el más cercano respetando los horarios.</div>';
  else if (routeMode === 'cerca') h += '<div class="box o mt">🧭 Ordenado por cercanía' + (r.ahorroPie > 0.05 ? ': caminan <b>' + kmF(r.ahorroPie) + ' menos</b>' : '') + '. Lo que tiene ⏰ hora fija se respeta.</div>';
  else h += '<div class="box mt">📋 Orden original del plan. Con “Más cercano” ' + (r.ahorroPie > 0.05 ? 'caminan ' + kmF(r.ahorroPie) + ' menos.' : 'queda mejor por horarios.') + '</div>';
  h += '<div class="facts"><div class="fact"><small>🚶 A pie</small><b>' + kmF(R.kmPie) + ' · ' + durTxt(R.minPie) + '</b></div><div class="fact"><small>🚇 En transporte</small><b>' + (R.nTrans ? R.nTrans + ' tramo' + (R.nTrans > 1 ? 's' : '') + ' · ~' + durTxt(R.minTrans) : 'Ninguno') + '</b></div>' +
    '<div class="fact"><small>📍 Lugares</small><b>' + lug + '</b></div><div class="fact"><small>Intensidad</small><b>' + it.e + ' ' + it.t + '</b></div></div>';
  var crono = cronogramaDia(n, routeMode), cr = {}; crono.items.forEach(function (x) { if (x.tipo === 'visita' && !x.regreso) cr[x.i] = x; });
  h += '<div class="cronores">🕘 Empiezan ' + hhmm(crono.items[0] ? crono.items[0].ini : 540) + ' · terminan ~' + hhmm(crono.fin) + (crono.avisos ? ' · <b class="av">⚠️ ' + crono.avisos + ' aviso' + (crono.avisos > 1 ? 's' : '') + '</b>' : ' · ✓ todo abre a tiempo') + '</div>';
  h += '<ol class="ruta">';
  R.orden.forEach(function (i, k) {
    if (k > 0) {
      var t = R.tramos[k - 1];
      if (t.km >= 0.05) h += '<li class="tramo ' + (t.pie ? 'pie' : 'trans') + '"' + (t.pie ? '' : ' data-de="' + t.de + '" data-a="' + t.a + '"') + '>' + (t.pie ? '🚶 ' + kmF(t.km * 1.25) + ' · ' + durTxt(minPie(t.km)) + ' a pie' : '🚇 ' + kmF(t.km) + ' · buscando la línea…') + '</li>';
    }
    var p = P[i], reg = R.orden.indexOf(i) < k, f = reg ? null : horaFija(p, n);
    h += '<li class="parada"><button data-i="' + i + '"><span class="num' + (p.core ? '' : ' x') + '">' + (reg ? '↩' : numero(i)) + '</span><span><b>' + (reg ? 'Regreso · ' : '') + esc(p.n) + '</b><small>' + (cr[i] && !reg ? '<span class="hora">🕘 ' + hhmm(cr[i].ini) + (cr[i].fin > cr[i].ini ? '–' + hhmm(cr[i].fin) : '') + '</span> ' : '') + (f && /amanecer|atardecer|noche|show|reserva/.test(f.por) ? '⏰ ' + esc(f.por) + ' · ' : '') + esc(p.h) + (p.c !== cur ? ' · ' + esc(CITYNAME[p.c]) : '') + '</small>' + (cr[i] && !reg && cr[i].espera >= 10 ? '<small>⏳ Llegan ' + hhmm(cr[i].llega) + ', esperan ' + durTxt(cr[i].espera) + '</small>' : '') + (cr[i] && !reg ? cr[i].avisos.map(function (a) { return '<small class="av">⚠️ ' + esc(a) + '</small>'; }).join('') : '') + '</span><span class="price">' + (reg ? '' : p.e ? fmt(p.e, 'USD') : 'Gratis') + '</span></button></li>';
  });
  h += '</ol><div class="row mt"><a class="btn pri" href="' + gmRuta(R.orden) + '" target="_blank" rel="noopener">🗺️ Ruta en Google Maps ↗</a><button class="btn" id="verDia">🗓️ Ver el día completo</button>' + (d && !d.fijo ? '<button class="btn" id="cambiarBloque">🔀 Cambiar de día</button>' : '') + '</div>';
  if (R.orden.length > 11) h += '<p class="gnota">Google Maps abre hasta 9 paradas intermedias; el resto síganlo aquí.</p>';
  h += '</div>';
  var pan = document.getElementById('panel'); pan.innerHTML = h; pan.scrollTop = 0;
  [].forEach.call(pan.querySelectorAll('[data-rm]'), function (b) { b.onclick = function () { routeMode = b.dataset.rm; guardarRuta(); refrescarRuta(); if (realOn) fitCity(cur); panelDia(); toast(routeMode === 'cerca' ? 'Ruta ordenada por cercanía' : 'Orden original del plan'); }; });
  [].forEach.call(pan.querySelectorAll('.parada button'), function (b) { b.onclick = function () { showPlace(+b.dataset.i); }; });
  document.getElementById('verTodo').onclick = function () { setDay(null); };
  document.getElementById('verDia').onclick = function () { abrirDia(n); };
  var cb = document.getElementById('cambiarBloque'); if (cb) cb.onclick = function () { elegirDiaBloque(d.id); };
  trListo().then(function () { [].forEach.call(pan.querySelectorAll('.tramo[data-de]'), function (li) { li.innerHTML = textoTramo(+li.dataset.de, +li.dataset.a); }); });
}

/* Abre el día en la pestaña Días */
function abrirDia(n) {
  if (daysMode === 'ana') { daysMode = 'res'; save(); }
  go('dias');
  var arts = document.querySelectorAll('#v-dias .day');
  for (var k = 0; k < DAYS.length; k++) {
    var p = String(DAYS[k].n).split('–');
    if (n >= +p[0] && n <= +(p[1] || p[0]) && arts[k]) { arts[k].classList.add('open'); arts[k].scrollIntoView({ block: 'start', behavior: 'smooth' }); break; }
  }
}
/* Abre el mapa con la ruta de un día */
function verRutaDia(n) {
  var r = rutaDia(n), ciudad = r.dia ? r.dia.city : null;
  var enCiudad = r.ids.filter(function (i) { return P[i].cat !== 'transporte'; }).map(function (i) { return P[i].c; });
  if (enCiudad.length && enCiudad.indexOf(ciudad) < 0) ciudad = enCiudad[0];
  go('mapa'); dayFilter = n; showCity(ciudad || 'dc'); refrescarRuta(); if (realOn) fitCity(cur); else encuadrarSvg();
}

/* Lugar en lista */
function itemLugar(i, extra) {
  var p = P[i], fr = FK[p.n] !== undefined ? FREE[FK[p.n]] : null;
  return '<li><button data-i="' + i + '"><span class="num' + (p.snow ? ' snow' : '') + (p.core ? '' : ' x') + '">' + (p.snow ? '❄' : (p.c === cur ? numero(i) : emo(p))) + '</span><span><b>' + esc(p.n) + '</b><small>' + (extra ? extra + ' · ' : '') + esc(etiquetaLugar(p)) + ' · ' + esc(p.h) + (fr && fr.st === 'res' ? ' · 🎟️ reservar' : '') + '</small></span><span class="price">' + (p.e ? fmt(p.e, 'USD') : 'Gratis') + (added[i] ? ' ✓' : '') + (typeof VIS !== 'undefined' && VIS[i] ? ' <span class=\"pill g\">visitado</span>' : '') + '</span></button></li>';
}
function bindLista(cont) { [].forEach.call(cont.querySelectorAll('button[data-i]'), function (b) { b.onclick = function () { showPlace(+b.dataset.i); }; }); }

/* Búsqueda en todo el viaje */
function buscarLugares(q) {
  var t = sinTilde(q).trim(), lista = document.getElementById('lista');
  if (!lista) return;
  if (!t) { lista.innerHTML = MAPS[cur].pins.filter(function (x) { return visible(P[x.i]); }).map(function (x) { return itemLugar(x.i); }).join(''); bindLista(lista); return; }
  var res = P.map(function (p, i) { return i; }).filter(function (i) { var p = P[i]; return sinTilde(p.n + ' ' + p.txt + ' ' + CITYNAME[p.c]).indexOf(t) > -1; });
  lista.innerHTML = res.length ? res.map(function (i) { return itemLugar(i, CITYNAME[P[i].c]); }).join('') : '<li class="vacio">Nada con “' + esc(q) + '”.</li>';
  bindLista(lista);
}

/* Lo más cercano a donde estoy */
function cercaDeMi() { conUbicacion(function () { panelCerca(); }); }
function panelCerca() {
  stopTour();
  var ll = UB.ll, lista = P.map(function (p, i) { return { i: i, k: hav(ll, p.ll) }; }).filter(function (x) { return P[x.i].cat !== 'nieve' && P[x.i].cat !== 'transporte'; })
    .sort(function (a, b) { return a.k - b.k; }).slice(0, 8);
  var h = '<div class="pad"><div class="row spread"><span class="pill g">📍 Cerca de ti</span><button class="btn sm" id="volver">‹ Volver</button></div><h2>Lo más cercano</h2><p>Según tu ubicación en tiempo real' + (UB.acc ? ' (precisión ±' + Math.round(UB.acc) + ' m)' : '') + '.</p>';
  if (lista.length && lista[0].k > 50) h += '<div class="warn">Estás lejos de los lugares del viaje (' + kmF(lista[0].k) + '). Esto sirve cuando estén en EE. UU.</div>';
  h += '<div id="cEst"></div>';
  recomendaciones(ll).slice(1).forEach(function (g) { h += '<h4 class="gh4">' + g.t + '</h4><ul class="places">' + g.l.map(filaReco).join('') + '</ul>'; });
  h += '<h4 class="gh4">📍 Lugares del viaje más cerca</h4><ul class="places">' + lista.map(function (x) { return filaReco(x); }).join('') + '</ul>';
  h += '<div class="row mt"><button class="btn pri" id="cCasa">🏠 ' + (casa() ? 'Volver a casa' : 'Guardar la casa') + '</button></div></div>';
  var pan = document.getElementById('panel'); pan.innerHTML = h; pan.scrollTop = 0;
  [].forEach.call(pan.querySelectorAll('[data-ir]'), function (b) { b.onclick = function () { var i = +b.dataset.ir; irA({ ll: P[i].ll, n: P[i].n, i: i }); }; });
  document.getElementById('volver').onclick = function () { showCity(cur); };
  document.getElementById('cCasa').onclick = volverACasa;
  verPanel();
  if (realOn && lmap) { dibujarYo(); if (lista[0] && lista[0].k < 50) lmap.flyToBounds(L.latLngBounds([ll].concat(lista.slice(0, 3).map(function (x) { return P[x.i].ll; }))).pad(.3), { duration: .8, maxZoom: 17 }); }
  trListo().then(function () {
    var box = document.getElementById('cEst'); if (!box) return;
    var est = estacionesCerca(ll, 1.5, 3);
    box.innerHTML = est.length ? '<h4 class="gh4">🚇 Estaciones cercanas</h4>' + est.map(function (x, k) { return '<button class="estbtn" data-est="' + k + '"><span>🚇</span><span><b>' + esc(x.e.n) + '</b><small>' + walk(x.k) + ' a pie · ' + kmF(x.k) + '</small></span><span>' + lineasDe(x.e).map(function (l) { return chipLinea(x.e.s, l.r, l.c); }).join('') + '</span></button>'; }).join('') : '';
    [].forEach.call(box.querySelectorAll('[data-est]'), function (b) { b.onclick = function () { var x = est[+b.dataset.est]; irA({ ll: x.e.ll, n: 'Estación ' + x.e.n }); }; });
  });
}

/* Tramos especiales verificados (sin metro directo) */
var TRAMOS_ESPECIALES = {
  'Torpedo Factory>Mount Vernon': '🚇 Metro línea Amarilla hasta Huntington y bus 101 de Fairfax Connector hasta Mount Vernon (US$2,25).',
  'Old Town Alexandria>Mount Vernon': '🚇 Metro línea Amarilla hasta Huntington y bus 101 de Fairfax Connector hasta Mount Vernon (US$2,25).',
  "Elfreth's Alley>Christiana Mall": '🚆 Tren SEPTA Wilmington/Newark hasta Wilmington (~45 min; US$8,75 entre semana, US$8 fin de semana) y Uber al Christiana Mall (~15 min).'
};
/* Instrucción real de transporte para un tramo largo de la ruta del día */
function textoTramo(de, a) {
  var esp = TRAMOS_ESPECIALES[P[de].n + '>' + P[a].n]; if (esp) return esp;
  var r = trRuta(P[de].ll, P[a].ll); if (!r) return '🚕 Sin metro directo: Uber o taxi.';
  var v = r.pasos.filter(function (p) { return p.tipo === 'viaje'; });
  return v.map(function (p) { var terms = []; p.alts.forEach(function (x) { x.term.forEach(function (t) { if (terms.indexOf(t) < 0) terms.push(t); }); });
    return '🚇 ' + p.alts.map(function (x) { return chipLinea(p.sis, x.r, x.c); }).join('') + ' de <b>' + esc(TR.E[p.de].n) + '</b> dirección ' + esc(terms.join(' o ')) + ' · ' + p.paradas + ' parada' + (p.paradas > 1 ? 's' : '') + ' → <b>' + esc(TR.E[p.a].n) + '</b>'; }).join('<br>') +
    '<br>~' + durTxt(Math.round(r.min)) + ' puerta a puerta · ' + tarifa(v[0].sis, null, v.reduce(function (s, p) { return s + p.km; }, 0)).txt + ' c/u';
}

/* Mapa en pantalla completa (útil con el teléfono horizontal) */
function pantallaCompleta(forzar) {
  var on = typeof forzar === 'boolean' ? forzar : !document.body.classList.contains('mapa-full');
  document.body.classList.toggle('mapa-full', on);
  var b = document.getElementById('fullBtn'); if (b) { b.textContent = on ? '✕' : '⛶'; b.setAttribute('aria-label', on ? 'Salir de pantalla completa' : 'Pantalla completa'); }
  setTimeout(function () { if (lmap) lmap.invalidateSize(); updScale(); }, 80);
}
document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && document.body.classList.contains('mapa-full')) pantallaCompleta(false); });
