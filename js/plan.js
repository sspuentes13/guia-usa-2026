/* JD & Santi On Tour · plan dinámico.
   El itinerario son bloques (js/datos/dias.js) y el plan dice qué bloque va en cada día.
   Se puede intercambiar días, mover un lugar a otro día, marcar días hechos o que no se hicieron,
   y todo (rutas, cronograma, reservas, Hoy) se recalcula con la fecha nueva.
   El plan se guarda en el teléfono y, si Gastos está conectado, se comparte por la misma hoja. */

var PLAN_KEY = 'guiaPlan';
var MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
var SEMANA = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
var SEMANA_L = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

/* ---------- fechas ---------- */
function fechaDia(n) { var d = new Date(2026, 9, 30, 12); d.setDate(d.getDate() + n - 1); return d; }
function isoFecha(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
function isoDia(n) { return isoFecha(fechaDia(n)); }
function fechaCorta(n) { var d = fechaDia(n); return SEMANA[d.getDay()] + ' ' + d.getDate() + ' ' + MESES[d.getMonth()]; }
function fechaTxt(n) { var s = fechaCorta(n); return s.charAt(0).toUpperCase() + s.slice(1); }
function fechaDeIso(iso) { var p = String(iso).split('-'); return new Date(+p[0], +p[1] - 1, +p[2], 12); }
function fechaIsoTxt(iso) { var d = fechaDeIso(iso); return SEMANA[d.getDay()] + ' ' + d.getDate() + ' ' + MESES[d.getMonth()]; }
function diaDeIso(iso) { return Math.round((fechaDeIso(iso) - fechaDia(1)) / 864e5) + 1; }

/* ---------- estado ---------- */
function planVacio() { return { orden: PLAN_BASE.slice(), mov: {}, est: {}, res: {}, chk: {}, modificado: 0, pend: 0 }; }
function planOrdenValido(o) {
  if (!Array.isArray(o) || o.length !== PLAN_BASE.length) return false;
  var vistos = {};
  for (var k = 0; k < o.length; k++) {
    if (!BLOQUES[o[k]] || vistos[o[k]]) return false;
    vistos[o[k]] = 1;
    if (BLOQUES[o[k]].fijo && PLAN_BASE[k] !== o[k]) return false;   // los días de vuelo y despedida no se mueven
  }
  return true;
}
function planNormal(x) {
  var p = planVacio();
  if (x && planOrdenValido(x.orden)) p.orden = x.orden.slice();
  ['mov', 'est', 'res', 'chk'].forEach(function (k) { if (x && x[k] && typeof x[k] === 'object') p[k] = x[k]; });
  p.modificado = x && +x.modificado || 0; p.pend = x && x.pend ? 1 : 0;
  return p;
}
function planCargar() {
  var x = null;
  try { x = JSON.parse(localStorage.getItem(PLAN_KEY) || 'null'); } catch (e) {}
  return planNormal(x);
}
var MIPLAN = planCargar(), DAYS = [], DIA_DE = {};

function planAplicar(simulado) {
  DIA_DE = {};
  DAYS = MIPLAN.orden.map(function (id, k) {
    var n = k + 1; DIA_DE[id] = n;
    return Object.assign({}, BLOQUES[id], { n: String(n), id: id, date: fechaTxt(n), w: CLIMA[k] || '', items: BUDGET.filter(function (i) { return i.b === id; }) });
  });
  if (!simulado && typeof _rutaCache !== 'undefined') _rutaCache = {};
}
planAplicar();

function planGuardar(local) {
  try { localStorage.setItem(PLAN_KEY, JSON.stringify(MIPLAN)); } catch (e) {}
  if (local) return;
  if (typeof gx !== 'undefined' && gx.conn && typeof gxProgramarSync === 'function') gxProgramarSync(700);
}
/* Cambio hecho por la persona: se guarda, se recalcula todo y se avisa a la otra persona */
function planCambio(msg) {
  MIPLAN.modificado = Date.now(); MIPLAN.pend = 1;
  planAplicar(); planGuardar(); planRefrescar();
  if (msg) toast(msg);
}
function planRefrescar() {
  if (typeof tab === 'undefined') return;
  if (tab === 'mapa') { if (typeof refrescarRuta === 'function' && typeof cur !== 'undefined' && cur) { if (dayFilter && !diaDeN(dayFilter)) dayFilter = null; refrescarRuta(); showCity(cur); } }
  else if (typeof render === 'function') render(tab);
}

/* ---------- sincronización con la hoja de Gastos (la usa js/gastos.js) ---------- */
function planParaSync() { return MIPLAN.pend ? { orden: MIPLAN.orden, mov: MIPLAN.mov, est: MIPLAN.est, res: MIPLAN.res, chk: MIPLAN.chk, modificado: MIPLAN.modificado } : null; }
function planRemoto(x) {
  if (!x || !planOrdenValido(x.orden)) return;
  var m = +x.modificado || 0;
  if (m < MIPLAN.modificado) return;                       // lo de este teléfono es más nuevo: se sube en la próxima sincronización
  var cambio = m > MIPLAN.modificado && JSON.stringify([x.orden, x.mov, x.est, x.res, x.chk || {}]) !== JSON.stringify([MIPLAN.orden, MIPLAN.mov, MIPLAN.est, MIPLAN.res, MIPLAN.chk]);
  MIPLAN = planNormal(x); MIPLAN.pend = 0;
  planAplicar(); planGuardar(true);
  if (cambio) { planRefrescar(); toast('🔄 El plan se actualizó desde el otro teléfono'); }
}

/* ---------- compartir el plan por enlace (si no tienen Gastos conectado) ---------- */
function planEnlace() {
  var o = MIPLAN.orden.map(function (id) { return PLAN_BASE.indexOf(id).toString(36); }).join('');
  var datos = JSON.stringify({ o: o, m: MIPLAN.mov, e: MIPLAN.est, r: MIPLAN.res, t: MIPLAN.modificado || Date.now() });
  var b64 = btoa(unescape(encodeURIComponent(datos))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return location.origin + location.pathname + '#plan=' + b64;
}
function planDeEnlace() {
  var m = /#plan=([\w-]+)/.exec(location.hash); if (!m) return;
  try {
    var s = m[1].replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '=';
    var x = JSON.parse(decodeURIComponent(escape(atob(s))));
    var orden = x.o.split('').map(function (c) { return PLAN_BASE[parseInt(c, 36)]; });
    if (!planOrdenValido(orden)) throw new Error('plan');
    history.replaceState(null, '', location.pathname + location.search);
    setTimeout(function () {
      if (!confirm('¿Usar el plan que les compartieron? Reemplaza el orden de los días de este teléfono.')) return;
      MIPLAN.orden = orden; MIPLAN.mov = x.m || {}; MIPLAN.est = x.e || {}; MIPLAN.res = x.r || MIPLAN.res;
      planCambio('✓ Plan compartido aplicado');
    }, 400);
  } catch (e) { console.warn('plan del enlace', e); }
}
planDeEnlace();

/* ---------- lugares y días ---------- */
function bloquesDe(p) { var m = MIPLAN.mov[p.n]; return m ? m.slice() : (p.b || []); }
function diasDe(p) { return bloquesDe(p).map(function (b) { return DIA_DE[b]; }).filter(Boolean).sort(function (a, b) { return a - b; }); }
function diaDeN(n) { return DAYS[n - 1] || null; }
function etiquetaDia(n) { return 'Día ' + n + ' · ' + fechaCorta(n); }
function etiquetaLugar(p) {
  var ds = diasDe(p);
  if (!ds.length) return p.b && p.b.length ? '🗂️ Pendiente · sin día' : (p.d || 'Extra');
  return ds.map(function (n) { return 'Día ' + n + ' (' + fechaCorta(n) + ')'; }).join(' y ') + (p.dx ? ' · ' + p.dx : '');
}
function lugaresDeBloque(id) { var o = []; P.forEach(function (p, i) { if (bloquesDe(p).indexOf(id) > -1) o.push(i); }); return o; }
function bloqueMovido(id) { return MIPLAN.orden.indexOf(id) !== PLAN_BASE.indexOf(id); }
function esPaseo(id) { var b = BLOQUES[id]; return !b.fijo && lugaresDeBloque(id).some(function (i) { return P[i].cat !== 'transporte'; }); }
function cambiosPlan() {
  var n = 0; MIPLAN.orden.forEach(function (id, k) { if (PLAN_BASE[k] !== id) n++; });
  return { dias: n, lugares: Object.keys(MIPLAN.mov).length };
}

/* ---------- acciones ---------- */
function planIntercambiar(a, b) {
  var o = MIPLAN.orden, x = o[a - 1], y = o[b - 1];
  if (!x || !y || BLOQUES[x].fijo || BLOQUES[y].fijo) return;
  o[a - 1] = y; o[b - 1] = x;
  delete MIPLAN.est[x]; delete MIPLAN.est[y];
  planCambio('🔀 ' + BLOQUES[x].title + ' → ' + fechaCorta(b) + ' · ' + BLOQUES[y].title + ' → ' + fechaCorta(a));
}
function planMoverLugar(i, deB, aB) {
  var p = P[i], bs = bloquesDe(p).filter(function (b) { return b !== deB; });
  if (aB && bs.indexOf(aB) < 0) bs.push(aB);
  var orig = (p.b || []).slice().sort().join();
  if (bs.slice().sort().join() === orig) delete MIPLAN.mov[p.n]; else MIPLAN.mov[p.n] = bs;
  planCambio(aB ? '📅 ' + p.n + ' → Día ' + DIA_DE[aB] + ' (' + fechaCorta(DIA_DE[aB]) + ')' : '🗂️ ' + p.n + ' quedó en Pendientes');
}
function planEstado(id, est) {
  if (!est || MIPLAN.est[id] === est) delete MIPLAN.est[id]; else MIPLAN.est[id] = est;
  planCambio(MIPLAN.est[id] === 'hecho' ? '✓ ¡Día hecho!' : MIPLAN.est[id] === 'saltado' ? 'Quedó en Pendientes: pueden pasarlo a otro día' : 'Estado quitado');
}
function planReiniciar() { var res = MIPLAN.res, chk = MIPLAN.chk; MIPLAN = planVacio(); MIPLAN.res = res; MIPLAN.chk = chk; planCambio('↺ Volvieron al plan recomendado'); }

/* Lo que quedó sin hacer: días marcados "no fuimos" y lugares quitados de su día */
function pendientes() {
  var o = [];
  MIPLAN.orden.forEach(function (id) { if (MIPLAN.est[id] === 'saltado') o.push({ tipo: 'bloque', id: id, n: DIA_DE[id] }); });
  P.forEach(function (p, i) { if (p.b && p.b.length && MIPLAN.mov[p.n] && !MIPLAN.mov[p.n].length) o.push({ tipo: 'lugar', i: i }); });
  return o;
}

/* ---------- sol: salida y puesta según la fecha y la ciudad (aprox. ±2 min) ---------- */
var CENTRO = { arl: [38.88, -77.07], dc: [38.89, -77.03], ny: [40.75, -73.99], bal: [39.29, -76.61], phi: [39.95, -75.16], del: [39.68, -75.65], col: [4.6, -74.08] };
function solDia(n, ciudad) {
  var ll = CENTRO[ciudad] || CENTRO.dc, f = fechaDia(n), ini = new Date(f.getFullYear(), 0, 1, 12), N = Math.round((f - ini) / 864e5) + 1;
  var rad = Math.PI / 180, lng = ll[1] / 15, utc = n >= 3 ? -5 : -4;   // 1 nov termina el horario de verano
  function hora(sale) {
    var t = N + ((sale ? 6 : 18) - lng) / 24, M = 0.9856 * t - 3.289;
    var L = (M + 1.916 * Math.sin(M * rad) + 0.020 * Math.sin(2 * M * rad) + 282.634 + 360) % 360;
    var RA = (Math.atan(0.91764 * Math.tan(L * rad)) / rad + 360) % 360;
    RA = (RA + Math.floor(L / 90) * 90 - Math.floor(RA / 90) * 90) / 15;
    var sd = 0.39782 * Math.sin(L * rad), cd = Math.cos(Math.asin(sd));
    var ch = (Math.cos(90.833 * rad) - sd * Math.sin(ll[0] * rad)) / (cd * Math.cos(ll[0] * rad));
    var H = (sale ? 360 - Math.acos(ch) / rad : Math.acos(ch) / rad) / 15;
    var T = H + RA - 0.06571 * t - 6.622, UT = (T - lng + 48) % 24;
    return Math.round(((UT + utc + 24) % 24) * 60);
  }
  return { sale: hora(true), puesta: hora(false) };
}

/* ---------- notas que dependen de la fecha, no del bloque ---------- */
var NOTAS_FECHA = {
  '2026-11-01': '🕐 Hoy termina el horario de verano: a las 2:00 los relojes se atrasan 1 hora (el celular lo hace solo). Desde hoy, Washington tiene la misma hora de Colombia.',
  '2026-11-03': '🗳️ Elecciones en EE. UU.: todo abre normal, pero habrá más gente y noticias por todas partes.',
  '2026-11-11': '🎖️ Veterans Day (festivo): la Library of Congress cierra; los museos Smithsonian abren. Hay descuentos en tiendas.'
};
function notasDia(n) {
  var o = [], d = diaDeN(n); if (!d) return o;
  if (NOTAS_FECHA[isoDia(n)]) o.push(NOTAS_FECHA[isoDia(n)]);
  (d.notas || []).forEach(function (x) { o.push(x); });
  var sig = diaDeN(n + 1);
  if (sig && BLOQUES[sig.id].viaje) {
    var h0 = null; for (var k = 0; k < sig.acts.length; k++) { h0 = horaNum(sig.acts[k][0]); if (h0 != null) break; }
    if (h0 != null && h0 <= 7.5) o.push('🌙 Mañana madrugan (' + sig.title + ', tren a las ' + horaTxt(h0) + '): preparen sándwiches, carguen los celulares y a dormir a las 21:00.');
  }
  if (d.city !== 'col') { var s = solDia(n, d.city); o.push('☀️ Sale el sol a las ' + hhmm(s.sale) + ' y se pone a las ' + hhmm(s.puesta) + '.'); }
  return o;
}

/* ---------- ¿este bloque funciona en este día? ---------- */
var REGLAS = {
  oldtown: [{ solo: [6], cubre: ['Old Town Alexandria'], txt: 'El mercado campesino de Old Town solo es los sábados (7:00–12:00).' }],
  baltimore: [{ solo: [6], txt: 'Las horas del tren MARC del plan son las del sábado: ese día confirmen el horario.' }],
  ny: [{ solo: [1, 2, 3, 4, 5], txt: 'Los trenes del plan son de entre semana: el fin de semana cambian las horas y suele ser más caro.' },
    { no: [2], txt: 'El museo del 11-S no abre los martes de noviembre (las fuentes sí).' }],
  georgetown: [{ solo: [5, 6], txt: 'El show gratis del Millennium Stage es sobre todo viernes y sábado a las 18:00: revisen el programa de ese día.' }],
  phi: [{ solo: [1, 2, 3, 4, 5], txt: 'Los trenes del plan (Amtrak y SEPTA) son de entre semana: el fin de semana cambian las horas.' }]
};
function avisosBloque(id, n) {
  var o = [], f = fechaDia(n), dow = f.getDay(), iso = isoFecha(f), b = BLOQUES[id], cubiertos = {};
  (REGLAS[id] || []).forEach(function (r) { if ((r.solo && r.solo.indexOf(dow) < 0) || (r.no && r.no.indexOf(dow) > -1)) { o.push(r.txt); (r.cubre || []).forEach(function (x) { cubiertos[x] = 1; }); } });
  lugaresDeBloque(id).forEach(function (i) {
    if (P[i].cat === 'transporte' || cubiertos[P[i].n] || typeof horario !== 'function') return;
    var H = horario(i), oc = abreCierra(H, dow, iso);
    if (oc === null) o.push(H.txtCierre ? P[i].n + ': ' + H.txtCierre.charAt(0).toLowerCase() + H.txtCierre.slice(1) + ' (' + SEMANA_L[dow] + ' ' + f.getDate() + ').' : P[i].n + ' está cerrado ese día (' + SEMANA_L[dow] + ' ' + f.getDate() + ').');
  });
  b.acts.forEach(function (a) {
    var t = horaNum(a[0]); if (t == null || !/atardecer/i.test(a[1])) return;
    var s = solDia(n, b.city).puesta;
    if (t * 60 > s + 5) o.push('Ese día el sol se pone a las ' + hhmm(s) + ': para el atardecer lleguen antes de las ' + hhmm(s - 25) + '.');
  });
  if (b.viaje) [n - 1, n + 1].forEach(function (m) { var d = diaDeN(m); if (d && BLOQUES[d.id].viaje) o.push('Queda pegado a otro viaje largo (' + d.title + '): van a llegar muy cansados.'); });
  if (typeof reservasDeBloque === 'function') reservasDeBloque(id).forEach(function (r) {
    var x = MIPLAN.res[r.id]; if (x && x.f && x.f !== iso) o.push('Ya tienen reserva de ' + r.n + ' para el ' + fechaIsoTxt(x.f) + '. ' + r.cambio);
  });
  return o;
}
/* Avisos si el bloque se pone en el día n (sin cambiar nada todavía) */
function avisosSiMuevo(id, n) {
  var o = MIPLAN.orden.slice(), a = o.indexOf(id), x = o[n - 1];
  MIPLAN.orden[a] = x; MIPLAN.orden[n - 1] = id; planAplicar(true);
  var r = { este: avisosBloque(id, n), otro: avisosBloque(x, a + 1) };
  MIPLAN.orden = o; planAplicar(true);
  return r;
}
/* Cuántos avisos tiene todo el plan (para decir si las fechas son buenas) */
function avisosPlan() {
  var t = 0;
  MIPLAN.orden.forEach(function (id, k) { t += avisosBloque(id, k + 1).length; });
  if (typeof diasConLugares === 'function') diasConLugares().forEach(function (n) { t += cronogramaDia(n).avisos; });
  return t;
}
