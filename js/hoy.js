/* Guía USA · tarjetas de Inicio: reservas con fecha límite y el día de hoy durante el viaje */

/* Reservas verificadas (oct 2026). fecha = cuándo salen o hasta cuándo comprar (hora del este). */
var RESERVAS = [
  { f: '2026-10-06T09:00', n: 'Library of Congress', d: 'Día 7 · jue 5 nov, 10:30', c: 'Pase gratis con hora (salen 30 días antes)', u: 'https://www.loc.gov/visit/' },
  { f: '2026-10-07T10:00', n: 'Washington Monument', d: 'Día 8 · vie 6 nov, 9:00', c: 'Tiquete en recreation.gov (US$1); se agotan en minutos', u: 'https://www.recreation.gov/search?q=Washington%20Monument' },
  { f: '2026-10-06T00:00', n: 'Tour del Capitolio', d: 'Día 7 · jue 5 nov, 9:00', c: 'Tour gratis con hora: ya se puede reservar', u: 'https://www.visitthecapitol.gov/visit/book-a-tour' },
  { f: '2026-10-06T00:00', n: 'Air and Space Museum', d: 'Día 7 · jue 5 nov, 13:00', c: 'Pase gratis con hora: revisen ya si hay fechas de noviembre', u: 'https://airandspace.si.edu/visit/museum-dc' },
  { f: '2026-10-06T00:00', n: 'National Zoo', d: 'Día 14 · jue 12 nov, 9:30', c: 'Pase gratis obligatorio: revisen ya cuándo salen', u: 'https://nationalzoo.si.edu/visit' },
  { f: '2026-10-14T08:00', n: 'Museo de Historia Afroamericana', d: 'Día 15 · vie 13 nov, 13:30', c: 'Pase gratis con hora (salen 30 días antes)', u: 'https://nmaahc.si.edu/visit/frequently-asked-questions' },
  { f: '2026-10-20T10:00', n: 'Independence Hall', d: 'Día 21 · jue 19 nov, ~12:40', c: 'Tour con hora en recreation.gov (US$1); antes de las 10:30 es libre', u: 'https://www.nps.gov/inde/planyourvisit/independencehalltickets.htm' },
  { f: '2026-10-15T12:00', n: 'Amtrak a Nueva York', d: 'Día 12 · mar 10 nov: ida 6:20, regreso 19:52', c: 'Mientras antes, más barato (desde ~US$29)', u: 'https://www.amtrak.com' },
  { f: '2026-10-15T12:00', n: 'Amtrak a Filadelfia y regreso desde Wilmington', d: 'Día 21 · jue 19 nov: ida 6:30, regreso 20:32', c: 'Mientras antes, más barato', u: 'https://www.amtrak.com' },
  { f: '2026-11-04T23:59', n: 'Mount Vernon (opcional)', d: 'Día 9 · sáb 7 nov', c: 'US$28 en línea con 3 días de anticipación (US$30 en taquilla)', u: 'https://www.mountvernon.org/plan-your-visit' },
  { f: '2026-10-23T12:00', n: 'Show gratis en el Kennedy Center', d: 'Día 8 · vie 6 nov, 18:00', c: 'Confirmar el programa ~2 semanas antes (The REACH)', u: 'https://www.kennedy-center.org/whats-on/millennium-stage/' }
];
function hechas() { try { return JSON.parse(localStorage.getItem('guiaReservas') || '{}'); } catch (e) { return {}; } }
function renderReservas(el) {
  if (!el) return;
  var now = Date.now(), hc = hechas(), fin = new Date('2026-11-24').getTime();
  if (now > fin) { el.remove(); return; }
  // durante el viaje solo quedan las de actividades que todavía no pasan
  var hoyN = diaDeHoy();
  var lista = RESERVAS.filter(function (r) { var m = /D[ií]a (\d+)/.exec(r.d); return !m || hoyN < 1 || +m[1] >= hoyN; }).sort(function (a, b) { return a.f < b.f ? -1 : 1; });
  if (!lista.length) { el.remove(); return; }
  var pend = lista.filter(function (r) { return !hc[r.n]; }).length;
  var h = '<h3 class="gh3">⏰ Reservas con fecha límite</h3><p class="gnota" style="margin:0 0 10px">' + (pend ? 'Faltan ' + pend + '. Marquen ✓ cuando las tengan (se guarda en este teléfono).' : '✓ ¡Todas listas!') + '</p><ul class="reservas">';
  lista.forEach(function (r) {
    var t = new Date(r.f + '-04:00').getTime(), dias = Math.ceil((t - now) / 864e5), ok = !!hc[r.n];
    var cuando = /Amtrak/.test(r.n) ? (dias > 0 ? 'compren ya' : 'compren ya') : dias > 1 ? 'en ' + dias + ' días' : dias === 1 ? 'mañana' : dias === 0 ? 'HOY' : 'disponible ya';
    h += '<li class="' + (ok ? 'ok' : dias <= 2 ? 'urge' : '') + '"><button class="rchk" data-r="' + esc(r.n) + '" aria-label="Marcar como hecha">' + (ok ? '✓' : '') + '</button><div><b>' + esc(r.n) + '</b><small>' + esc(r.d) + ' · ' + esc(r.c) + '</small></div><div class="rcu"><span class="pill ' + (ok ? 'g' : dias <= 2 ? 'r' : 'o') + '">' + (ok ? 'Lista' : cuando) + '</span><a href="' + r.u + '" target="_blank" rel="noopener">Abrir ↗</a></div></li>';
  });
  el.innerHTML = h + '</ul>';
  [].forEach.call(el.querySelectorAll('[data-r]'), function (b) { b.onclick = function () { var x = hechas(); if (x[b.dataset.r]) delete x[b.dataset.r]; else x[b.dataset.r] = 1; try { localStorage.setItem('guiaReservas', JSON.stringify(x)); } catch (e) {} renderReservas(el); }; });
}

/* Día de hoy durante el viaje */
function diaDeHoy() { var hoy = new Date(); hoy.setHours(12, 0, 0, 0); return Math.round((hoy - fechaDia(1)) / 864e5) + 1; }
function renderHoy(el) {
  if (!el) return;
  var n = diaDeHoy(), d = diaDeN(n);
  if (n < 1 || n > 26 || !d) { el.remove(); return; }
  var r = rutaDia(n), hayRuta = r.ids.some(function (i) { return P[i].cat !== 'transporte'; }) && !r.viaje;
  var h = '<div class="paratit"><span>📅</span><div><h3>Hoy · Día ' + n + ': ' + esc(d.title) + '</h3><p>' + esc(d.date) + ' · ' + esc(d.short) + '</p></div></div>';
  if (hayRuta) {
    var c = cronogramaDia(n), ahora = new Date().getHours() * 60 + new Date().getMinutes();
    var prox = c.items.filter(function (x) { return x.tipo === 'visita' && !x.regreso && x.fin > ahora && P[x.i].cat !== 'transporte'; })[0];
    if (prox) h += '<div class="prox"><small>Próxima actividad</small><b>' + hhmm(prox.ini) + ' · ' + esc(P[prox.i].n) + '</b></div>';
    h += cronogramaHTML(n, true);
    h += '<div class="row">' + (prox ? '<button class="btn or" id="hoyIr">🧭 Ir a ' + esc(P[prox.i].n) + '</button>' : '') + '<button class="btn" id="hoyRuta">🗺️ Ruta de hoy</button></div>';
    el.innerHTML = h;
    if (prox) document.getElementById('hoyIr').onclick = function () { irA({ ll: P[prox.i].ll, n: P[prox.i].n, i: prox.i }); };
    document.getElementById('hoyRuta').onclick = function () { verRutaDia(n); };
  } else {
    h += '<ul class="tl">' + d.acts.map(function (a) { return '<li><b>' + esc(a[0]) + '</b><span>' + esc(a[1]) + '</span></li>'; }).join('') + '</ul>';
    el.innerHTML = h;
  }
}
