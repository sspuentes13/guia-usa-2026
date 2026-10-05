/* JD & Santi On Tour · cronograma de cada día: horas de llegada, espera, visita y traslados,
   revisando horarios de apertura y cierre verificados (js/datos/horarios.js). */

var DIAS_SEM = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
function hhmm(m) { m = Math.round(m); var h = Math.floor(m / 60) % 24, mm = m % 60; return h + ':' + ('0' + mm).slice(-2); }
function horario(i) { return (typeof HORARIOS !== 'undefined' && HORARIOS[P[i].n]) || null; }
/* [abre, cierra] en minutos para un día de la semana; null = cerrado; undefined = sin dato */
function abreCierra(H, dow, iso) {
  if (!H || !H.h) return undefined;
  if (iso && H.cerradoFechas && H.cerradoFechas.indexOf(iso) > -1) return null;
  if (H.h === '24h') return [0, 24 * 60];
  var x = H.h[dow]; if (!x) return null;
  return [Math.round(x[0] * 60), Math.round(x[1] * 60)];
}
function durVisita(i) {
  var H = horario(i), p = P[i]; if (H && H.dur) return H.dur;
  if (p.cat === 'transporte') return 0;
  if (p.cat === 'comer') return 60;
  if (p.cat === 'compras') return 180;
  if (/Museo|Museum|Gallery|Library|Biblioteca|Zoo|Walters/.test(p.n)) return 100;
  if (/Memorial|Monument|Monumento|Bell|Toro|Escaleras|Carillon/.test(p.n)) return 30;
  return 50;
}
function horaInicioDia(n, orden) {
  var d = diaDeN(n), f0 = orden.length ? horaFija(P[orden[0]], n) : null;
  if (f0 && f0.t >= 0) return f0.t * 60;
  if (d) for (var k = 0; k < d.acts.length; k++) { var h = horaNum(d.acts[k][0]); if (h != null) return h * 60; }
  return 9 * 60;
}
/* traslados verificados que no son metro (minutos puerta a puerta) */
var TRASLADOS_FIJOS = { "Elfreth's Alley>Christiana Mall": [105, 'tren SEPTA + Uber'], 'Torpedo Factory>Mount Vernon': [75, 'metro y bus 101'], 'Old Town Alexandria>Mount Vernon': [80, 'metro y bus 101'] };
function minTraslado(a, b) {
  var fx = TRASLADOS_FIJOS[P[a].n + '>' + P[b].n]; if (fx) return { min: fx[0], modo: 'transporte', km: hav(P[a].ll, P[b].ll), txt: fx[1] };
  var k = hav(P[a].ll, P[b].ll);
  if (k < 0.05) return { min: 0, modo: 'pie', km: 0 };
  if (k <= RUTA_A_PIE_MAX) return { min: minPie(k), modo: 'pie', km: k * 1.25 };
  if (typeof TR !== 'undefined' && TR) { var r = trRuta(P[a].ll, P[b].ll); if (r) return { min: Math.round(r.min), modo: 'metro', km: k, r: r }; }
  return { min: minTransporte(k), modo: 'transporte', km: k };
}
/* Cronograma de un día: [{tipo:'visita'|'traslado', …}] y avisos */
function cronogramaDia(n, modo) {
  var r = rutaDia(n), orden = r[modo || routeMode || 'cerca'].orden, fecha = fechaDia(n), dow = fecha.getDay();
  var t = horaInicioDia(n, orden), items = [], avisos = 0, actsUsadas = {};
  orden.forEach(function (i, k) {
    var p = P[i], reg = orden.indexOf(i) < k, av = [];
    if (k > 0) { var tr = minTraslado(orden[k - 1], i); if (tr.min) items.push({ tipo: 'traslado', min: tr.min, modo: tr.modo, km: tr.km }); t += tr.min; }
    var llega = t, ini = t, f = reg ? null : horaFija(p, n);
    // si una actividad del itinerario agrupa varios lugares, su hora solo fija el primero
    if (f && f.act) { if (actsUsadas[f.act]) f = null; else actsUsadas[f.act] = 1; }
    if (f && f.t * 60 > ini) ini = f.t * 60;
    if (f && f.t >= 0 && llega > f.t * 60 + 20) av.push('Llegan tarde a la hora planeada (' + hhmm(f.t * 60) + ')');
    var H = horario(i), oc = reg ? undefined : abreCierra(H, dow, isoFecha(fecha));
    if (oc === null) { av.push(H.cerradoFechas && H.cerradoFechas.indexOf(isoFecha(fecha)) > -1 ? 'Cerrado ese día (' + fechaCorta(n) + ')' : 'Cerrado los ' + DIAS_SEM[dow]); }
    else if (oc) {
      if (ini < oc[0]) { ini = oc[0]; }
      if (ini >= oc[1]) av.push('Llegan después del cierre (' + hhmm(oc[1]) + ')');
      if (H.ultima && ini > H.ultima * 60) av.push('Última entrada ' + hhmm(H.ultima * 60));
    }
    var dur = reg ? 0 : durVisita(i), fin = ini + dur;
    if (oc && fin > oc[1] && ini < oc[1]) { av.push('Poco tiempo: cierra ' + hhmm(oc[1])); fin = oc[1]; }
    avisos += av.length;
    items.push({ tipo: 'visita', i: i, llega: llega, ini: ini, fin: fin, espera: Math.max(0, ini - llega), avisos: av, fijo: f, regreso: reg, H: H, oc: oc });
    t = fin;
  });
  return { n: n, fecha: fecha, dow: dow, items: items, avisos: avisos, fin: t };
}
function cronogramaHTML(n, compacto) {
  var c = cronogramaDia(n), h = '<ol class="crono' + (compacto ? ' mini' : '') + '">';
  c.items.forEach(function (x) {
    if (x.tipo === 'traslado') { h += '<li class="ct"><span></span><small>' + (x.modo === 'pie' ? '🚶 ' : '🚇 ') + durTxt(x.min) + (x.modo === 'pie' ? ' a pie' : x.modo === 'metro' ? ' en metro' : ' en transporte') + '</small></li>'; return; }
    var p = P[x.i];
    h += '<li class="cv' + (x.avisos.length ? ' alerta' : '') + '"><span class="ch">' + hhmm(x.ini) + (x.fin > x.ini ? '<small>' + hhmm(x.fin) + '</small>' : '') + '</span><div><b>' + (x.regreso ? 'Regreso · ' : '') + esc(p.n) + '</b>' +
      (x.espera >= 10 ? '<small>⏳ Llegan ' + hhmm(x.llega) + ' y esperan ' + durTxt(x.espera) + (x.oc && x.ini === x.oc[0] ? ' a que abra' : '') + '</small>' : '') +
      (x.fijo && !x.regreso && /amanecer|atardecer|noche|show|reserva/.test(x.fijo.por) ? '<small>⏰ ' + esc(x.fijo.por) + '</small>' : '') +
      (x.H && x.H.reserva ? '<small>🎟️ ' + esc(x.H.reserva) + '</small>' : '') +
      x.avisos.map(function (a) { return '<small class="av">⚠️ ' + esc(a) + '</small>'; }).join('') + '</div></li>';
  });
  return h + '</ol>' + (c.avisos ? '<p class="gnota av">⚠️ ' + c.avisos + ' aviso' + (c.avisos > 1 ? 's' : '') + ' en este día: revisen el orden o el horario.</p>' : '<p class="gnota">✓ Todo abre a tiempo según los horarios verificados. Terminan cerca de las ' + hhmm(c.fin) + '.</p>');
}
/* Horario de un lugar para la ficha */
function horarioHTML(i) {
  var H = horario(i); if (!H) return '';
  var dias = diasDe(P[i]), txt = '';
  if (H.h === '24h') txt = 'Abierto las 24 horas';
  else if (H.h) {
    var grupos = [];
    for (var d = 1; d <= 7; d++) { var k = d % 7, x = H.h[k], v = x ? hhmm(x[0] * 60) + '–' + hhmm(x[1] * 60) : 'cerrado', g = grupos[grupos.length - 1]; if (g && g.v === v) g.b = k; else grupos.push({ a: k, b: k, v: v }); }
    txt = grupos.map(function (g) { return (g.a === g.b ? DIAS_SEM[g.a] : DIAS_SEM[g.a] + '–' + DIAS_SEM[g.b]) + ' ' + g.v; }).join(' · ');
  }
  var plan = dias.filter(function (n) { return n >= 1 && n <= 26; }).map(function (n) { var dow = fechaDia(n).getDay(), oc = abreCierra(H, dow, isoDia(n)); return 'Día ' + n + ' (' + fechaCorta(n) + '): ' + (oc === null ? '⚠️ cerrado' : oc ? hhmm(oc[0]) + '–' + hhmm(oc[1]) : '—'); });
  return '<div class="box horario"><h4>🕘 Horario verificado</h4>' + esc(txt) + (plan.length ? '<br><b>' + esc(plan.join(' · ')) + '</b>' : '') + (H.reserva ? '<br>🎟️ ' + esc(H.reserva) : '') + (H.precio ? '<br>💵 ' + esc(H.precio) : '') + (H.nota ? '<br>💡 ' + esc(H.nota) : '') +
    (H.fuente ? '<br><a href="' + esc(H.fuente) + '" target="_blank" rel="noopener">Fuente oficial ↗</a>' : '') + (H.conf && H.conf !== 'alta' ? ' <small>(verificar cerca de la fecha)</small>' : '') + '</div>';
}
