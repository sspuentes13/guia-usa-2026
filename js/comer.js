/* JD & Santi On Tour · pestaña Comer: restaurantes baratos y con buena experiencia, cerca de cada día del plan */

var comerCiudad = 'todo', comerAbierto = false;
var CIUDAD_REST = { dc: 'Washington DC', arl: 'Arlington y Old Town', ny: 'Nueva York', bal: 'Baltimore', phi: 'Filadelfia', del: 'Delaware' };

function diasRest(s) { var o = []; String(s).split(',').forEach(function (x) { var r = x.split('-'); for (var d = +r[0]; d <= +(r[1] || r[0]); d++) o.push(d); }); return o; }
/* ¿Abierto ese día de la semana a esa hora (en horas)? null = sin dato */
function restAbierto(r, dow, h) {
  if (!r.hs) return null;
  for (var k = 0; k < r.hs.length; k++) {
    var x = r.hs[k], ds = diasRest(x[0]);
    if (ds.indexOf(dow) > -1 && h >= x[1] && h < x[2]) return true;
    if (x[2] > 24 && ds.indexOf((dow + 6) % 7) > -1 && h < x[2] - 24) return true;   // abierto desde la noche anterior
  }
  return false;
}
function restAbreEseDia(r, dow) { if (!r.hs) return null; return r.hs.some(function (x) { return diasRest(x[0]).indexOf(dow) > -1; }); }
function horaAhoraET() { var d = new Date(); return d.getHours() + d.getMinutes() / 60; }

/* Lugar del plan más cercano a un restaurante (para decir "cerca de …, Día N") */
function restCercaDe(r) {
  var mejor = null;
  P.forEach(function (p, i) {
    if (p.cat === 'transporte' || p.snow || !diasDe(p).length) return;
    var k = hav(r.ll, p.ll); if (k <= 1.3 && (!mejor || k < mejor.k)) mejor = { i: i, k: k };
  });
  return mejor;
}
/* Restaurantes cerca de la ruta de un día y abiertos ese día */
function restDelDia(n, max) {
  var r = rutaDia(n), ids = r.ids.filter(function (i) { return P[i].cat !== 'transporte'; }), dow = fechaDia(n).getDay();
  if (!ids.length) return [];
  return RESTAURANTES.map(function (x, k) {
    var d = Math.min.apply(0, ids.map(function (i) { return hav(x.ll, P[i].ll); }));
    return { k: k, d: d };
  }).filter(function (o) { return o.d <= 1.0 && restAbreEseDia(RESTAURANTES[o.k], dow) !== false; })
    .sort(function (a, b) { return a.d - b.d; }).slice(0, max || 3);
}

function tarjetaRest(r, k, ref) {
  var ahora = new Date(), enViaje = typeof diaDeHoy === 'function' && diaDeHoy() >= 3 && diaDeHoy() <= 24;
  var ab = enViaje ? restAbierto(r, ahora.getDay(), horaAhoraET()) : null, cerca = restCercaDe(r);
  var dist = ref ? hav(ref, r.ll) : null;
  return '<article class="rest"><div class="rest-e">' + r.e + '</div><div class="rest-b"><div class="rest-h"><b>' + esc(r.n) + '</b><span class="pill o">' + esc(r.p) + '</span>' + (ab === true ? '<span class="pill g">● Abierto</span>' : ab === false ? '<span class="pill">Cerrado ahora</span>' : '') + '</div>' +
    '<small class="rest-z">📍 ' + esc(r.z) + ' · ' + esc(r.dir) + (dist != null ? ' · a ' + kmF(dist) : '') + '</small>' +
    '<p><b>Pidan:</b> ' + esc(r.pide) + '</p><p class="rest-por">' + esc(r.por) + '</p>' +
    '<small>🕘 ' + esc(r.ht) + (r.conf ? ' <i>(confirmen cerca de la fecha)</i>' : '') + '</small>' +
    (cerca ? '<small>🗓️ Cerca de <b>' + esc(P[cerca.i].n) + '</b> · Día ' + diasDe(P[cerca.i]).join(' y ') + ' (' + fechaCorta(diasDe(P[cerca.i])[0]) + ')</small>' : '') +
    '<div class="row"><button class="btn sm or" data-ir="' + k + '">🧭 Cómo llegar</button><a class="btn sm" href="https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(r.n + ' ' + r.dir) + '" target="_blank" rel="noopener">Google Maps ↗</a></div></div></article>';
}

function renderComer() {
  var ref = typeof UB !== 'undefined' && UB.ll && Date.now() - (UB.t || 0) < 6e5 ? UB.ll : null;
  var h = '<h2 class="big">Comer rico y barato</h2><p class="lead">Lugares con buena experiencia y precio de mochilero, verificados para noviembre de 2026. Cada uno con qué pedir, horario y cómo llegar.</p>';
  // para hoy o el próximo día de paseo
  var n = typeof diaDeHoy === 'function' ? diaDeHoy() : 0, dias = diasConLugares(), prox = dias.filter(function (x) { return x >= Math.max(n, 1); })[0];
  if (prox) {
    var L = restDelDia(prox, 4);
    if (L.length) h += '<div class="card paraTi"><div class="paratit"><span>🍽️</span><div><h3>' + (prox === n ? 'Para hoy' : 'Para el próximo paseo') + ' · Día ' + prox + ' (' + fechaCorta(prox) + ')</h3><p>' + esc(diaDeN(prox).title) + ': abiertos ese día y a menos de 1 km de la ruta</p></div></div><div class="restmini">' +
      L.map(function (o) { var r = RESTAURANTES[o.k]; return '<button data-ir="' + o.k + '"><span>' + r.e + '</span><b>' + esc(r.n) + '</b><small>' + esc(r.p) + ' · a ' + kmF(o.d) + ' de la ruta</small></button>'; }).join('') + '</div></div>';
  }
  h += '<div class="chips comerchips">' + ['todo'].concat(Object.keys(CIUDAD_REST)).map(function (c) { return '<button class="chip' + (comerCiudad === c ? ' on' : '') + '" data-cc="' + c + '">' + (c === 'todo' ? '🍴 Todo' : esc(CIUDAD_REST[c])) + '</button>'; }).join('') +
    '<button class="chip' + (comerAbierto ? ' on' : '') + '" id="comerAb">● Abierto ahora</button></div>';
  var lista = RESTAURANTES.map(function (r, k) { return { r: r, k: k }; }).filter(function (o) { return comerCiudad === 'todo' || o.r.c === comerCiudad; });
  if (comerAbierto) { var d = new Date(); lista = lista.filter(function (o) { return restAbierto(o.r, d.getDay(), horaAhoraET()) !== false; }); }
  if (ref) lista.sort(function (a, b) { return hav(ref, a.r.ll) - hav(ref, b.r.ll); });
  var grupos = {}; lista.forEach(function (o) { var g = ref ? 'cerca' : o.r.c; (grupos[g] = grupos[g] || []).push(o); });
  Object.keys(grupos).forEach(function (g) {
    h += '<h3 class="gh3 comerg">' + (g === 'cerca' ? '📍 Más cerca de ti' : esc(CIUDAD_REST[g])) + ' <small>' + grupos[g].length + '</small></h3><div class="restgrid">' + grupos[g].map(function (o) { return tarjetaRest(o.r, o.k, ref); }).join('') + '</div>';
  });
  if (!lista.length) h += '<div class="card"><p>Nada abierto con ese filtro ahora mismo.</p></div>';
  // supermercados y platos típicos
  h += '<div class="card"><h3 class="gh3">🛒 Para comer en casa (lo más barato)</h3>' + MERCADOS.map(function (m) { return '<div class="phr"><div><b>' + esc(m.n) + '</b><small>' + esc(m.dir) + ' · ' + esc(m.nota) + '</small></div><button class="say" data-irm="' + MERCADOS.indexOf(m) + '" aria-label="Cómo llegar">🧭</button></div>'; }).join('') + '</div>';
  h += '<div class="card"><h3 class="gh3">🗣️ Platos típicos y cómo pedirlos</h3>';
  ['dc', 'arl', 'ny', 'bal', 'phi', 'del', 'col'].forEach(function (c) {
    FOOD.filter(function (x) { return x.c === c; }).forEach(function (x) { h += '<div class="phr"><div><b>' + esc(x.w) + ' <span class="pill o">~US$' + x.p + ' c/u · ' + fmt(x.p * g, 'USD') + ' para ' + g + '</span></b><small>' + esc(CITYNAME[c]) + ' · ' + esc(x.d) + ' · ' + esc(x.t) + '</small>' + (x.en ? '<small><i>“' + esc(x.en) + '”</i></small>' : '') + '</div>' + (x.en ? '<button class="say" data-say="' + esc(x.en) + '" aria-label="Escuchar">🔊</button>' : '<span></span>') + '</div>'; });
  });
  h += '</div><p class="warn">🚫 Cerrados (no vayan aunque salgan en guías viejas): ' + CERRADOS.map(esc).join(' · ') + '.<br>💵 En restaurantes con mesero se deja 15–20 % de propina; en mostradores y food trucks es opcional. Los precios son aproximados por persona.</p>';
  var el = document.getElementById('v-comer'); el.innerHTML = h; bindSay('v-comer');
  [].forEach.call(el.querySelectorAll('[data-cc]'), function (b) { b.onclick = function () { comerCiudad = b.dataset.cc; renderComer(); }; });
  document.getElementById('comerAb').onclick = function () { comerAbierto = !comerAbierto; renderComer(); };
  [].forEach.call(el.querySelectorAll('[data-ir]'), function (b) { b.onclick = function () { irRest(+b.dataset.ir); }; });
  [].forEach.call(el.querySelectorAll('[data-irm]'), function (b) { b.onclick = function () { var m = MERCADOS[+b.dataset.irm]; go('mapa'); setTimeout(function () { irA({ ll: m.ll, n: m.n }); }, 200); }; });
}
function irRest(k) { var r = RESTAURANTES[k]; go('mapa'); setTimeout(function () { irA({ ll: r.ll, n: r.n }); }, 200); }
