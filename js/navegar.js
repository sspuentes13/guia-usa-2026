/* Guía USA · ubicación en tiempo real, "cómo llegar" a pie o en transporte público,
   navegación paso a paso, volver a casa y recomendaciones según dónde estén.
   - Estaciones y líneas: js/datos/transporte.js (OpenStreetMap). Funciona sin internet.
   - Rutas a pie calle por calle: routing.openstreetmap.de (con internet). Sin internet: dirección y distancia en línea recta.
   - Tarifas verificadas en las páginas oficiales (octubre de 2026): wmata.com, mta.info, septa.org, mta.maryland.gov. */

var SIS_INFO = {
  dc: { n: 'Metro de Washington', espera: 6, pago: 'Acerquen la tarjeta débito o crédito, o el celular, al torniquete al ENTRAR y otra vez al SALIR. Cada persona con su propia tarjeta.', linea: function (r) { return 'Línea ' + ({ R: 'Roja', O: 'Naranja', S: 'Plateada', B: 'Azul', Y: 'Amarilla', G: 'Verde' }[r] || r); } },
  ny: { n: 'Metro de Nueva York', espera: 4, pago: 'Acerquen la tarjeta o el celular al lector OMNY del torniquete. Cambiar de tren dentro del metro no se paga otra vez.', linea: function (r) { return 'Tren ' + r; } },
  phi: { n: 'SEPTA Metro (Filadelfia)', espera: 5, pago: 'Tarjeta contactless, celular o SEPTA Key en el torniquete.', linea: function (r) { return r === 'L' ? 'Línea L (Market-Frankford)' : 'Línea B (Broad Street)'; } },
  bal: { n: 'Transporte de Baltimore', espera: 9, pago: 'Boleto en las máquinas de la estación o en la app CharmPass.', linea: function (r) { return r === 'M' ? 'Metro SubwayLink' : 'Light Rail'; } }
};
function tarifa(sis, fecha, kmViaje) {
  var d = fecha || new Date(), dia = d.getDay(), h = d.getHours() + d.getMinutes() / 60, finde = dia === 0 || dia === 6;
  if (sis === 'dc') {
    if (finde || h >= 21.5) return { txt: 'US$2,25–2,50', nota: finde ? 'fin de semana' : 'después de 9:30 p. m.' };
    return { txt: kmViaje <= 5 ? 'desde US$2,25' : 'US$2,25–6,75', nota: 'entre semana, según la distancia' };
  }
  if (sis === 'ny') return { txt: 'US$3', nota: 'tarifa única' };
  if (sis === 'phi') return { txt: 'US$2,90', nota: 'tarifa única' };
  return { txt: 'US$2', nota: 'tarifa única' };
}

/* ---------- ubicación en tiempo real ---------- */
var UB = { ll: null, acc: null, rumbo: null, t: 0, watch: null, negado: false, subs: [] };
function ubicActiva() { return UB.ll && Date.now() - UB.t < 120000; }
function ubicIniciar(silencioso) {
  if (!navigator.geolocation) { if (!silencioso) toast('Este dispositivo no comparte la ubicación'); return; }
  if (UB.watch !== null) return;
  UB.watch = navigator.geolocation.watchPosition(function (pos) {
    UB.ll = [pos.coords.latitude, pos.coords.longitude]; UB.acc = pos.coords.accuracy; UB.t = Date.now(); UB.negado = false;
    if (pos.coords.heading != null && !isNaN(pos.coords.heading) && pos.coords.speed > 0.7) UB.rumbo = pos.coords.heading;
    myLL = UB.ll; dibujarYo(); marcarVisita(); navActualizar();
    UB.subs.forEach(function (f) { try { f(); } catch (e) {} });
  }, function (err) {
    if (err.code === 1) { UB.negado = true; navigator.geolocation.clearWatch(UB.watch); UB.watch = null; if (!silencioso) toast('Activa la ubicación: Ajustes › Privacidad › Localización › Safari'); }
  }, { enableHighAccuracy: true, maximumAge: 4000, timeout: 25000 });
}
function conUbicacion(cb) {
  if (ubicActiva()) return cb(UB.ll);
  ubicIniciar(false); toast('📍 Buscando tu ubicación…');
  var fin = function () { if (ubicActiva()) { UB.subs = UB.subs.filter(function (f) { return f !== fin; }); cb(UB.ll); } };
  UB.subs.push(fin);
}
// si ya dieron permiso antes, se activa sola al abrir la app
if (navigator.permissions && navigator.permissions.query) navigator.permissions.query({ name: 'geolocation' }).then(function (p) { if (p.state === 'granted') ubicIniciar(true); }).catch(function () {});
// brújula del teléfono (iPhone pide permiso al tocar)
var BRUJ = { on: false, v: null };
function brujulaActivar() {
  function oir(e) { var v = e.webkitCompassHeading != null ? e.webkitCompassHeading : (e.absolute && e.alpha != null ? 360 - e.alpha : null); if (v != null) { BRUJ.v = v; navFlecha(); dibujarYo(); } }
  if (BRUJ.on) return; BRUJ.on = true;
  if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function') DeviceOrientationEvent.requestPermission().then(function (s) { if (s === 'granted') window.addEventListener('deviceorientation', oir); }).catch(function () {});
  else { window.addEventListener('deviceorientationabsolute', oir); window.addEventListener('deviceorientation', oir); }
}

/* punto azul con precisión y dirección (satélite) */
var yoMk = null, yoAcc = null, seguir = false;
function dibujarYo() {
  if (!lmap || !UB.ll || !window.L) return;
  var rumbo = BRUJ.v != null ? BRUJ.v : UB.rumbo;
  var html = '<div class="yo">' + (rumbo != null ? '<i class="cono" style="transform:rotate(' + Math.round(rumbo) + 'deg)"></i>' : '') + '<b></b></div>';
  if (!yoMk) {
    yoAcc = L.circle(UB.ll, { radius: UB.acc || 30, color: '#1A73E8', weight: 1, fillColor: '#1A73E8', fillOpacity: .12, interactive: false }).addTo(lmap);
    yoMk = L.marker(UB.ll, { icon: L.divIcon({ className: '', html: html, iconSize: [26, 26], iconAnchor: [13, 13] }), zIndexOffset: 1000, keyboard: false }).addTo(lmap).bindTooltip('Estás aquí');
    if (meMarker) { lmap.removeLayer(meMarker); meMarker = null; }
  } else { yoMk.setLatLng(UB.ll); yoMk.setIcon(L.divIcon({ className: '', html: html, iconSize: [26, 26], iconAnchor: [13, 13] })); yoAcc.setLatLng(UB.ll).setRadius(UB.acc || 30); }
  if (seguir) lmap.panTo(UB.ll, { animate: true, duration: .5 });
}
function centrarEnMi() {
  conUbicacion(function (ll) {
    if (!lmap) { toast('Abre el satélite para ver tu ubicación'); return; }
    seguir = !seguir || !lmap.getBounds().contains(ll);
    var b = document.getElementById('fabYo'); if (b) b.classList.toggle('on', seguir);
    lmap.flyTo(ll, Math.max(lmap.getZoom(), 16), { duration: .6 });
    toast(seguir ? 'Siguiéndote en el mapa' : 'Centrado en tu ubicación');
  });
}

/* lugares que ya visitaron (se marcan solos al pasar cerca) */
var VIS = {}; try { VIS = JSON.parse(localStorage.getItem('guiaVisitados') || '{}'); } catch (e) {}
function marcarVisita() {
  if (!UB.ll || UB.acc > 80) return;
  P.forEach(function (p, i) { if (!VIS[i] && p.cat !== 'transporte' && hav(UB.ll, p.ll) < 0.12) { VIS[i] = Date.now(); try { localStorage.setItem('guiaVisitados', JSON.stringify(VIS)); } catch (e) {} toast('✓ ' + p.n + ' marcado como visitado'); } });
}

/* ---------- casa (solo en este teléfono) ---------- */
function casa() { try { return JSON.parse(localStorage.getItem('guiaCasa') || 'null'); } catch (e) { return null; } }
function guardarCasa(ll, nombre) {
  try { localStorage.setItem('guiaCasa', JSON.stringify({ ll: [+ll[0].toFixed(6), +ll[1].toFixed(6)], n: nombre || 'Casa' })); } catch (e) {}
  dibujarCasa(); toast('🏠 Casa guardada en este teléfono');
  if (navigator.onLine && typeof offPrepararPuntos === 'function') offPrepararPuntos([ll], [[17, 400], [16, 900], [15, 1800], [14, 3500]]).then(function (o) { if (o) toast('🏠 Mapa de los alrededores guardado (' + offMB(o.bytes) + ')'); }).catch(function () {});
}
var casaMk = null;
function dibujarCasa() {
  var c = casa(); if (!lmap || !window.L) return;
  if (casaMk) { lmap.removeLayer(casaMk); casaMk = null; }
  if (c) casaMk = L.marker(c.ll, { icon: L.divIcon({ className: '', html: '<div class="casapin">🏠</div>', iconSize: [34, 34], iconAnchor: [17, 17] }), zIndexOffset: 900 }).addTo(lmap).on('click', function () { volverACasa(); });
}
function volverACasa() {
  var c = casa();
  if (!c) return panelCasa();
  irA({ ll: c.ll, n: c.n || 'Casa', casa: true });
}
function panelCasa() {
  if (tab !== 'mapa') go('mapa');
  var c = casa(), pan = document.getElementById('panel');
  pan.innerHTML = '<div class="pad"><div class="row spread"><span class="pill g">🏠 Casa</span><button class="btn sm" id="cVolver">‹ Volver</button></div><h2>' + (c ? 'Cambiar la casa' : 'Guarda dónde se quedan') + '</h2><p>Así “Volver a casa” funciona en cualquier momento, también sin internet. Se guarda <b>solo en este teléfono</b>: no se publica en ningún lado.</p>' +
    '<div class="opciones"><button class="opcion" id="cAqui"><b>📍 Estoy en la casa ahora</b><small>Usa tu ubicación actual</small></button><button class="opcion" id="cMapa"><b>🗺️ Elegir en el mapa</b><small>Toca el lugar exacto en el satélite</small></button>' +
    '<form class="opcion" id="cBuscar"><b>🔎 Buscar la dirección</b><small>Necesita internet</small><div class="buscar"><input id="cDir" type="search" placeholder="Ej.: 1500 Wilson Blvd, Arlington" autocomplete="street-address"><button class="btn or" type="submit">Buscar</button></div><div id="cRes"></div></form></div>' +
    (c ? '<button class="btn gdel mt" id="cBorrar">Borrar la casa de este teléfono</button>' : '') + '</div>';
  verPanel();
  document.getElementById('cVolver').onclick = function () { showCity(cur); };
  document.getElementById('cAqui').onclick = function () { conUbicacion(function (ll) { guardarCasa(ll, 'Casa'); showCity(cur); }); };
  document.getElementById('cMapa').onclick = function () {
    if (!lmap) { toast('Abre el satélite (botón de arriba) para elegir en el mapa'); return; }
    toast('Toca en el mapa dónde queda la casa'); document.body.classList.add('eligiendo');
    lmap.once('click', function (e) { document.body.classList.remove('eligiendo'); guardarCasa([e.latlng.lat, e.latlng.lng], 'Casa'); showCity(cur); });
  };
  document.getElementById('cBuscar').onsubmit = function (e) {
    e.preventDefault(); var q = document.getElementById('cDir').value.trim(), res = document.getElementById('cRes'); if (!q) return;
    if (!navigator.onLine) { res.innerHTML = '<div class="warn">Sin internet. Usa “Estoy en la casa ahora” o “Elegir en el mapa”.</div>'; return; }
    res.innerHTML = '<p class="gnota">Buscando…</p>';
    fetch('https://nominatim.openstreetmap.org/search?format=json&limit=4&countrycodes=us&q=' + encodeURIComponent(q)).then(function (r) { return r.json(); }).then(function (j) {
      if (!j.length) { res.innerHTML = '<div class="warn">No encontré esa dirección. Prueba con número, calle y ciudad.</div>'; return; }
      res.innerHTML = '<ul class="places">' + j.map(function (x, k) { return '<li><button type="button" data-k="' + k + '"><span class="num">🏠</span><span><b>' + esc(x.display_name.split(',').slice(0, 3).join(',')) + '</b><small>' + esc(x.display_name) + '</small></span><span></span></button></li>'; }).join('') + '</ul>';
      [].forEach.call(res.querySelectorAll('[data-k]'), function (b) { b.onclick = function () { var x = j[+b.dataset.k]; guardarCasa([+x.lat, +x.lon], 'Casa'); showCity(cur); if (lmap) lmap.flyTo([+x.lat, +x.lon], 16); }; });
    }).catch(function () { res.innerHTML = '<div class="warn">No se pudo buscar ahora. Intenta otra vez.</div>'; });
  };
  var bo = document.getElementById('cBorrar'); if (bo) bo.onclick = function () { if (!confirm('¿Borrar la casa guardada en este teléfono?')) return; try { localStorage.removeItem('guiaCasa'); } catch (e) {} dibujarCasa(); toast('Casa borrada'); showCity(cur); };
}

/* ---------- red de transporte ---------- */
var TR = null;
function trListo() {
  if (TR) return Promise.resolve(TR);
  return cargarScript('js/datos/transporte.js').then(function () { TR = trArmar(); return TR; });
}
function trArmar() {
  var E = TR_E.map(function (e, i) { return { i: i, s: e[0], n: e[1], ll: [e[2], e[3]], ln: [] }; });
  var Ls = TR_LN.map(function (l, k) { l[3].forEach(function (s, pos) { E[s].ln.push(k); }); return { k: k, s: l[0], r: l[1], c: l[2], p: l[3] }; });
  var pie = E.map(function () { return []; });
  for (var a = 0; a < E.length; a++) for (var b = a + 1; b < E.length; b++) {
    if (E[a].s !== E[b].s || Math.abs(E[a].ll[0] - E[b].ll[0]) > 0.004) continue;
    var d = hav(E[a].ll, E[b].ll); if (d < 0.25) { pie[a].push([b, d]); pie[b].push([a, d]); }
  }
  return { E: E, L: Ls, pie: pie };
}
function minPieKm(k) { return k * 1.25 / 4.8 * 60; }
/* minutos en tren: los tramos largos entre estaciones van más rápido */
function minTren(k) { return (k < 1.5 ? k / 28 : k < 3 ? k / 40 : k / 58) * 60 + 0.6; }
/* Nueva York: trenes que en Manhattan van expresos de día (se saltan estaciones locales) */
var EXPRESO_NY = { A: 1, '2': 1, '3': 1, '4': 1, '5': 1, D: 1, Q: 1 };
function estacionesCerca(ll, max, n) {
  return TR.E.map(function (e) { return { e: e, k: hav(ll, e.ll) }; }).filter(function (x) { return x.k <= max; }).sort(function (a, b) { return a.k - b.k; }).slice(0, n || 6);
}
function lineasDe(e) { var v = {}; e.ln.forEach(function (k) { var l = TR.L[k]; v[l.r] = l.c; }); return Object.keys(v).map(function (r) { return { r: r, c: v[r] }; }); }
function chipLinea(s, r, c) { return '<span class="lchip" style="background:' + c + (/#(FFD100|ffd100|fccc0a|FCCC0A)/.test(c) ? ';color:#12344D' : '') + '">' + esc(s === 'dc' ? ({ R: 'Roja', O: 'Naranja', S: 'Plateada', B: 'Azul', Y: 'Amarilla', G: 'Verde' }[r] || r) : r) + '</span>'; }

/* Mejor viaje en transporte público (hasta 2 transbordos), estilo RAPTOR */
function trRuta(A, B) {
  var E = TR.E, INF = 1e9, acc = [], eg = {}, R = 3;
  E.forEach(function (e) { var da = hav(A, e.ll); if (da <= 1.6) acc.push([e.i, da]); var db = hav(e.ll, B); if (db <= 1.6) eg[e.i] = db; });
  if (!acc.length || !Object.keys(eg).length) return null;
  var arr = [new Array(E.length).fill(INF)], par = [[]];
  acc.forEach(function (x) { arr[0][x[0]] = minPieKm(x[1]); par[0][x[0]] = { tipo: 'acceso', km: x[1], r: 0 }; });
  var mejor = { t: INF };
  for (var r = 1; r <= R; r++) {
    arr[r] = arr[r - 1].slice(); par[r] = par[r - 1].slice(); var mejoro = false, nuevos = [];
    TR.L.forEach(function (l) {
      [1, -1].forEach(function (dir) {
        var p = l.p, n = p.length, sub = null;
        for (var k = dir === 1 ? 0 : n - 1; k >= 0 && k < n; k += dir) {
          var s = p[k];
          if (sub) { sub.t += minTren(hav(E[p[k - dir]].ll, E[s].ll)); if (sub.t < arr[r][s] - 0.01) { arr[r][s] = sub.t; par[r][s] = { tipo: 'viaje', l: l.k, dir: dir, desde: sub.s, kd: sub.k, ka: k, r: r }; mejoro = true; nuevos.push(s); } }
          var prev = arr[r - 1][s];
          if (prev < INF && (r === 1 ? par[0][s] : par[r - 1][s] && par[r - 1][s].tipo !== 'acceso')) {
            var tb = prev + SIS_INFO[l.s].espera + (r > 1 ? 2 : 0);
            if (!sub || tb < sub.t) sub = { s: s, k: k, t: tb };
          }
        }
      });
    });
    nuevos.forEach(function (s) { TR.pie[s].forEach(function (x) { var t = arr[r][s] + minPieKm(x[1]) + 1; if (t < arr[r][x[0]] - 0.01) { arr[r][x[0]] = t; par[r][x[0]] = { tipo: 'pie', desde: s, km: x[1], r: r }; } }); });
    Object.keys(eg).forEach(function (s) { var pr = par[r][s]; if (!pr || pr.tipo === 'acceso') return; var t = arr[r][s] + minPieKm(eg[s]); if (t < mejor.t) mejor = { t: t, s: +s, r: r }; });
    if (!mejoro) break;
  }
  if (mejor.t >= INF) return null;
  var pasos = [{ tipo: 'pie', de: E[mejor.s].ll, a: B, km: eg[mejor.s], min: minPieKm(eg[mejor.s]), desdeEst: mejor.s }], s = mejor.s, rr = mejor.r, guard = 0;
  while (guard++ < 20) {
    var pr = par[rr][s]; if (!pr) break;
    if (pr.tipo === 'acceso') { pasos.unshift({ tipo: 'pie', de: A, a: E[s].ll, km: pr.km, min: minPieKm(pr.km), haciaEst: s }); break; }
    if (pr.tipo === 'viaje') { pasos.unshift(armarViaje(pr, s)); s = pr.desde; rr = pr.r - 1; continue; }
    if (pr.tipo === 'pie') { pasos.unshift({ tipo: 'transbordo', de: E[pr.desde].ll, a: E[s].ll, km: pr.km, min: minPieKm(pr.km), desdeEst: pr.desde, haciaEst: s }); s = pr.desde; rr = pr.r; continue; }
  }
  return { min: mejor.t, pasos: pasos };
}
function armarViaje(pr, aS) {
  var l = TR.L[pr.l], n = Math.abs(pr.ka - pr.kd), km = 0, pts = [];
  for (var k = pr.kd; k !== pr.ka + pr.dir; k += pr.dir) { pts.push(TR.E[l.p[k]].ll); if (k !== pr.kd) km += hav(TR.E[l.p[k - pr.dir]].ll, TR.E[l.p[k]].ll); }
  // cualquier línea del mismo sistema que haga ese mismo tramo sin transbordar
  var alts = {};
  TR.L.forEach(function (x) {
    if (x.s !== l.s) return;
    var a = x.p.indexOf(pr.desde), b = x.p.indexOf(aS); if (a < 0 || b < 0 || Math.abs(b - a) !== n) return;
    var term = TR.E[b > a ? x.p[x.p.length - 1] : x.p[0]].n, key = x.r;
    alts[key] = alts[key] || { r: x.r, c: x.c, term: [] }; if (alts[key].term.indexOf(term) < 0) alts[key].term.push(term);
  });
  var lista = Object.keys(alts).map(function (k) { return alts[k]; }), expreso = false;
  if (l.s === 'ny') {
    var locales = lista.filter(function (a) { return !EXPRESO_NY[a.r]; });
    if (locales.length) lista = locales; else expreso = true;   // solo expresos: se avisa que miren el letrero
  }
  var minV = 0; for (var q = 1; q < pts.length; q++) minV += minTren(hav(pts[q - 1], pts[q]));
  return { tipo: 'viaje', sis: l.s, linea: l, de: pr.desde, a: aS, paradas: n, km: km, min: minV, pts: pts, alts: lista, expreso: expreso };
}

/* ---------- ruta a pie calle por calle (con internet) ---------- */
var MANIOBRA = { left: 'a la izquierda', right: 'a la derecha', 'slight left': 'levemente a la izquierda', 'slight right': 'levemente a la derecha', 'sharp left': 'bien a la izquierda', 'sharp right': 'bien a la derecha', straight: 'derecho', uturn: 'en U' };
function textoPaso(s) {
  var m = s.maneuver, mod = MANIOBRA[m.modifier] || '', por = s.name ? ' por ' + s.name : '';
  if (m.type === 'depart') return 'Sal' + (mod && m.modifier !== 'straight' ? ' ' + mod : '') + por;
  if (m.type === 'arrive') return 'Llegaste' + (m.modifier === 'left' ? ': queda a la izquierda' : m.modifier === 'right' ? ': queda a la derecha' : '');
  if (m.type === 'roundabout' || m.type === 'rotary') return 'En la glorieta, toma la salida ' + (m.exit || '') + por;
  if (m.type === 'fork') return 'En la bifurcación, ve ' + mod + por;
  if (m.modifier === 'straight' || m.type === 'new name' || m.type === 'continue') return 'Sigue derecho' + por;
  if (m.type === 'end of road') return 'Al final, gira ' + mod + por;
  return 'Gira ' + mod + por;
}
function iconoPaso(s) { var m = s.maneuver.modifier || ''; return s.maneuver.type === 'arrive' ? '🏁' : /left/.test(m) ? '↰' : /right/.test(m) ? '↱' : m === 'uturn' ? '⤺' : '↑'; }
function rutaPie(A, B) {
  var clave = 'pie:' + A.map(function (x) { return x.toFixed(4); }) + '>' + B.map(function (x) { return x.toFixed(4); });
  try { var c = JSON.parse(localStorage.getItem(clave) || 'null'); if (c) return Promise.resolve(c); } catch (e) {}
  if (!navigator.onLine) return Promise.resolve(null);
  var ctrl = window.AbortController ? new AbortController() : null, tm = setTimeout(function () { if (ctrl) ctrl.abort(); }, 9000);
  return fetch('https://routing.openstreetmap.de/routed-foot/route/v1/foot/' + A[1] + ',' + A[0] + ';' + B[1] + ',' + B[0] + '?overview=full&steps=true&geometries=geojson', ctrl ? { signal: ctrl.signal } : {})
    .then(function (r) { return r.json(); }).then(function (j) {
      clearTimeout(tm); if (j.code !== 'Ok' || !j.routes.length) return null;
      var rt = j.routes[0], o = { km: rt.distance / 1000, min: rt.duration / 60 * 1.05, pts: rt.geometry.coordinates.map(function (c) { return [+c[1].toFixed(6), +c[0].toFixed(6)]; }),
        pasos: rt.legs[0].steps.filter(function (s) { return s.distance > 3 || s.maneuver.type === 'arrive'; }).map(function (s) { return { t: textoPaso(s), ic: iconoPaso(s), km: s.distance / 1000, ll: [s.maneuver.location[1], s.maneuver.location[0]] }; }) };
      try { localStorage.setItem(clave, JSON.stringify(o)); limpiarCacheRutas(); } catch (e) {}
      return o;
    }).catch(function () { clearTimeout(tm); return null; });
}
function limpiarCacheRutas() { try { var ks = []; for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k.indexOf('pie:') === 0) ks.push(k); } if (ks.length > 40) ks.slice(0, ks.length - 40).forEach(function (k) { localStorage.removeItem(k); }); } catch (e) {} }
function rumboEntre(a, b) { var t = Math.PI / 180, y = Math.sin((b[1] - a[1]) * t) * Math.cos(b[0] * t), x = Math.cos(a[0] * t) * Math.sin(b[0] * t) - Math.sin(a[0] * t) * Math.cos(b[0] * t) * Math.cos((b[1] - a[1]) * t); return (Math.atan2(y, x) / t + 360) % 360; }
function cardinal(g) { return ['norte', 'noreste', 'este', 'sureste', 'sur', 'suroeste', 'oeste', 'noroeste'][Math.round(g / 45) % 8]; }

/* En el celular vertical el panel queda debajo del mapa: desplaza para ver mapa y panel juntos */
function pantallaAngosta() { return innerWidth <= 860 && !(innerWidth > innerHeight && innerHeight <= 540); }
function verPanel() { if (!pantallaAngosta() || tab !== 'mapa') return; var pan = document.getElementById('panel'); window.scrollTo({ top: Math.max(0, pan.getBoundingClientRect().top + scrollY - innerHeight * 0.42), behavior: 'smooth' }); }
function verMapa() { if (!pantallaAngosta()) return; var m = document.querySelector('.mapwrap'); window.scrollTo({ top: Math.max(0, m.getBoundingClientRect().top + scrollY - 64), behavior: 'smooth' }); }

/* ---------- cómo llegar ---------- */
var PLAN = null;
function irA(dest) {
  if (tab !== 'mapa') go('mapa');
  stopTour();
  var pan = document.getElementById('panel');
  pan.innerHTML = '<div class="pad"><span class="pill o">🧭 Cómo llegar</span><h2>' + esc(dest.n) + '</h2><div class="cargador"><i></i>Buscando tu ubicación y la mejor forma de llegar…</div></div>';
  conUbicacion(function (A) {
    var B = dest.ll, d = hav(A, B);
    Promise.all([trListo().catch(function () { return null; }), rutaPie(A, B)]).then(function (res) {
      var transp = res[0] && d > 0.7 ? trRuta(A, B) : null, pie = res[1];
      var minPie = pie ? pie.min : minPieKm(d);
      PLAN = { dest: dest, A: A, B: B, d: d, pie: pie, minPie: minPie, transp: transp };
      if (transp) completarPiesTransporte(transp).then(function () { panelComoLlegar(); });
      panelComoLlegar();
    });
  });
}
/* pide la ruta a pie real para el primer y último tramo del transporte */
function completarPiesTransporte(t) {
  var tareas = t.pasos.map(function (p) { if (p.tipo !== 'pie' || p.km < 0.08) return Promise.resolve(); return rutaPie(p.de, p.a).then(function (r) { if (r) { p.ruta = r; p.min = r.min; p.km = r.km; } }); });
  return Promise.all(tareas).then(function () { t.min = t.pasos.reduce(function (s, p) { return s + (p.tipo === 'viaje' ? SIS_INFO[p.sis].espera + p.min : p.min); }, 0); });
}
function panelComoLlegar() {
  var P0 = PLAN; if (!P0) return;
  var t = P0.transp, recPie = !t || P0.minPie <= t.min + 4 || P0.d < 1.1;
  var h = '<div class="pad"><div class="row spread"><span class="pill o">🧭 Cómo llegar</span><button class="btn sm" id="clVolver">‹ Volver</button></div><h2>' + esc(P0.dest.n) + '</h2><p>Desde donde estás: ' + kmF(P0.d) + ' en línea recta.</p><div class="opciones">';
  h += '<button class="opcion' + (recPie ? ' rec' : '') + '" data-modo="pie"><b>🚶 A pie · ' + durTxt(Math.round(P0.minPie)) + '</b><small>' + kmF(P0.pie ? P0.pie.km : P0.d * 1.25) + (P0.pie ? ' por calles' : ' · sin internet: te guío con dirección y distancia') + '</small>' + (recPie ? '<span class="pill g">Recomendado</span>' : '') + '</button>';
  if (t) {
    var viajes = t.pasos.filter(function (p) { return p.tipo === 'viaje'; }), sis = viajes[0].sis;
    h += '<button class="opcion' + (!recPie ? ' rec' : '') + '" data-modo="tr"><b>🚇 ' + esc(SIS_INFO[sis].n) + ' · ' + durTxt(Math.round(t.min)) + '</b><small>' + viajes.map(function (v) { return v.alts.map(function (a) { return chipLinea(v.sis, a.r, a.c); }).join(''); }).join(' → ') + ' · ' + tarifa(sis, null, viajes.reduce(function (s, v) { return s + v.km; }, 0)).txt + ' c/u</small>' + (!recPie ? '<span class="pill g">Recomendado</span>' : '') + '</button>';
  } else if (P0.d > 2) h += '<div class="warn">No hay metro o tren cerca de los dos puntos. Para esta distancia usen Uber.</div>';
  h += '</div><div id="clDetalle"></div><div class="row mt"><a class="btn" href="https://www.google.com/maps/dir/?api=1&origin=' + P0.A.join(',') + '&destination=' + P0.B.join(',') + '&travelmode=transit" target="_blank" rel="noopener">🕒 Horarios en vivo (Google Maps) ↗</a><a class="btn" href="https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[latitude]=' + P0.B[0] + '&dropoff[longitude]=' + P0.B[1] + '&dropoff[nickname]=' + encodeURIComponent(P0.dest.n) + '" target="_blank" rel="noopener">🚕 Uber ↗</a></div></div>';
  var pan = document.getElementById('panel'); pan.innerHTML = h; pan.scrollTop = 0;
  document.getElementById('clVolver').onclick = function () { navTerminar(true); if (P0.dest.i != null) showPlace(P0.dest.i); else showCity(cur); };
  [].forEach.call(pan.querySelectorAll('[data-modo]'), function (b) { b.onclick = function () { detalleModo(b.dataset.modo); }; });
  detalleModo(recPie ? 'pie' : 'tr');
  verPanel();
}
function detalleModo(modo) {
  var P0 = PLAN, det = document.getElementById('clDetalle'); if (!det) return;
  [].forEach.call(document.querySelectorAll('[data-modo]'), function (b) { b.classList.toggle('on', b.dataset.modo === modo); });
  var h = '';
  if (modo === 'pie') {
    if (P0.pie) h += '<ol class="pasos">' + P0.pie.pasos.map(function (s) { return '<li><i>' + s.ic + '</i><span>' + esc(s.t) + '</span><small>' + (s.km > 0.005 ? kmF(s.km) : '') + '</small></li>'; }).join('') + '</ol>';
    else h += '<div class="box">🧭 Camina hacia el <b>' + cardinal(rumboEntre(P0.A, P0.B)) + '</b>, unos ' + kmF(P0.d * 1.25) + '. En la navegación verás una flecha que apunta al destino.</div>';
  } else {
    var t = P0.transp, sisV = null, kmV = 0;
    h += '<ol class="pasos tr">';
    t.pasos.forEach(function (p, k) {
      if (p.tipo === 'pie') {
        var haciaE = p.haciaEst != null ? TR.E[p.haciaEst] : null;
        h += '<li><i>🚶</i><span>' + (haciaE ? 'Camina hasta la estación <b>' + esc(haciaE.n) + '</b>' : 'Camina hasta <b>' + esc(P0.dest.n) + '</b>') + '</span><small>' + kmF(p.km) + ' · ' + durTxt(Math.round(p.min)) + '</small></li>';
      } else if (p.tipo === 'transbordo') h += '<li><i>🔄</i><span>Cambia de andén: camina a <b>' + esc(TR.E[p.haciaEst].n) + '</b></span><small>' + durTxt(Math.round(p.min)) + '</small></li>';
      else {
        sisV = p.sis; kmV += p.km;
        var lineas = p.alts.map(function (a) { return chipLinea(p.sis, a.r, a.c); }).join(' '), terms = [];
        p.alts.forEach(function (a) { a.term.forEach(function (x) { if (terms.indexOf(x) < 0) terms.push(x); }); });
        h += '<li class="viaje"><i>🚇</i><span>' + (p.expreso ? '<em class="aviso">⚡ Tren expreso: confirmen en el letrero del andén que pare en ' + esc(TR.E[p.a].n) + '.</em><br>' : '') + 'Toma ' + (p.alts.length > 1 ? 'cualquiera de estas: ' : '') + lineas + '<br>dirección <b>' + esc(terms.join(' o ')) + '</b><br>' + p.paradas + ' parada' + (p.paradas > 1 ? 's' : '') + ' · bájate en <b>' + esc(TR.E[p.a].n) + '</b></span><small>~' + durTxt(Math.round(p.min + SIS_INFO[p.sis].espera)) + '</small></li>';
      }
    });
    var tf = tarifa(sisV, null, kmV);
    h += '</ol><div class="box o"><h4>💵 ' + tf.txt + ' por persona</h4>' + esc(tf.nota) + '. ' + esc(SIS_INFO[sisV].pago) + '</div><p class="gnota">Rutas y estaciones de OpenStreetMap; tarifas verificadas en las páginas oficiales (oct. 2026). Para horarios exactos en vivo usen Google Maps.</p>';
  }
  h += '<div class="row mt"><button class="btn or gbig" id="clIr">▶ Empezar a navegar</button></div>';
  det.innerHTML = h;
  document.getElementById('clIr').onclick = function () { navEmpezar(modo); };
  dibujarPlan(modo);
}

/* ruta del plan dibujada en el satélite */
var planCapa = null;
function dibujarPlan(modo) {
  if (!lmap || !PLAN || !window.L) return;
  if (planCapa) lmap.removeLayer(planCapa);
  if (lroute) { lmap.removeLayer(lroute); lroute = null; }            // sin la ruta de la ciudad, para que se vea claro
  if (legLayer) { lmap.removeLayer(legLayer); legLayer = null; }
  planCapa = L.layerGroup().addTo(lmap);
  var pts = [];
  if (modo === 'pie') { pts = PLAN.pie ? PLAN.pie.pts : [PLAN.A, PLAN.B]; L.polyline(pts, { color: '#1A73E8', weight: 6, opacity: .9, dashArray: PLAN.pie ? null : '2 10', lineCap: 'round' }).addTo(planCapa); }
  else PLAN.transp.pasos.forEach(function (p) {
    var q = p.tipo === 'viaje' ? p.pts : (p.ruta ? p.ruta.pts : [p.de, p.a]);
    pts = pts.concat(q);
    L.polyline(q, p.tipo === 'viaje' ? { color: p.linea.c, weight: 7, opacity: .95 } : { color: '#1A73E8', weight: 5, dashArray: '1 9', lineCap: 'round' }).addTo(planCapa);
    if (p.tipo === 'viaje') [p.de, p.a].forEach(function (s) { L.circleMarker(TR.E[s].ll, { radius: 7, color: '#fff', weight: 3, fillColor: p.linea.c, fillOpacity: 1 }).bindTooltip(TR.E[s].n).addTo(planCapa); });
  });
  L.marker(PLAN.B, { icon: L.divIcon({ className: '', html: '<div class="destpin">' + (PLAN.dest.casa ? '🏠' : '🏁') + '</div>', iconSize: [34, 34], iconAnchor: [17, 30] }) }).addTo(planCapa);
  lmap.invalidateSize(); lmap.flyToBounds(L.latLngBounds(pts.concat([PLAN.A])).pad(.2), { duration: .8, maxZoom: 17 });
}

/* ---------- navegación en vivo ---------- */
var NAV = null, wakeLock = null, vozOn = false, LLEGADA = 0.06;   // a 60 m ya llegaron (el GPS tiene margen)
try { vozOn = localStorage.getItem('guiaVoz') === '1'; } catch (e) {}
function navEmpezar(modo) {
  var P0 = PLAN; if (!P0) return;
  var pasos = [];
  if (modo === 'pie') {
    if (P0.pie) P0.pie.pasos.forEach(function (s) { pasos.push({ t: s.t, ic: s.ic, ll: s.ll, km: s.km }); });
    pasos.push({ t: 'Llegaste a ' + P0.dest.n, ic: '🏁', ll: P0.B, fin: true });
  } else P0.transp.pasos.forEach(function (p) {
    if (p.tipo === 'pie') {
      if (p.ruta) p.ruta.pasos.forEach(function (s) { if (s.ic !== '🏁') pasos.push({ t: s.t, ic: s.ic, ll: s.ll, km: s.km }); });
      pasos.push(p.haciaEst != null ? { t: 'Entra a la estación ' + TR.E[p.haciaEst].n, ic: '🚇', ll: TR.E[p.haciaEst].ll } : { t: 'Llegaste a ' + P0.dest.n, ic: '🏁', ll: P0.B, fin: true });
    } else if (p.tipo === 'transbordo') pasos.push({ t: 'Cambia a la estación ' + TR.E[p.haciaEst].n, ic: '🔄', ll: TR.E[p.haciaEst].ll });
    else {
      var terms = []; p.alts.forEach(function (a) { a.term.forEach(function (x) { if (terms.indexOf(x) < 0) terms.push(x); }); });
      pasos.push({ t: 'Toma ' + p.alts.map(function (a) { return SIS_INFO[p.sis].linea(a.r); }).join(' o ') + ' dirección ' + terms.join(' o '), ic: '🚇', ll: TR.E[p.de].ll, lineas: p.alts, sis: p.sis });
      pasos.push({ t: 'Bájate en ' + TR.E[p.a].n + ' (' + p.paradas + ' parada' + (p.paradas > 1 ? 's' : '') + ')', ic: '⏏', ll: TR.E[p.a].ll, viaje: true });
    }
  });
  NAV = { modo: modo, pasos: pasos, i: 0, dest: P0.dest, B: P0.B, fuera: 0, inicio: Date.now(), dijo: {} };
  seguir = true; var fy = document.getElementById('fabYo'); if (fy) fy.classList.add('on');
  document.body.classList.add('navegando');
  if ('wakeLock' in navigator) navigator.wakeLock.request('screen').then(function (w) { wakeLock = w; }).catch(function () {});
  brujulaActivar();
  if (lmap && UB.ll) lmap.flyTo(UB.ll, 17, { duration: .6 });
  navActualizar(); verMapa(); toast('▶ Navegación iniciada');
}
function navTerminar(silencio) {
  if (!NAV) return; NAV = null; document.body.classList.remove('navegando');
  var b = document.getElementById('navBanner'); if (b) b.hidden = true;
  if (wakeLock) { wakeLock.release().catch(function () {}); wakeLock = null; }
  if (planCapa && lmap) { lmap.removeLayer(planCapa); planCapa = null; }
  seguir = false; var fy = document.getElementById('fabYo'); if (fy) fy.classList.remove('on');
  if (!silencio) toast('Navegación terminada');
}
function decir(t) { if (!vozOn || !('speechSynthesis' in window)) return; try { speechSynthesis.cancel(); var u = new SpeechSynthesisUtterance(t); u.lang = 'es-ES'; u.rate = 1; speechSynthesis.speak(u); } catch (e) {} }
function navActualizar() {
  if (!NAV) return;
  var b = document.getElementById('navBanner'); if (!b) return;
  var me = UB.ll, p = NAV.pasos[NAV.i];
  if (me && p) {
    var dPaso = hav(me, p.ll), dFin = hav(me, NAV.B);
    if (dFin < LLEGADA) { NAV.i = NAV.pasos.length - 1; p = NAV.pasos[NAV.i]; }
    else if (dPaso < (p.viaje ? 0.15 : 0.025) && NAV.i < NAV.pasos.length - 1) { NAV.i++; p = NAV.pasos[NAV.i]; if (navigator.vibrate) navigator.vibrate(60); }
    if (!NAV.dijo[NAV.i]) { NAV.dijo[NAV.i] = 1; decir(p.t); }
  }
  var dP = me ? hav(me, p.ll) : null, dF = me ? hav(me, NAV.B) : null;
  var resto = 0; for (var k = NAV.i + 1; k < NAV.pasos.length; k++) resto += NAV.pasos[k].km || 0;
  b.hidden = false;
  b.innerHTML = '<div class="nb-ic">' + (p.fin && dF != null && dF < LLEGADA ? '🎉' : p.ic) + '</div><div class="nb-tx"><b>' + esc(p.fin && dF != null && dF < LLEGADA ? '¡Llegaste a ' + NAV.dest.n + '!' : p.t) + '</b><small>' + (dP != null ? (p.viaje ? 'Faltan ' + kmF(dP) + ' en el tren' : 'en ' + kmF(dP)) : 'Esperando tu ubicación…') + (dF != null ? ' · destino a ' + kmF(dF) : '') + '</small>' + (p.lineas ? '<div>' + p.lineas.map(function (a) { return chipLinea(p.sis, a.r, a.c); }).join('') + '</div>' : '') + '</div>' +
    '<div class="nb-arrow" id="navFlecha" title="Dirección al destino">➤</div><div class="nb-btns"><button id="nbVoz" aria-label="Voz">' + (vozOn ? '🔊' : '🔈') + '</button>' + (NAV.i < NAV.pasos.length - 1 ? '<button id="nbSig" aria-label="Siguiente paso">›</button>' : '') + '<button id="nbFin" aria-label="Terminar">✕</button></div>';
  document.getElementById('nbFin').onclick = function () { navTerminar(); showCity(cur); };
  document.getElementById('nbVoz').onclick = function () { vozOn = !vozOn; try { localStorage.setItem('guiaVoz', vozOn ? '1' : '0'); } catch (e) {} navActualizar(); if (vozOn) decir(p.t); };
  var sg = document.getElementById('nbSig'); if (sg) sg.onclick = function () { NAV.i = Math.min(NAV.pasos.length - 1, NAV.i + 1); navActualizar(); };
  navFlecha();
  if (p.fin && dF != null && dF < LLEGADA && !NAV.llego) { NAV.llego = true; if (navigator.vibrate) navigator.vibrate([80, 60, 80]); decir('Llegaste a ' + NAV.dest.n); setTimeout(function () { if (NAV && NAV.llego) navTerminar(true); }, 15000); }
}
function navFlecha() {
  var f = document.getElementById('navFlecha'); if (!f || !NAV || !UB.ll) return;
  var p = NAV.pasos[NAV.i], g = rumboEntre(UB.ll, p.ll), h = BRUJ.v != null ? BRUJ.v : (UB.rumbo != null ? UB.rumbo : 0);
  f.style.transform = 'rotate(' + Math.round(g - h - 90) + 'deg)';
  f.title = 'Hacia el ' + cardinal(g);
}

/* ---------- estaciones en el satélite ---------- */
var capaEst = null, estPuestas = {};
/* Solo dibuja las estaciones que se ven, y solo con zoom de barrio (14 o más): el mapa abre más rápido */
function capaEstaciones() {
  if (!lmap || !window.L || capaEst) return;
  capaEst = L.layerGroup();
  var ver = function () {
    if (lmap.getZoom() < 14) { if (lmap.hasLayer(capaEst)) lmap.removeLayer(capaEst); return; }
    trListo().then(function () {
      var bb = lmap.getBounds().pad(.3);
      TR.E.forEach(function (e) {
        if (estPuestas[e.i] || !bb.contains(e.ll)) return;
        estPuestas[e.i] = 1;
        var ls = lineasDe(e);
        L.circleMarker(e.ll, { radius: 6, color: '#fff', weight: 2, fillColor: ls.length ? ls[0].c : '#4A6A80', fillOpacity: 1 })
          .bindTooltip('🚇 ' + e.n, { direction: 'top' })
          .bindPopup(function () { return '<b>🚇 ' + esc(e.n) + '</b><br>' + ls.map(function (l) { return chipLinea(e.s, l.r, l.c); }).join('') + '<br><button class="btn sm or" data-irest="' + e.i + '">🧭 Ir a esta estación</button>'; })
          .addTo(capaEst);
      });
      if (!lmap.hasLayer(capaEst)) capaEst.addTo(lmap);
    });
  };
  lmap.on('zoomend moveend', ver);
  lmap.on('popupopen', function (ev) { var bt = ev.popup.getElement().querySelector('[data-irest]'); if (bt) bt.onclick = function () { var e = TR.E[+bt.dataset.irest]; lmap.closePopup(); irA({ ll: e.ll, n: 'Estación ' + e.n }); }; });
  ver();
}

/* ---------- recomendaciones según dónde estén ---------- */
function recomendaciones(ll) {
  var h = new Date().getHours() + new Date().getMinutes() / 60;
  var cerca = P.map(function (p, i) { return { i: i, k: hav(ll, p.ll) }; }).filter(function (x) { var p = P[x.i]; return p.cat !== 'transporte' && p.cat !== 'nieve' && !VIS[x.i]; }).sort(function (a, b) { return a.k - b.k; });
  var grupos = [];
  grupos.push({ t: '📍 Lo más cerca que no han visitado', l: cerca.slice(0, 3) });
  if ((h >= 11 && h < 14.5) || (h >= 17.5 && h < 21)) grupos.push({ t: '🍽️ Para comer cerca', l: cerca.filter(function (x) { return P[x.i].cat === 'comer'; }).slice(0, 2) });
  if (h >= 15 && h < 17) grupos.push({ t: '🌅 Atardecer cerca (el sol se pone ~4:50 p. m.)', l: cerca.filter(function (x) { return /atardecer/i.test(P[x.i].h); }).slice(0, 2) });
  if (h >= 17 && h < 23) grupos.push({ t: '🌃 Bonito de noche', l: cerca.filter(function (x) { return /noche|iluminad/i.test(P[x.i].h + P[x.i].txt); }).slice(0, 2) });
  return grupos.filter(function (g) { return g.l.length; });
}
function filaReco(x) { var p = P[x.i]; return '<li><button data-ir="' + x.i + '"><span class="num' + (p.core ? '' : ' x') + '">' + emo(p) + '</span><span><b>' + esc(p.n) + '</b><small>' + (x.k <= 2 ? '🚶 ' + walk(x.k) : '🚇 ' + kmF(x.k)) + ' · ' + esc(CITYNAME[p.c]) + ' · ' + esc(p.h) + '</small></span><span class="price">Ir ›</span></button></li>'; }
function renderParaTi(el) {
  if (!el) return;
  if (!ubicActiva()) {
    el.innerHTML = '<div class="paratit"><span>✨</span><div><h3>Para ti, ahora</h3><p>Activa la ubicación y te recomiendo lugares cercanos, la estación más cercana y cómo volver a casa.</p></div></div><div class="row"><button class="btn or" id="ptAct">📍 Activar ubicación</button><button class="btn" id="ptCasa">🏠 ' + (casa() ? 'Volver a casa' : 'Guardar la casa') + '</button></div>';
    document.getElementById('ptAct').onclick = function () { conUbicacion(function () { renderParaTi(document.getElementById('paraTi')); }); };
    document.getElementById('ptCasa').onclick = volverACasa;
    if (UB.watch !== null) { var f = function () { UB.subs = UB.subs.filter(function (x) { return x !== f; }); renderParaTi(document.getElementById('paraTi')); }; UB.subs.push(f); }
    return;
  }
  var ll = UB.ll, g = recomendaciones(ll), c = casa();
  var h = '<div class="paratit"><span>✨</span><div><h3>Para ti, ahora</h3><p>Según dónde estás' + (Object.keys(VIS).length ? ' · ' + Object.keys(VIS).length + (Object.keys(VIS).length === 1 ? ' lugar visitado ✓' : ' lugares visitados ✓') : '') + '</p></div></div>';
  h += '<div id="ptEst" class="ptest"></div>';
  g.forEach(function (x) { h += '<h4 class="gh4">' + x.t + '</h4><ul class="places">' + x.l.map(filaReco).join('') + '</ul>'; });
  h += '<div class="row mt"><button class="btn pri" id="ptCasa">🏠 ' + (c ? 'Volver a casa' : 'Guardar la casa') + '</button><button class="btn" id="ptMapa">🗺️ Ver en el mapa</button></div>';
  el.innerHTML = h;
  [].forEach.call(el.querySelectorAll('[data-ir]'), function (b) { b.onclick = function () { var i = +b.dataset.ir; irA({ ll: P[i].ll, n: P[i].n, i: i }); }; });
  document.getElementById('ptCasa').onclick = volverACasa;
  document.getElementById('ptMapa').onclick = function () { go('mapa'); setTimeout(cercaDeMi, 300); };
  trListo().then(function () {
    var est = estacionesCerca(ll, 2, 1)[0], box = document.getElementById('ptEst'); if (!box) return;
    if (!est) { box.innerHTML = ''; return; }
    box.innerHTML = '<button class="estbtn" id="ptEstB"><span>🚇</span><span><b>' + esc(est.e.n) + '</b><small>Estación más cercana · ' + walk(est.k) + ' a pie</small></span><span>' + lineasDe(est.e).map(function (l) { return chipLinea(est.e.s, l.r, l.c); }).join('') + '</span></button>';
    document.getElementById('ptEstB').onclick = function () { irA({ ll: est.e.ll, n: 'Estación ' + est.e.n }); };
  });
}

/* refresca “Para ti, ahora” cuando cambia la ubicación (máximo cada 45 s) */
var _ptT = 0;
UB.subs.push(function () { if (tab === 'inicio' && Date.now() - _ptT > 45000) { _ptT = Date.now(); renderParaTi(document.getElementById('paraTi')); } });
