/* JD & Santi On Tour · pestaña Días: el plan día por día, cambios dinámicos (mover días y lugares,
   hecho / no fuimos, pendientes) y la vista de análisis. */

function numerosDia(d) { return [+d.n]; }
/* Ruta con lugares del día (o null si es de descanso o de viaje) */
function rutaDeTarjeta(d) {
  var r = rutaDia(+d.n);
  return !r.viaje && r.ids.filter(function (i) { return P[i].cat !== 'transporte'; }).length ? r : null;
}
function costoDiaCOP(d) { return d.items.reduce(function (s, i) { return s + cost(i, g) * (i.cur === 'USD' ? RATE : 1); }, 0); }
function tipoDia(d, r) {
  if (d.city === 'col' || /vuelo|aeropuerto|dulles/i.test(d.title + ' ' + d.short)) return { t: 'Viaje', e: '✈️', c: 'o' };
  if (!r) return { t: 'Descanso', e: '🛋️', c: 'g' };
  return { t: 'Paseo', e: '🚶', c: 's' };
}

/* ---------- barra del plan: estado, compartir, por qué este orden y pendientes ---------- */
var POR_QUE_ORDEN = [
  '🏠 <b>Primero Arlington</b> (1–3 nov): llegan cansados y queda cerca de casa. Lunes cementerio e Iwo Jima; martes naturaleza y aviones.',
  '🏛️ <b>DC de miércoles a viernes</b> (4–6 nov): entre semana hay menos filas. El Washington Monument cierra el miércoles 4, por eso va el viernes 6.',
  '🧺 <b>Old Town el sábado 7</b>: el mercado campesino solo es los sábados.',
  '🐼 <b>Zoo (lun 9) y museos (mar 10)</b> antes de Nueva York. El miércoles 11 es festivo: descansan y preparan el tren.',
  '🗽 <b>Nueva York el jueves 12</b>: el tren de entre semana es más barato y el museo del 11-S abre (los martes de noviembre no).',
  '🦀 <b>Baltimore el sábado 14</b>: el Walters y el Monumento abren (lunes y martes cierran).',
  '🛍️ <b>Del 16 al 18, libres en Arlington</b>: compras y un día comodín para lo que haya quedado pendiente.',
  '🔔 <b>Filadelfia y Delaware el jueves 19</b>: lejos de Acción de Gracias (trenes llenos y caros) y compras sin impuesto.',
  '🌅 <b>Viernes 20</b>, último día en DC; el fin de semana Pentagon City, maletas y despedida.',
  '😴 Después de cada día largo hay uno suave.'
];
function barraPlan() {
  var ch = cambiosPlan(), mod = ch.dias || ch.lugares, pe = pendientes(), sync = typeof gx !== 'undefined' && gx.conn;
  var h = '<div class="card planbar"><div class="row spread"><div><h3 class="gh3">' + (mod ? '✏️ Su plan' : '📋 Plan recomendado') + '</h3><small>' +
    (mod ? (ch.dias ? ch.dias + ' día' + (ch.dias > 1 ? 's' : '') + ' cambiado' + (ch.dias > 1 ? 's' : '') : '') + (ch.dias && ch.lugares ? ' · ' : '') + (ch.lugares ? ch.lugares + ' lugar' + (ch.lugares > 1 ? 'es movidos' : ' movido') : '') : 'Pensado para seguirlo tal cual') +
    ' · ' + (sync ? '🔄 se comparte por la hoja de Gastos' : '📱 guardado en este teléfono') + '</small></div><div class="row">' +
    '<button class="btn sm" id="planCompartir">📲 Compartir plan</button>' + (mod ? '<button class="btn sm" id="planReset">↺ Volver al recomendado</button>' : '') + '</div></div>';
  h += '<p class="gnota">Toquen un día para ver su cronograma. Con <b>🔀 Cambiar de día</b> lo intercambian con otro y todo se reajusta solo: rutas, horas, avisos de lo que cierra, reservas y la tarjeta de Hoy.</p>';
  h += '<details class="rdet"><summary>🤔 ¿Por qué este orden?</summary><ul class="insights">' + POR_QUE_ORDEN.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul></details>';
  if (pe.length) {
    h += '<div class="pendientes"><h4>🗂️ Pendientes (' + pe.length + ')</h4><ul>' + pe.map(function (x) {
      if (x.tipo === 'bloque') { var b = BLOQUES[x.id]; return '<li><span>📅 <b>' + esc(b.title) + '</b><small>No fueron el ' + fechaCorta(x.n) + '</small></span><button class="btn sm or" data-agb="' + x.id + '">Pasar a otro día</button></li>'; }
      var p = P[x.i]; return '<li><span>' + emo(p) + ' <b>' + esc(p.n) + '</b><small>' + esc(CITYNAME[p.c]) + ' · quitado de su día</small></span><button class="btn sm or" data-agl="' + x.i + '">Agendar</button></li>';
    }).join('') + '</ul></div>';
  }
  return h + '</div>';
}

function renderDias() {
  var h = '<h2 class="big">Día a día</h2><p class="lead">El plan está ordenado para seguirlo al pie de la letra. Si algo cambia, ustedes eligen y todo se recalcula.</p>';
  h += barraPlan();
  if (typeof planesExtraHTML === 'function' && daysMode !== 'ana') h += planesExtraHTML();
  h += '<div class="row dtools"><div class="toggle2" role="group" aria-label="Vista"><button data-m="res"' + (daysMode === 'res' ? ' class="on"' : '') + '>Resumido</button><button data-m="full"' + (daysMode === 'full' ? ' class="on"' : '') + '>Completo</button><button data-m="ana"' + (daysMode === 'ana' ? ' class="on"' : '') + '>📊 Análisis</button></div>';
  if (daysMode !== 'ana') h += '<div class="toggle2" role="group" aria-label="Energía"><button data-e="alta"' + (energy === 'alta' ? ' class="on"' : '') + '>⚡ Alta</button><button data-e="media"' + (energy === 'media' ? ' class="on"' : '') + '>🙂 Media</button><button data-e="baja"' + (energy === 'baja' ? ' class="on"' : '') + '>😴 Baja</button></div>';
  h += '</div>';
  if (daysMode === 'ana') h += analisisHTML();
  else h += '<div class="dias">' + DAYS.map(function (d, k) { return tarjetaDia(d, k); }).join('') + '</div>';
  h += totBar();
  var el = document.getElementById('v-dias'); el.innerHTML = h;
  function on(sel, fn) { [].forEach.call(el.querySelectorAll(sel), function (b) { b.onclick = function (e) { fn(b, e); }; }); }
  on('[data-m]', function (b) { daysMode = b.dataset.m; save(); renderDias(); });
  on('[data-e]', function (b) { energy = b.dataset.e; save(); renderDias(); toast('Energía ' + energy + ': opciones resaltadas'); });
  [].forEach.call(el.querySelectorAll('.dh'), function (x) { var f = function () { x.parentNode.classList.toggle('open'); }; x.onclick = f; x.onkeydown = function (e) { if (e.key === 'Enter') f(); }; });
  on('[data-map]', function (b, e) { e.stopPropagation(); go('mapa'); dayFilter = null; showCity(b.dataset.map); });
  on('[data-ruta]', function (b, e) { e.stopPropagation(); verRutaDia(+b.dataset.ruta); });
  on('[data-pl]', function (b, e) { e.stopPropagation(); showPlace(+b.dataset.pl); });
  on('[data-cambiar]', function (b) { elegirDiaBloque(b.dataset.cambiar); });
  on('[data-hecho]', function (b) { planEstado(b.dataset.hecho, 'hecho'); });
  on('[data-salto]', function (b) { var id = b.dataset.salto, ya = MIPLAN.est[id] === 'saltado'; planEstado(id, 'saltado'); if (!ya) elegirDiaBloque(id, true); });
  on('[data-mv]', function (b, e) { e.stopPropagation(); elegirDiaLugar(+b.dataset.mv, b.dataset.de); });
  on('[data-agb]', function (b) { elegirDiaBloque(b.dataset.agb); });
  on('[data-agl]', function (b) { elegirDiaLugar(+b.dataset.agl, null); });
  on('[data-rest]', function (b) { irRest(+b.dataset.rest); });
  var rs = document.getElementById('planReset'); if (rs) rs.onclick = function () { if (confirm('¿Volver al plan recomendado? Se deshacen los cambios de días y lugares (las reservas marcadas se conservan).')) planReiniciar(); };
  document.getElementById('planCompartir').onclick = compartirPlan;
  if (typeof bindExtras === 'function') bindExtras(el);
}
function compartirPlan() {
  var u = planEnlace(), t = 'Nuestro plan del viaje (JD & Santi On Tour)';
  if (navigator.share) navigator.share({ title: t, text: t, url: u }).catch(function () {});
  else if (navigator.clipboard) navigator.clipboard.writeText(u).then(function () { toast('🔗 Enlace del plan copiado: mándenlo por WhatsApp'); }, function () { prompt('Copien este enlace:', u); });
  else prompt('Copien este enlace:', u);
}

function tarjetaDia(d, k) {
  var n = +d.n, id = d.id, go = ['col', 'ny', 'bal', 'phi', 'del'].indexOf(d.city) > -1, r = rutaDeTarjeta(d), it = r ? intensidad(r) : null, tipo = tipoDia(d, r);
  var est = MIPLAN.est[id], movido = bloqueMovido(id), avB = avisosBloque(id, n), cr = r ? cronogramaDia(n) : null, nAv = avB.length + (cr ? cr.avisos : 0);
  var f = fechaDia(n), hoyN = typeof diaDeHoy === 'function' ? diaDeHoy() : 0;
  var h = '<article class="day' + (go ? ' go' : '') + (est ? ' ' + est : '') + (n === hoyN ? ' hoy' : '') + (daysMode === 'full' ? ' open' : '') + '" data-k="' + k + '" data-dia="' + n + '"><div class="dh" role="button" tabindex="0"><div class="dn"><small>' + SEMANA[f.getDay()] + '</small><b>' + f.getDate() + '</b><small>' + MESES[f.getMonth()] + ' · D' + n + '</small></div><div><h3>' + (est === 'hecho' ? '✓ ' : '') + esc(d.title) + '</h3><p>' + esc(CITYNAME[d.city]) + ' · ' + esc(d.short) + '</p>' +
    '<div class="dtags">' + (n === hoyN ? '<span class="pill r">📍 Hoy</span>' : '') + (est === 'hecho' ? '<span class="pill g">✓ Hecho</span>' : est === 'saltado' ? '<span class="pill r">✗ No fueron</span>' : '') + (movido ? '<span class="pill o">🔀 Cambiado</span>' : '') +
    '<span class="pill ' + tipo.c + '">' + tipo.e + ' ' + tipo.t + '</span>' + (r ? '<span class="pill ' + it.c + '">' + it.e + ' ' + it.t + '</span><span class="pill">' + (r.cerca.kmPie >= 0.05 ? '🚶 ' + kmF(r.cerca.kmPie) : '🚇 en transporte') + '</span>' : '') +
    (nAv ? '<span class="pill r">⚠️ ' + nAv + ' aviso' + (nAv > 1 ? 's' : '') + '</span>' : cr ? '<span class="pill g">🕘 ' + hhmm(cr.items[0] ? cr.items[0].ini : 540) + '–' + hhmm(cr.fin) + '</span>' : '') + (d.w ? '<span class="pill">🌡️ ' + esc(d.w) + '</span>' : '') + '</div></div><div class="cost">' + dayCost(d) + '</div></div><div class="db">';
  if (avB.length) h += '<div class="box avisos">' + avB.map(function (a) { return '<p>⚠️ ' + esc(a) + '</p>'; }).join('') + '</div>';
  h += notasDia(n).map(function (x) { return '<div class="box nota">' + esc(x) + '</div>'; }).join('');
  if (!d.fijo) h += '<div class="row planacc"><button class="btn sm pri" data-cambiar="' + id + '">🔀 Cambiar de día</button>' + (r ? '<button class="btn sm' + (est === 'hecho' ? ' on' : '') + '" data-hecho="' + id + '">✓ Lo hicimos</button><button class="btn sm' + (est === 'saltado' ? ' on' : '') + '" data-salto="' + id + '">✗ No fuimos</button>' : '') + '</div>';
  h += '<div class="en3"><div' + (energy === 'alta' ? ' class="on"' : '') + '><small>⚡ ENERGÍA ALTA</small>' + esc(d.alta) + '</div><div' + (energy === 'media' ? ' class="on"' : '') + '><small>🙂 MEDIA</small>' + esc(d.media) + '</div><div' + (energy === 'baja' ? ' class="on"' : '') + '><small>😴 BAJA</small>' + esc(d.baja) + '</div></div>';
  h += '<div class="mt"><ul class="tl">' + d.acts.map(function (a) { return '<li><b>' + esc(a[0]) + '</b><span>' + esc(a[1]) + '</span></li>'; }).join('') + '</ul></div>';
  if (r) {
    var R = r.cerca, vistos = {};
    h += '<div class="box rutadia mt"><h4>🕘 Cronograma · ' + fechaCorta(n) + '</h4>' + cronogramaHTML(n, true) + '<h4 class="mt">🧭 Orden por cercanía <small>(⇄ pasa un lugar a otro día)</small></h4><ol class="mini">' + R.orden.map(function (i, j) {
      var reg = vistos[i]; vistos[i] = 1; var fx = reg ? null : horaFija(P[i], n);
      return '<li><button data-pl="' + i + '"><i>' + (reg ? '↩' : j + 1) + '</i>' + esc(P[i].n) + (fx ? ' <small>⏰' + horaTxt(fx.t) + '</small>' : '') + '</button>' + (reg || P[i].cat === 'transporte' ? '' : '<button class="mvbtn" data-mv="' + i + '" data-de="' + id + '" aria-label="Pasar ' + esc(P[i].n) + ' a otro día" title="Pasar a otro día">⇄</button>') + '</li>';
    }).join('') + '</ol>';
    h += '<p class="rnota">🚶 ' + kmF(R.kmPie) + ' a pie (' + durTxt(R.minPie) + ')' + (R.nTrans ? ' · 🚇 ' + R.nTrans + ' tramo' + (R.nTrans > 1 ? 's' : '') + ' en transporte' : '') + ' · ' + (r.yaOptimo ? '✓ el orden del plan ya era el más cercano' : 'ahorran ' + kmF(r.ahorroPie) + ' a pie frente al orden original') + '.</p>';
    h += '<div class="row"><button class="btn or" data-ruta="' + n + '">🗺️ Ver ruta en el mapa</button><a class="btn" href="' + gmRuta(R.orden) + '" target="_blank" rel="noopener">Google Maps ↗</a></div></div>';
    var RC = typeof restDelDia === 'function' ? restDelDia(n, 3) : [];
    if (RC.length) h += '<div class="box mt"><h4>🍽️ Rico y barato cerca de la ruta</h4><div class="restmini">' + RC.map(function (o) { var x = RESTAURANTES[o.k]; return '<button data-rest="' + o.k + '"><span>' + x.e + '</span><b>' + esc(x.n) + '</b><small>' + esc(x.p) + ' · ' + esc(x.pide) + '</small></button>'; }).join('') + '</div></div>';
  }
  h += '<div class="grid2 mt"><div class="box"><h4>☔ Si llueve</h4>' + esc(d.rain) + '</div><div class="box"><h4>🍽️ Qué comer</h4>' + d.eat.map(esc).join('<br>') + '</div><div class="box o"><h4>🗣️ Reto de inglés</h4>' + esc(d.en) + '</div><div class="box"><h4>📸 Foto y 🎵 canción</h4>' + (esc(d.ig) || 'Día libre de fotos') + (d.song ? '<br><b>' + esc(d.song) + '</b>' : '') + '</div></div>';
  h += '<div class="mt tw"><table class="bt"><tr><th>Gasto para ' + g + '</th><th></th></tr>' + d.items.filter(function (i) { return i.v; }).map(function (i) { return '<tr><td>' + esc(i.cat) + ' · ' + esc(i.label) + '</td><td>' + fmt(cost(i, g), i.cur) + '</td></tr>'; }).join('') + '<tr class="t"><td>Total del día</td><td>' + dayCost(d) + '</td></tr></table></div>';
  if (!r) h += '<div class="row mt"><button class="btn pri" data-map="' + d.city + '">Ver en el mapa ›</button></div>';
  return h + '</div></article>';
}

/* ---------- hoja para elegir (abajo en el celular, centrada en pantallas grandes) ---------- */
function hoja(titulo, html, alAbrir) {
  cerrarHoja();
  var d = document.createElement('div'); d.className = 'hojafondo';
  d.innerHTML = '<div class="hoja" role="dialog" aria-modal="true" aria-label="' + esc(titulo) + '"><div class="hojah"><b>' + esc(titulo) + '</b><button class="btn sm" data-cerrar aria-label="Cerrar">✕</button></div><div class="hojab">' + html + '</div></div>';
  document.body.appendChild(d);
  d.onclick = function (e) { if (e.target === d || e.target.hasAttribute('data-cerrar')) cerrarHoja(); };
  document.addEventListener('keydown', escHoja);
  if (alAbrir) alAbrir(d);
  requestAnimationFrame(function () { d.classList.add('on'); });
}
function escHoja(e) { if (e.key === 'Escape') cerrarHoja(); }
function cerrarHoja() { var d = document.querySelector('.hojafondo'); if (d) d.remove(); document.removeEventListener('keydown', escHoja); }
function diasElegibles(excluir) {
  var hoyN = typeof diaDeHoy === 'function' ? diaDeHoy() : 0, o = [];
  for (var n = 1; n <= DAYS.length; n++) if (n !== excluir && !DAYS[n - 1].fijo && (hoyN < 1 || n >= hoyN)) o.push(n);
  return o;
}
/* Intercambiar un día completo con otro */
function elegirDiaBloque(id, despuesDeSaltar) {
  var n0 = DIA_DE[id], b = BLOQUES[id];
  var filas = diasElegibles(n0).map(function (n) {
    var otro = DAYS[n - 1], s = avisosSiMuevo(id, n), libre = !esPaseo(otro.id), ok = !s.este.length && !s.otro.length;
    return { ok: ok, libre: libre, html: '<button class="opdia' + (ok ? ' ok' : '') + '" data-n="' + n + '"><span class="opf"><b>' + fechaTxt(n) + '</b><small>Día ' + n + '</small></span><span class="opt"><b>' + (libre ? '🛋️ ' : '') + esc(otro.title) + '</b><small>' + (libre ? 'Día libre: pasa al ' + fechaCorta(n0) : 'Se pasa al ' + fechaCorta(n0)) + '</small>' +
      (ok ? '<small class="okt">✓ Todo abre y no hay choques</small>' : s.este.concat(s.otro.map(function (x) { return otro.title + ': ' + x; })).slice(0, 2).map(function (x) { return '<small class="av">⚠️ ' + esc(x) + '</small>'; }).join('')) + '</span></button>' };
  });
  var rec = filas.filter(function (x) { return x.ok; }).sort(function (a, b) { return b.libre - a.libre; });
  var h = '<p class="gnota">' + (despuesDeSaltar ? 'Quedó en Pendientes. ¿Lo pasamos a otro día? ' : '') + 'Escojan el día nuevo para <b>' + esc(b.title) + '</b> (hoy está el ' + fechaCorta(n0) + '). Los dos días se intercambian.</p>';
  if (rec.length) h += '<h4 class="gh4">★ Recomendados: sin avisos</h4>' + rec.map(function (x) { return x.html; }).join('');
  h += '<h4 class="gh4">Todos los días</h4>' + filas.map(function (x) { return x.html; }).join('');
  if (despuesDeSaltar) h += '<button class="btn" data-cerrar>Dejarlo en Pendientes por ahora</button>';
  hoja('🔀 Cambiar de día', h, function (d) {
    [].forEach.call(d.querySelectorAll('[data-n]'), function (x) { x.onclick = function () { var n = +x.dataset.n; cerrarHoja(); planIntercambiar(n0, n); if (tab === 'dias') abrirDia(n); }; });
  });
}
/* Pasar un solo lugar a otro día (o quitarlo y dejarlo en Pendientes) */
function elegirDiaLugar(i, deB) {
  var p = P[i], ya = diasDe(p);
  var filas = diasElegibles(0).filter(function (n) { return ya.indexOf(n) < 0; }).map(function (n) {
    var d = DAYS[n - 1], L = lugaresDeBloque(d.id).filter(function (j) { return P[j].cat !== 'transporte'; });
    var km = L.length ? Math.min.apply(0, L.map(function (j) { return hav(P[j].ll, p.ll); })) : null;
    var H = typeof horario === 'function' ? horario(i) : null, oc = H ? abreCierra(H, fechaDia(n).getDay(), isoDia(n)) : undefined;
    return { km: km, html: '<button class="opdia' + (oc !== null && km != null && km < 1.5 ? ' ok' : '') + '" data-n="' + n + '"><span class="opf"><b>' + fechaTxt(n) + '</b><small>Día ' + n + '</small></span><span class="opt"><b>' + esc(d.title) + '</b><small>' + (km != null ? 'Queda a ' + kmF(km) + ' de lo de ese día' : 'Día libre') + '</small>' + (oc === null ? '<small class="av">⚠️ ' + esc(H.txtCierre || 'Cerrado ese día') + '</small>' : '') + '</span></button>' };
  });
  var cerca = filas.filter(function (x) { return x.km != null && x.km < 1.5; }).sort(function (a, b) { return a.km - b.km; });
  var h = '<p class="gnota"><b>' + esc(p.n) + '</b>' + (ya.length ? ' está el ' + ya.map(fechaCorta).join(' y ') + '.' : ' no tiene día todavía.') + ' Escojan a qué día pasarlo: la ruta y el cronograma se rehacen.</p>';
  if (cerca.length) h += '<h4 class="gh4">★ Quedan cerca</h4>' + cerca.map(function (x) { return x.html; }).join('');
  h += '<h4 class="gh4">Todos los días</h4>' + filas.map(function (x) { return x.html; }).join('');
  if (deB) h += '<button class="btn" id="mvQuitar">🗂️ Quitarlo de este día (queda en Pendientes)</button>';
  hoja('📅 ' + p.n, h, function (d) {
    [].forEach.call(d.querySelectorAll('[data-n]'), function (x) { x.onclick = function () { cerrarHoja(); planMoverLugar(i, deB, DAYS[+x.dataset.n - 1].id); }; });
    var q = d.querySelector('#mvQuitar'); if (q) q.onclick = function () { cerrarHoja(); planMoverLugar(i, deB, null); };
  });
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
