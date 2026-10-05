/* Guía USA · pestaña Días: tarjetas por día con su ruta por cercanía y vista de análisis */

function numerosDia(d) { var p = String(d.n).split('–'), a = +p[0], z = +(p[1] || p[0]), o = []; for (var i = a; i <= z; i++) o.push(i); return o; }
/* Ruta con lugares de un día del itinerario (los días dobles toman el primero que tenga) */
function rutaDeTarjeta(d) {
  var ns = numerosDia(d);
  for (var k = 0; k < ns.length; k++) {
    var r = rutaDia(ns[k]);
    if (!r.viaje && r.ids.filter(function (i) { return P[i].cat !== 'transporte'; }).length) return r;
  }
  return null;
}
function costoDiaCOP(d) { return d.items.reduce(function (s, i) { return s + cost(i, g) * (i.cur === 'USD' ? RATE : 1); }, 0); }
function tipoDia(d, r) {
  if (d.city === 'col' || /vuelo|aeropuerto|dulles/i.test(d.title + ' ' + d.short)) return { t: 'Viaje', e: '✈️', c: 'o' };
  if (!r) return { t: 'Descanso', e: '🛋️', c: 'g' };
  return { t: 'Paseo', e: '🚶', c: 's' };
}

function renderDias() {
  var h = '<h2 class="big">Día a día</h2><p class="lead">Escojan según el día y la energía. Cada día trae su ruta ordenada por cercanía: lo que tiene hora fija (amanecer, atardecer, tours) se respeta.</p>';
  h += '<div class="row dtools"><div class="toggle2" role="group" aria-label="Vista"><button data-m="res"' + (daysMode === 'res' ? ' class="on"' : '') + '>Resumido</button><button data-m="full"' + (daysMode === 'full' ? ' class="on"' : '') + '>Completo</button><button data-m="ana"' + (daysMode === 'ana' ? ' class="on"' : '') + '>📊 Análisis</button></div>';
  if (daysMode !== 'ana') h += '<div class="toggle2" role="group" aria-label="Energía"><button data-e="alta"' + (energy === 'alta' ? ' class="on"' : '') + '>⚡ Alta</button><button data-e="media"' + (energy === 'media' ? ' class="on"' : '') + '>🙂 Media</button><button data-e="baja"' + (energy === 'baja' ? ' class="on"' : '') + '>😴 Baja</button></div>';
  h += '</div>';
  if (daysMode === 'ana') h += analisisHTML();
  else DAYS.forEach(function (d, k) { h += tarjetaDia(d, k); });
  h += totBar();
  var el = document.getElementById('v-dias'); el.innerHTML = h;
  [].forEach.call(el.querySelectorAll('[data-m]'), function (b) { b.onclick = function () { daysMode = b.dataset.m; save(); renderDias(); }; });
  [].forEach.call(el.querySelectorAll('[data-e]'), function (b) { b.onclick = function () { energy = b.dataset.e; save(); renderDias(); toast('Energía ' + energy + ': opciones resaltadas'); }; });
  [].forEach.call(el.querySelectorAll('.dh'), function (x) { var f = function () { x.parentNode.classList.toggle('open'); }; x.onclick = f; x.onkeydown = function (e) { if (e.key === 'Enter') f(); }; });
  [].forEach.call(el.querySelectorAll('[data-map]'), function (b) { b.onclick = function (e) { e.stopPropagation(); go('mapa'); dayFilter = null; showCity(b.dataset.map); }; });
  [].forEach.call(el.querySelectorAll('[data-ruta]'), function (b) { b.onclick = function (e) { e.stopPropagation(); verRutaDia(+b.dataset.ruta); }; });
  [].forEach.call(el.querySelectorAll('[data-pl]'), function (b) { b.onclick = function (e) { e.stopPropagation(); showPlace(+b.dataset.pl); }; });
}

function tarjetaDia(d, k) {
  var go = ['col', 'ny', 'bal', 'phi', 'del'].indexOf(d.city) > -1, r = rutaDeTarjeta(d), it = r ? intensidad(r) : null, tipo = tipoDia(d, r);
  var h = '<article class="day' + (go ? ' go' : '') + (daysMode === 'full' ? ' open' : '') + '" data-k="' + k + '"><div class="dh" role="button" tabindex="0"><div class="dn"><small>' + (d.n.indexOf('–') > -1 ? 'Días' : 'Día') + '</small><b>' + d.n + '</b></div><div><h3>' + esc(d.title) + '</h3><p>' + esc(d.date) + ' · ' + esc(CITYNAME[d.city]) + ' · ' + esc(d.short) + '</p>' +
    '<div class="dtags"><span class="pill ' + tipo.c + '">' + tipo.e + ' ' + tipo.t + '</span>' + (r ? '<span class="pill ' + it.c + '">' + it.e + ' ' + it.t + '</span><span class="pill">🚶 ' + kmF(r.cerca.kmPie) + '</span>' + (function () { var c = cronogramaDia(r.n); return c.avisos ? '<span class="pill r">⚠️ ' + c.avisos + ' aviso' + (c.avisos > 1 ? 's' : '') + '</span>' : '<span class="pill g">🕘 ' + hhmm(c.items[0] ? c.items[0].ini : 540) + '–' + hhmm(c.fin) + '</span>'; })() : '') + (d.w ? '<span class="pill">🌡️ ' + esc(d.w) + '</span>' : '') + '</div></div><div class="cost">' + dayCost(d) + '</div></div><div class="db">';
  h += '<div class="en3"><div' + (energy === 'alta' ? ' class="on"' : '') + '><small>⚡ ENERGÍA ALTA</small>' + esc(d.alta) + '</div><div' + (energy === 'media' ? ' class="on"' : '') + '><small>🙂 MEDIA</small>' + esc(d.media) + '</div><div' + (energy === 'baja' ? ' class="on"' : '') + '><small>😴 BAJA</small>' + esc(d.baja) + '</div></div>';
  h += '<div class="mt"><ul class="tl">' + d.acts.map(function (a) { return '<li><b>' + esc(a[0]) + '</b><span>' + esc(a[1]) + '</span></li>'; }).join('') + '</ul></div>';
  if (r) {
    var R = r.cerca, vistos = {};
    h += '<div class="box rutadia mt"><h4>🕘 Cronograma sugerido · Día ' + r.n + '</h4>' + cronogramaHTML(r.n, true) + '<h4 class="mt">🧭 Orden por cercanía</h4><ol class="mini">' + R.orden.map(function (i, j) {
      var reg = vistos[i]; vistos[i] = 1; var f = reg ? null : horaFija(P[i], r.n);
      return '<li><button data-pl="' + i + '"><i>' + (reg ? '↩' : j + 1) + '</i>' + esc(P[i].n) + (f ? ' <small>⏰' + horaTxt(f.t) + '</small>' : '') + '</button></li>';
    }).join('') + '</ol>';
    h += '<p class="rnota">🚶 ' + kmF(R.kmPie) + ' a pie (' + durTxt(R.minPie) + ')' + (R.nTrans ? ' · 🚇 ' + R.nTrans + ' tramo' + (R.nTrans > 1 ? 's' : '') + ' en transporte' : '') + ' · ' + (r.yaOptimo ? '✓ el orden del plan ya era el más cercano' : 'ahorran ' + kmF(r.ahorroPie) + ' a pie frente al orden original') + '.</p>';
    h += '<div class="row"><button class="btn or" data-ruta="' + r.n + '">🗺️ Ver ruta en el mapa</button><a class="btn" href="' + gmRuta(R.orden) + '" target="_blank" rel="noopener">Google Maps ↗</a></div></div>';
  }
  h += '<div class="grid2 mt"><div class="box"><h4>☔ Si llueve</h4>' + esc(d.rain) + '</div><div class="box"><h4>🍽️ Qué comer</h4>' + d.eat.map(esc).join('<br>') + '</div><div class="box o"><h4>🗣️ Reto de inglés</h4>' + esc(d.en) + '</div><div class="box"><h4>📸 Foto y 🎵 canción</h4>' + (esc(d.ig) || 'Día libre de fotos') + (d.song ? '<br><b>' + esc(d.song) + '</b>' : '') + '</div></div>';
  h += '<div class="mt tw"><table class="bt"><tr><th>Gasto para ' + g + '</th><th></th></tr>' + d.items.filter(function (i) { return i.v; }).map(function (i) { return '<tr><td>' + esc(i.cat) + ' · ' + esc(i.label) + '</td><td>' + fmt(cost(i, g), i.cur) + '</td></tr>'; }).join('') + '<tr class="t"><td>Total del día</td><td>' + dayCost(d) + '</td></tr></table></div>';
  if (!r) h += '<div class="row mt"><button class="btn pri" data-map="' + d.city + '">Ver en el mapa ›</button></div>';
  return h + '</div></article>';
}

/* ---------- análisis de actividades ---------- */
function filasAnalisis() {
  return DAYS.map(function (d, k) {
    var r = rutaDeTarjeta(d), lug = r ? r.ids.filter(function (i) { return P[i].cat !== 'transporte'; }) : [];
    var res = 0; lug.forEach(function (i) { var fr = FK[P[i].n] !== undefined ? FREE[FK[P[i].n]] : null; if (fr && fr.st === 'res') res++; if (/recreation|reserva|pase gratis/i.test(P[i].h)) res += fr ? 0 : 1; });
    return { d: d, k: k, r: r, tipo: tipoDia(d, r), lug: lug, km: r ? r.cerca.kmPie : 0, min: r ? r.cerca.minPie : 0, trans: r ? r.cerca.nTrans : 0, gratis: lug.filter(function (i) { return !P[i].e; }).length,
      pagos: lug.filter(function (i) { return P[i].e; }).length, res: res, cop: costoDiaCOP(d), it: r ? intensidad(r) : { t: 'Libre', c: 'g', e: '🛋️' }, ahorro: r ? r.ahorroPie : 0, dias: numerosDia(d).length };
  });
}
function barrasSimples(rows, fmtV, color) {
  var max = Math.max.apply(0, rows.map(function (r) { return r.v; }).concat([1]));
  return '<div class="gbars">' + rows.map(function (r) { return '<div class="gbar-r"><span class="gbar-l">' + esc(r.l) + '</span><span class="gbar-t"><i style="width:' + (r.v / max * 100).toFixed(1) + '%;background:' + (r.c || color) + '"></i></span><span class="gbar-v"><b>' + fmtV(r.v) + '</b>' + (r.s ? '<small>' + esc(r.s) + '</small>' : '') + '</span></div>'; }).join('') + '</div>';
}
function analisisHTML() {
  var F = filasAnalisis(), paseo = F.filter(function (f) { return f.tipo.t === 'Paseo'; });
  var kmT = 0, minT = 0, ahorro = 0, lugT = {}, gratis = 0, cop = 0, nPaseo = 0, nDesc = 0, nViaje = 0;
  F.forEach(function (f) { kmT += f.km; minT += f.min; ahorro += f.ahorro; cop += f.cop; f.lug.forEach(function (i) { lugT[i] = 1; });
    if (f.tipo.t === 'Paseo') nPaseo += f.dias; else if (f.tipo.t === 'Descanso') nDesc += f.dias; else nViaje += f.dias; });
  Object.keys(lugT).forEach(function (i) { if (!P[i].e) gratis++; });
  var nLug = Object.keys(lugT).length;
  var h = '<div class="grid4 anastats"><div class="stat o"><small>Días de paseo · descanso · viaje</small><b>' + nPaseo + ' · ' + nDesc + ' · ' + nViaje + '</b></div><div class="stat"><small>Lugares en las rutas</small><b>' + nLug + ' <span class="sm">(' + gratis + ' gratis)</span></b></div>' +
    '<div class="stat"><small>A pie en todo el viaje</small><b>' + Math.round(kmT) + ' km <span class="sm">~' + durTxt(minT) + '</span></b></div><div class="stat"><small>Ahorro al ordenar por cercanía</small><b>' + kmF(ahorro) + '</b></div></div>';
  // consejos automáticos
  var ins = [], top = paseo.slice().sort(function (a, b) { return b.km - a.km; })[0], caro = F.slice().sort(function (a, b) { return b.cop - a.cop; })[0];
  if (top) ins.push('🔥 <b>Día más exigente: Día ' + top.d.n + ' (' + esc(CITYNAME[top.d.city]) + ')</b>, ' + kmF(top.km) + ' a pie y ' + top.lug.length + ' lugares. Zapatos cómodos, cargador portátil y agua.');
  if (caro) ins.push('💸 <b>Día más caro: Día ' + caro.d.n + '</b> (' + esc(caro.d.title) + '): ' + fmt(caro.cop, 'COP') + ' para ' + g + '.');
  for (var k = 1; k < F.length; k++) if (/intenso/i.test(F[k].it.t) && /intenso/i.test(F[k - 1].it.t)) ins.push('⚠️ <b>Días ' + F[k - 1].d.n + ' y ' + F[k].d.n + '</b> son intensos seguidos: si están cansados, usen la opción de energía baja en el segundo.');
  var conRes = F.filter(function (f) { return f.res; });
  if (conRes.length) ins.push('🎟️ <b>Necesitan reserva o pase</b> en los días ' + conRes.map(function (f) { return f.d.n; }).join(', ') + '. Revisen la pestaña Gratis.');
  var reord = F.filter(function (f) { return f.ahorro > 0.05; });
  if (reord.length) ins.push('🧭 Al ordenar por cercanía cambian los días ' + reord.map(function (f) { return f.d.n + ' (−' + kmF(f.ahorro) + ')'; }).join(', ') + '.');
  ins.push('🛋️ Hay ' + nDesc + ' días de descanso: buenos para lavar ropa, hacer mercado y adelantar reservas.');
  h += '<div class="card"><h3 class="gh3">💡 Lo que hay que saber</h3><ul class="insights">' + ins.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul></div>';
  // gráficas
  h += '<div class="grid2"><div class="card"><h3 class="gh3">🚶 Kilómetros a pie por día</h3>' + barrasSimples(paseo.map(function (f) { return { l: 'Día ' + f.d.n + ' · ' + CITYNAME[f.d.city], v: f.km, s: durTxt(f.min), c: f.it.c === 'r' ? '#C53030' : f.it.c === 'o' ? 'var(--orange)' : 'var(--snow)' }; }), function (v) { return kmF(v); }, 'var(--orange)') + '</div>';
  h += '<div class="card"><h3 class="gh3">💵 Costo por día (' + g + ' persona' + (g > 1 ? 's' : '') + ')</h3>' + barrasSimples(F.filter(function (f) { return f.cop > 0; }).map(function (f) { return { l: 'Día ' + f.d.n, v: f.cop, s: CITYNAME[f.d.city] }; }), function (v) { return fmt(v, 'COP'); }, 'var(--ink)') + '</div></div>';
  // tabla
  h += '<div class="card"><h3 class="gh3">📋 Comparación de días</h3><p class="gnota">Toca un día para ver su ruta en el mapa.</p><div class="tw"><table class="bt ana"><tr><th>Día</th><th>Tipo</th><th>Lugares</th><th>A pie</th><th>Transporte</th><th>Gratis / pago</th><th>Costo</th><th>Intensidad</th></tr>' +
    F.map(function (f) { return '<tr' + (f.r ? ' class="clic" data-ruta="' + f.r.n + '"' : '') + '><td><b>' + f.d.n + '</b> <small>' + esc(f.d.date) + '</small><br><small>' + esc(CITYNAME[f.d.city]) + '</small></td><td>' + f.tipo.e + ' ' + f.tipo.t + '</td><td>' + (f.lug.length || '—') + '</td><td>' + (f.km ? kmF(f.km) : '—') + '</td><td>' + (f.trans || '—') + '</td><td>' + (f.lug.length ? f.gratis + ' / ' + f.pagos : '—') + '</td><td>' + fmt(f.cop, 'COP') + '</td><td><span class="pill ' + f.it.c + '">' + f.it.e + ' ' + f.it.t + '</span></td></tr>'; }).join('') + '</table></div></div>';
  // por ciudad
  var C = {}; F.forEach(function (f) { var c = f.d.city; C[c] = C[c] || { dias: 0, cop: 0, lug: {}, km: 0 }; C[c].dias += f.dias; C[c].cop += f.cop; C[c].km += f.km; f.lug.forEach(function (i) { C[c].lug[i] = 1; }); });
  h += '<div class="card"><h3 class="gh3">🏙️ Por ciudad</h3><div class="grid3 ciudades">' + Object.keys(C).map(function (c) { var x = C[c]; return '<div class="box"><h4>' + esc(CITYNAME[c]) + '</h4><b>' + x.dias + ' día' + (x.dias > 1 ? 's' : '') + '</b> · ' + Object.keys(x.lug).length + ' lugares<br>🚶 ' + kmF(x.km) + ' · ' + fmt(x.cop, 'COP') + '</div>'; }).join('') + '</div></div>';
  return h;
}
