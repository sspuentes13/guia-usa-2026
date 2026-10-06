/* JD & Santi On Tour · tarjetas de Inicio: reservas calculadas con el plan y el día de hoy durante el viaje */

/* Reglas verificadas (5–6 oct 2026). La fecha en que salen se calcula con el día del plan:
   sale.tipo: 'dias' (N días antes, a la hora h del este), 'mes' (el día 1, dos meses antes, 12:00),
   'ya' (ya se puede), 'compra' (comprar al confirmar), 'antes' (comprar con N días de anticipación),
   'nada' (no se compra antes), 'miercoles' (el miércoles dos semanas antes). */
var RESERVAS = [
  { id: 'capitolio', n: 'Tour del Capitolio', lugar: 'Capitolio', sale: { tipo: 'ya' }, u: 'https://www.visitthecapitol.gov/visit/book-a-tour',
    que: 'Tour gratis con hora (se reserva hasta ~90 días antes).', porque: 'El de las 9:00 es el primero del día: menos gente y después pasan por el túnel a la Library of Congress.',
    segunda: 'Pases del mismo día en los mostradores de Emancipation Hall, antes de las 14:30.', noVan: 'Gratis: cancelen en su cuenta o al 202-226-8000 para liberar el cupo.', cambio: 'Cancelen y reserven la nueva fecha (gratis).', plata: 'Nada' },
  { id: 'loc', n: 'Library of Congress', lugar: 'Library of Congress', sale: { tipo: 'dias', dias: 30 }, u: 'https://www.loc.gov/visit/',
    que: 'Pase gratis con hora.', porque: 'El mismo día del Capitolio: se pasa por el túnel sin volver a hacer fila.',
    segunda: 'Pases del mismo día en loc.gov desde las 9:00 (hora del este).', noVan: 'Gratis: escriban a visit@loc.gov para cancelar.', cambio: 'Saquen otro pase para la nueva fecha (gratis). No son transferibles.', plata: 'Nada' },
  { id: 'wm', n: 'Washington Monument', lugar: 'Washington Monument', sale: { tipo: 'dias', dias: 30, h: 10 }, u: 'https://www.recreation.gov/ticket/facility/234635',
    que: 'Tiquete con hora en recreation.gov (máximo 6). Se agotan en minutos.', porque: 'El turno de las 9:00 es el primero: menos fila y buena luz. El miércoles 4 nov está cerrado por mantenimiento.',
    segunda: 'El día anterior a las 15:00 (hora del este) sale otro lote en recreation.gov; y el mismo día dan pases en el kiosco de la calle 15 desde las 8:45.', noVan: 'Cancelen antes de las 14:00 (hora del este) del día anterior. El US$1 por tiquete no se devuelve.', cambio: 'No se puede cambiar la fecha: cancelen y reserven otra vez (US$1 más por persona).', plata: 'US$1 por persona' },
  { id: 'aire', n: 'Air and Space Museum', lugar: 'Air and Space Museum', sale: { tipo: 'mes' }, u: 'https://airandspace.si.edu/visit/museum-dc',
    que: 'Pase gratis con hora (obligatorio, incluso bebés).', porque: 'Queda a 10 min a pie del Capitolio: el pase de las 13:00 encaja después del almuerzo.',
    segunda: 'Si se agotan, aparecen pases extra cerca de la fecha: revisen la mañana del mismo día.', noVan: 'Gratis: cancelen desde el correo de confirmación.', cambio: 'Saquen pases para la nueva fecha (gratis).', plata: 'Nada' },
  { id: 'zoo', n: 'National Zoo', lugar: 'National Zoo', sale: { tipo: 'dias', dias: 30 }, u: 'https://nationalzoo.si.edu/visit',
    que: 'Pase de entrada gratis obligatorio.', porque: 'Entre semana hay menos gente, y los pandas están más activos en la mañana.',
    segunda: 'Salen más pases una semana antes, el día anterior y el mismo día; también hay algunos en la puerta.', noVan: 'Gratis. Si pagaron parqueadero (US$30–40) no se devuelve.', cambio: 'Se puede cambiar hasta 48 h antes.', plata: 'Nada (sin carro)' },
  { id: 'afro', n: 'Museo de Historia Afroamericana', lugar: 'Museo Afroamericano', sale: { tipo: 'dias', dias: 30, h: 8 }, u: 'https://nmaahc.si.edu/visit/frequently-asked-questions',
    que: 'Pase gratis con hora.', porque: 'Con el pase de las 13:30 alcanzan 2,5 h, que es lo mínimo para verlo bien.',
    segunda: 'Pases del mismo día en línea a las 8:15 (hora del este).', noVan: 'Gratis. Avisen a NMAAHCVisitorServices@si.edu.', cambio: 'Escriban a NMAAHCVisitorServices@si.edu o saquen pases nuevos.', plata: 'Nada' },
  { id: 'kennedy', n: 'Show gratis del Kennedy Center', lugar: 'Kennedy Center', sale: { tipo: 'miercoles' }, u: 'https://www.kennedy-center.org/whats-on/millennium-stage/',
    que: 'Millennium Stage: show gratis (confirmen el programa de ese día).', porque: 'Cierra el día de Georgetown, que queda al lado, sin volver a cruzar la ciudad.',
    segunda: 'El mismo día entregan entradas desde las 16:30.', noVan: 'Gratis: no pierden nada.', cambio: 'Reserven el show de la nueva fecha.', plata: 'Nada' },
  { id: 'mv', n: 'Mount Vernon (opcional)', lugar: 'Mount Vernon', sale: { tipo: 'antes', dias: 3 }, u: 'https://www.mountvernon.org/plan-your-visit',
    que: 'US$28 en línea con 3 días de anticipación (US$30 en taquilla).', porque: 'Sábado: se combina con Old Town y el bus 101 desde Huntington.',
    segunda: 'Se puede comprar en la taquilla el mismo día (US$2 más).', noVan: 'Probablemente no devuelven el dinero: compren solo si están seguros.', cambio: 'Llamen al 703-780-2000 para cambiar la fecha.', plata: 'US$28 por persona' },
  { id: 'amtrakny', n: 'Amtrak a Nueva York (ida y regreso)', lugar: 'Penn Station', horaTren: 1, sale: { tipo: 'compra' }, u: 'https://www.amtrak.com',
    que: 'Ida 6:20 desde Union Station, regreso 19:52. Desde ~US$29 por trayecto.', porque: 'Entre semana es más barato, y el museo del 11-S abre los jueves (los martes de noviembre no).',
    segunda: 'Si se agotan las tarifas baratas: Acela o bus (Megabus/FlixBus) desde Union Station.', noVan: 'Si no viajan y no cancelan antes de la salida, pierden el 100 %.', cambio: 'Flex: cambio o reembolso completo. Value: 30 % de penalidad. Sale: 50 %. Cualquier tarifa: reembolso total si cancelan dentro de las 24 h después de comprar.', plata: 'Según la tarifa (Flex 0 %, Value 30 %, Sale 50 %)' },
  { id: 'amtrakphi', n: 'Amtrak a Filadelfia y regreso desde Wilmington', lugar: 'Escaleras de Rocky', horaTren: 1, sale: { tipo: 'compra' }, u: 'https://www.amtrak.com',
    que: 'Ida 6:30 a Filadelfia; regreso 20:32 desde Wilmington.', porque: 'Lejos de Acción de Gracias (26 nov), cuando los trenes se llenan y suben de precio.',
    segunda: 'SEPTA regional + MARC es más barato pero más lento.', noVan: 'Si no viajan y no cancelan antes de la salida, pierden el 100 %.', cambio: 'Flex: cambio o reembolso completo. Value: 30 %. Sale: 50 %. Reembolso total dentro de las 24 h después de comprar.', plata: 'Según la tarifa' },
  { id: 'indep', n: 'Independence Hall', lugar: 'Independence Hall', sale: { tipo: 'dias', dias: 30 }, u: 'https://www.nps.gov/inde/planyourvisit/independencehalltickets.htm',
    que: 'Tour con hora en recreation.gov (US$1). Plan B sin reserva: entrada libre 9:00–10:30 (lleguen 8:30).', porque: 'El plan empieza en las Escaleras de Rocky (9:00) y llega a Independence después de las 10:30: a esa hora se necesita boleto.',
    segunda: 'Los boletos del día siguiente salen a las 17:00 (hora del este) del día anterior.', noVan: 'El US$1 no se devuelve.', cambio: 'Se puede modificar hasta la medianoche (hora del este) del día anterior.', plata: 'US$1 por persona' },
  { id: 'marc', n: 'Tren MARC a Baltimore', lugar: 'Monumento a Washington', horaTren: 1, sale: { tipo: 'nada' }, u: 'https://www.mta.maryland.gov/',
    que: 'No lo compren antes: el tiquete no tiene fecha, vale 6 meses y no se devuelve.', porque: 'Sábado: el Walters y el Monumento abren (lunes y martes cierran).',
    segunda: 'Cómprenlo ese día en la app CharmPass o en la máquina de Union Station (US$9).', noVan: 'Si no lo compraron antes, no pierden nada.', cambio: 'No hace falta: sirve cualquier día.', plata: 'Nada si compran ese día' }
];
function reservasDeBloque(id) { return RESERVAS.filter(function (r) { var i = idxLugar(r.lugar); return i > -1 && bloquesDe(P[i]).indexOf(id) > -1; }); }
function idxLugar(n) { for (var k = 0; k < P.length; k++) if (P[k].n === n) return k; return -1; }

/* hora del este → instante real (oct: UTC−4; desde el 1 nov: UTC−5) */
function instanteET(d, h) { var off = d < new Date(2026, 10, 1, 2) ? 4 : 5; return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), Math.floor(h) + off, Math.round((h % 1) * 60))); }
function horaET(h) { return horaTxt(h) + ' hora del este'; }
/* Cuándo salen las reservas de una regla para el día n del plan */
function cuandoSale(r, n) {
  var dia = fechaDia(n), s = r.sale;
  if (s.tipo === 'dias') { var d = new Date(dia); d.setDate(d.getDate() - s.dias); return { f: d, h: s.h, t: instanteET(d, s.h != null ? s.h : 0) }; }
  if (s.tipo === 'mes') { var m = new Date(dia.getFullYear(), dia.getMonth() - 2, 1, 12); return { f: m, h: 12, t: instanteET(m, 12) }; }
  if (s.tipo === 'miercoles') { var w = new Date(dia); w.setDate(w.getDate() - 14); while (w.getDay() !== 3) w.setDate(w.getDate() - 1); return { f: w, h: null, t: instanteET(w, 0), aprox: true }; }
  if (s.tipo === 'antes') { var a = new Date(dia); a.setDate(a.getDate() - s.dias); return { f: a, h: null, t: instanteET(a, 23.98), limite: true }; }
  return null;
}
function hechas() {
  var x = MIPLAN.res || {};
  try {   // migración: antes se guardaban como {nombre: 1} en este teléfono
    var viejo = JSON.parse(localStorage.getItem('guiaReservas') || 'null');
    if (viejo) {
      RESERVAS.forEach(function (r) { var k = Object.keys(viejo).filter(function (v) { return v.indexOf(r.n.split(' (')[0]) === 0 || r.n.indexOf(v) === 0; })[0]; var i = idxLugar(r.lugar), n = i > -1 ? diasDe(P[i])[0] : 0; if (k && n && !x[r.id]) x[r.id] = { f: isoDia(n) }; });
      localStorage.removeItem('guiaReservas'); MIPLAN.res = x; planGuardar(true);
    }
  } catch (e) {}
  return x;
}
function filaReserva(r, ahora, hc) {
  var i = idxLugar(r.lugar), n = i > -1 ? diasDe(P[i])[0] : 0;
  if (!n) return null;
  var c = cuandoSale(r, n), hecha = hc[r.id], f = horaFija(P[i], n), hora = f ? horaTxt(f.t) : '';
  if (r.horaTren) { var acts = diaDeN(n).acts; for (var q = 0; q < acts.length; q++) if (horaNum(acts[q][0]) != null) { hora = 'tren de las ' + acts[q][0]; break; } }
  var otra = hecha && hecha.f && hecha.f !== isoDia(n);
  var est, cl, orden;
  if (hecha && !otra) { est = 'Lista'; cl = 'g'; orden = 9e15; }
  else if (otra) { est = 'Cambiar'; cl = 'r'; orden = 0; }
  else if (r.sale.tipo === 'nada') { est = 'No comprar antes'; cl = ''; orden = 8e15; }
  else if (r.sale.tipo === 'compra') { est = 'Comprar al confirmar'; cl = 'o'; orden = 1; }
  else if (r.sale.tipo === 'ya' || (c && c.t <= ahora && !c.limite)) { est = '¡Ya se puede!'; cl = 'r'; orden = 2; }
  else if (c && c.limite && c.t < ahora) { est = 'En taquilla'; cl = ''; orden = 7e15; }
  else { var dd = Math.ceil((c.t - ahora) / 864e5); est = c.limite ? 'Hasta ' + fechaIsoTxt(isoFecha(c.f)) : dd > 1 ? 'Salen en ' + dd + ' días' : dd === 1 ? 'Salen mañana' : 'Salen HOY'; cl = dd <= 2 ? 'r' : 'o'; orden = c.t.getTime(); }
  if (fechaDia(n) < ahora - 864e5 && !otra) { if (!hecha) return null; }
  var cuando = '';
  if (c && r.sale.tipo !== 'ya') {
    var col = c.h != null ? horaTxt(c.h - (c.f < new Date(2026, 10, 1) ? 1 : 0)) : null;
    cuando = (c.limite ? 'Compren antes del ' : c.aprox ? 'Salen ~el ' : 'Salen el ') + fechaIsoTxt(isoFecha(c.f)) + (c.h != null ? ', ' + horaET(c.h) + ' (' + col + ' en Colombia)' : '');
  } else if (r.sale.tipo === 'ya') cuando = 'Ya se puede reservar';
  return { r: r, n: n, hora: hora, est: est, cl: cl, orden: orden, cuando: cuando, hecha: hecha, otra: otra };
}
function renderReservas(el) {
  if (!el) return;
  var ahora = new Date(), hc = hechas();
  if (ahora > new Date(2026, 10, 24, 23)) { el.remove(); return; }
  var L = RESERVAS.map(function (r) { return filaReserva(r, ahora, hc); }).filter(Boolean).sort(function (a, b) { return a.orden - b.orden; });
  if (!L.length) { el.remove(); return; }
  var pend = L.filter(function (x) { return !x.hecha && x.r.sale.tipo !== 'nada'; }).length, malas = L.filter(function (x) { return x.otra; }).length;
  var av = avisosPlan();
  var h = '<div class="row spread"><h3 class="gh3">🎟️ Reservas según su plan</h3><span class="pill ' + (av ? 'r' : 'g') + '">' + (av ? '⚠️ ' + av + ' aviso' + (av > 1 ? 's' : '') + ' en el plan' : '✓ Fechas sin choques') + '</span></div>';
  h += '<p class="gnota" style="margin:0 0 10px">' + (malas ? '<b class="av">⚠️ ' + malas + ' reserva' + (malas > 1 ? 's quedaron' : ' quedó') + ' en otra fecha por un cambio del plan.</b> ' : '') + (pend ? 'Faltan ' + pend + '. Marquen ✓ cuando reserven: queda guardada la fecha.' : '✓ ¡Todo listo!') + ' Si mueven un día, las fechas se recalculan solas.</p>';
  h += '<ul class="reservas">';
  L.forEach(function (x) {
    var r = x.r;
    h += '<li class="' + (x.hecha && !x.otra ? 'ok' : x.cl === 'r' ? 'urge' : '') + '"><button class="rchk" data-r="' + r.id + '" data-f="' + isoDia(x.n) + '" aria-label="Marcar como reservada">' + (x.hecha ? '✓' : '') + '</button><div><b>' + esc(r.n) + '</b><small>Para el <b>Día ' + x.n + ' · ' + fechaCorta(x.n) + (x.hora ? ', ' + x.hora : '') + '</b>' + (x.cuando ? ' · ' + esc(x.cuando) : '') + '</small>' +
      (x.otra ? '<small class="av">⚠️ Reservaron para el ' + fechaIsoTxt(x.hecha.f) + ', pero el plan ahora dice ' + fechaCorta(x.n) + '. ' + esc(r.cambio) + '</small>' : '') +
      '<details class="rdet"><summary>Qué pasa si…</summary><dl><dt>📝 Qué es</dt><dd>' + esc(r.que) + '</dd><dt>🤔 Por qué ese día</dt><dd>' + esc(r.porque) + '</dd><dt>🔁 Si se agotan</dt><dd>' + esc(r.segunda) + '</dd><dt>🙅 Si reservan y no van</dt><dd>' + esc(r.noVan) + '</dd><dt>📅 Cambiar la fecha</dt><dd>' + esc(r.cambio) + '</dd><dt>💵 Plata en riesgo</dt><dd>' + esc(r.plata) + '</dd></dl></details></div>' +
      '<div class="rcu"><span class="pill ' + x.cl + '">' + (x.hecha && !x.otra ? 'Lista' : x.est) + '</span><a href="' + r.u + '" target="_blank" rel="noopener">Abrir ↗</a></div></li>';
  });
  h += '</ul>';
  h += '<details class="rdet faq"><summary>🤔 ¿Son las mejores fechas? ¿Y si reservamos y no vamos?</summary><ul class="insights">' +
    '<li><b>Fechas:</b> ' + (av ? 'hay ' + av + ' aviso' + (av > 1 ? 's' : '') + ' en el plan actual: ábranlos en la pestaña Días.' : 'con el plan actual todo abre el día que van y no hay choques de horario.') + ' Arlington va primero (llegan a casa), luego DC entre semana (menos filas), Nueva York un jueves (más barato y el museo del 11-S abre), Baltimore un sábado (el Walters abre) y al final compras.</li>' +
    '<li><b>Pases gratis</b> (Capitolio, Library, museos, Zoo): si no van no pierden nada. Cancelen para liberar el cupo y saquen otro para el día nuevo.</li>' +
    '<li><b>Washington Monument e Independence Hall:</b> pierden US$1 por persona. El Monument tiene una segunda oportunidad el día anterior a las 15:00 (hora del este).</li>' +
    '<li><b>Amtrak:</b> es lo único con plata grande. Compren apenas confirmen con Juan; si no están seguros, tarifa <b>Flex</b> (reembolso completo) o aprovechen las 24 h para cancelar gratis.</li>' +
    '<li><b>MARC:</b> no lo compren antes; sirve cualquier día.</li>' +
    '<li>Si cambian un día en la pestaña Días, esta lista recalcula las fechas y les avisa qué reserva hay que mover.</li></ul></details>';
  el.innerHTML = h;
  [].forEach.call(el.querySelectorAll('[data-r]'), function (b) {
    b.onclick = function () {
      var x = MIPLAN.res || {}, id = b.dataset.r;
      if (x[id] && x[id].f === b.dataset.f) delete x[id]; else x[id] = { f: b.dataset.f, t: Date.now() };
      MIPLAN.res = x; MIPLAN.modificado = Date.now(); MIPLAN.pend = 1; planGuardar();
      toast(x[id] ? '✓ Reserva guardada para el ' + fechaIsoTxt(b.dataset.f) : 'Reserva desmarcada');
      renderReservas(el);
    };
  });
}

/* Día de hoy durante el viaje */
function diaDeHoy() { var hoy = new Date(); hoy.setHours(12, 0, 0, 0); return Math.round((hoy - fechaDia(1)) / 864e5) + 1; }
function renderHoy(el) {
  if (!el) return;
  var n = diaDeHoy(), d = diaDeN(n);
  if (n < 1 || n > 26 || !d) { el.remove(); return; }
  var r = rutaDia(n), hayRuta = r.ids.some(function (i) { return P[i].cat !== 'transporte'; }) && !r.viaje;
  var h = '<div class="paratit"><span>📅</span><div><h3>Hoy · Día ' + n + ': ' + esc(d.title) + '</h3><p>' + esc(d.date) + ' · ' + esc(d.short) + '</p></div></div>';
  h += notasDia(n).filter(function (x) { return !/^☀️/.test(x); }).map(function (x) { return '<div class="box nota">' + esc(x) + '</div>'; }).join('');
  var pe = pendientes().length;
  if (hayRuta) {
    var c = cronogramaDia(n), ahora = new Date().getHours() * 60 + new Date().getMinutes();
    var prox = c.items.filter(function (x) { return x.tipo === 'visita' && !x.regreso && x.fin > ahora && P[x.i].cat !== 'transporte' && !(typeof VIS !== 'undefined' && VIS[x.i]); })[0];
    if (prox) h += '<div class="prox"><small>Próxima actividad</small><b>' + hhmm(prox.ini) + ' · ' + esc(P[prox.i].n) + '</b></div>';
    h += cronogramaHTML(n, true);
    h += '<div class="row">' + (prox ? '<button class="btn or" id="hoyIr">🧭 Ir a ' + esc(P[prox.i].n) + '</button>' : '') + '<button class="btn" id="hoyRuta">🗺️ Ruta de hoy</button><button class="btn" id="hoyPlan">🔀 Cambiar el plan</button></div>';
  } else {
    h += '<ul class="tl">' + d.acts.map(function (a) { return '<li><b>' + esc(a[0]) + '</b><span>' + esc(a[1]) + '</span></li>'; }).join('') + '</ul>';
    h += '<div class="row"><button class="btn" id="hoyPlan">🔀 ' + (pe ? 'Usar el día para un pendiente (' + pe + ')' : 'Cambiar el plan') + '</button></div>';
  }
  el.innerHTML = h;
  if (hayRuta) {
    if (prox) document.getElementById('hoyIr').onclick = function () { irA({ ll: P[prox.i].ll, n: P[prox.i].n, i: prox.i }); };
    document.getElementById('hoyRuta').onclick = function () { verRutaDia(n); };
  }
  document.getElementById('hoyPlan').onclick = function () { abrirDia(n); };
}
