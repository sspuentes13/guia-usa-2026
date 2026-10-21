/* JD & Santi On Tour · tarjetas de Inicio: reservas calculadas con el plan y el día de hoy durante el viaje */

/* Reglas verificadas (5–6 oct 2026). La fecha en que salen se calcula con el día del plan:
   sale.tipo: 'dias' (N días antes, a la hora h del este), 'mes' (el día 1, dos meses antes, 12:00),
   'ya' (ya se puede), 'compra' (comprar al confirmar), 'antes' (comprar con N días de anticipación),
   'nada' (no se compra antes), 'miercoles' (el miércoles dos semanas antes). */
var RESERVAS = [
  { id: 'capitolio', n: 'Tour del Capitolio', lugar: 'Capitolio', sale: { tipo: 'ya' }, u: 'https://www.visitthecapitol.gov/visit/book-a-tour',
    que: 'Tour gratis con hora (se reserva hasta ~90 días antes).', porque: 'Temprano hay menos gente y después pasan por el túnel a la Library of Congress. Reservado a las 9:20: lleguen 8:20 (piden 60 min antes).',
    segunda: 'Pases del mismo día en los mostradores de Emancipation Hall, antes de las 14:30.', noVan: 'Gratis: cancelen en su cuenta o al 202-226-8000 para liberar el cupo.', cambio: 'Cancelen y reserven la nueva fecha (gratis).', plata: 'Nada' },
  { id: 'loc', n: 'Library of Congress', lugar: 'Library of Congress', sale: { tipo: 'dias', dias: 30 }, u: 'https://www.loc.gov/visit/',
    que: 'Pase gratis con hora.', porque: 'El mismo día del Capitolio: se pasa por el túnel sin volver a hacer fila.',
    segunda: 'Pases del mismo día en loc.gov desde las 9:00 (hora del este).', noVan: 'Gratis: escriban a visit@loc.gov para cancelar.', cambio: 'Saquen otro pase para la nueva fecha (gratis). No son transferibles.', plata: 'Nada' },
  { id: 'wm', n: 'Washington Monument', lugar: 'Washington Monument', sale: { tipo: 'dias', dias: 30, h: 10 }, u: 'https://www.recreation.gov/ticket/facility/234635',
    que: 'Tiquete con hora en recreation.gov (máximo 6). Se agotan en minutos.', porque: 'El turno de las 9:00 es el primero: menos fila y buena luz. El miércoles 4 nov está cerrado por mantenimiento.',
    segunda: 'El día anterior a las 15:00 (hora del este) sale otro lote en recreation.gov; y el mismo día dan pases en el kiosco de la calle 15 desde las 8:45.', noVan: 'Cancelen antes de las 14:00 (hora del este) del día anterior. El US$1 por tiquete no se devuelve.', cambio: 'No se puede cambiar la fecha: cancelen y reserven otra vez (US$1 más por persona).', plata: 'US$1 por persona' },
  { id: 'aire', n: 'Air and Space Museum', lugar: 'Air and Space Museum', sale: { tipo: 'mes' }, u: 'https://airandspace.si.edu/visit/museum-dc',
    que: 'Pase gratis con hora (obligatorio, incluso bebés).', porque: 'Queda a 10 min a pie del Capitolio. Reservado a las 15:00, después de Historia Natural y el almuerzo.',
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
  { id: 'busny', n: 'Bus Greyhound a Nueva York (ida y regreso)', lugar: 'Port Authority (llegada)', horaTren: 'bus de las', sale: { tipo: 'compra' }, u: 'https://www.greyhound.com',
    que: 'Ida el lunes a las 8:30 desde Union Station (bus deck), llega a Port Authority 13:05. Regreso el martes a las 16:50 desde Port Authority, llega 22:35. Para el 9–10 nov costaba US$14,99 + US$30,99 + US$3,99 de servicio: confirmen el precio de las fechas nuevas.', porque: 'Es ~4 veces más barato que Amtrak y llega a Port Authority, a 6 cuadras de Times Square.',
    segunda: 'FlixBus a la misma hora y precio (8:00, llega a la calle 31 con 8.ª Av.). De regreso: Greyhound 18:45 (llega 23:40) o FlixBus 16:00 directo a Rosslyn.', noVan: 'Greyhound devuelve un bono (no plata): 100 % si cancelan con 30 días o más, 70 % con 7–29 días, 40 % con 2–6 días y 20 % con menos de 2.', cambio: 'Se puede cambiar hasta 15 minutos antes de salir, pagando la diferencia.', plata: '~US$50 por persona' },
  { id: 'hotelny', n: 'Hotel en Manhattan (1 noche)', lugar: 'Hotel American Dream', sale: { tipo: 'antes', dias: 2 }, u: 'https://www.booking.com/hotel/us/american-dream-new-york.html',
    que: 'American Dream (Gramercy): camarote para dos, baño compartido y desayuno, ~US$153 con impuestos (cotizado para el 9 nov: confirmen el precio de la noche nueva). Cancelación gratis hasta 2 días antes y se paga en el hotel.', porque: 'Es la opción más barata con 2 camas, desayuno y cancelación gratis. El Gallivant sale ~US$322 con 2 camas (cobra US$40 de resort fee más impuestos y retiene US$500 de depósito).',
    segunda: 'HI NYC Hostel (~US$158 los dos en dormitorio), Pod 51 (~US$211, camarote) o Mayfair Times Square (~US$221, 1 cama).', noVan: 'Cancelando hasta 2 días antes no pagan nada.', cambio: 'Se cambia gratis en Booking hasta 2 días antes.', plata: 'Nada si cancelan a tiempo' },
  { id: 'museo911', n: 'Museo del 11-S gratis (lunes 17:30)', lugar: 'Memorial del 11-S', sale: { tipo: 'dias', dias: 0, h: 7 }, u: 'https://www.911memorial.org/visit/visit-museum',
    que: 'Los lunes el museo es gratis de 17:30 a 19:00. Los tiquetes salen ese mismo lunes a las 7:00 (hora de NY) en 911memorial.org y se acaban rápido.', porque: 'Los martes de noviembre el museo no abre; el lunes es gratis al final de la tarde.',
    segunda: 'Si se agotan: tiquete pago (US$24–36) para antes de las 17:30, o solo las fuentes del Memorial (gratis).', noVan: 'Gratis: no pierden nada.', cambio: 'Solo aplica los lunes.', plata: 'Nada' },
  { id: 'bryant', n: 'Turno para patinar en Bryant Park', lugar: 'Pista de hielo de Bryant Park', sale: { tipo: 'ya' }, u: 'https://bryantpark.org/activities/the-rink',
    que: 'Entrada gratis con turno de hora obligatorio; el hielo empieza 20 min después. Alquiler de patines desde ~US$19.', porque: 'Queda al lado de la Biblioteca, en la ruta del martes.',
    segunda: 'Si no hay turnos: Wollman Rink en Central Park (US$16–40).', noVan: 'Gratis: no pierden nada (los patines se pagan allá).', cambio: 'Reserven otro turno.', plata: 'Nada' },
  { id: 'tv', n: 'Grabación gratis de TV (Fallon, Seth Meyers, Daily Show)', lugar: 'Rockefeller Center', sale: { tipo: 'ya' }, u: 'https://1iota.com',
    que: 'Boletas gratis en 1iota.com (16+ para NBC, 18+ para The Daily Show). Las fechas de noviembre salen ~1 mes antes.', porque: 'Es gratis y muy de Nueva York. Para el lunes en la tarde o el martes temprano, si hay grabación.',
    segunda: 'Standby para Fallon: tarjetas de 8:00 a 15:00 el día de la grabación en la NBC Shop de 30 Rock.', noVan: 'Gratis, pero tener boleta no garantiza entrar: lleguen temprano.', cambio: 'Pidan otra fecha.', plata: 'Nada' },
  { id: 'amtrakphi', n: 'Amtrak a Filadelfia y regreso desde Wilmington', lugar: 'Escaleras de Rocky', horaTren: 1, sale: { tipo: 'compra' }, u: 'https://www.amtrak.com',
    que: 'Ida 6:30 a Filadelfia; regreso 20:32 desde Wilmington.', porque: 'Lejos de Acción de Gracias (26 nov), cuando los trenes se llenan y suben de precio.',
    segunda: 'SEPTA regional + MARC es más barato pero más lento.', noVan: 'Si no viajan y no cancelan antes de la salida, pierden el 100 %.', cambio: 'Flex: cambio o reembolso completo. Value: 30 %. Sale: 50 %. Reembolso total dentro de las 24 h después de comprar.', plata: 'Según la tarifa' },
  { id: 'indep', n: 'Independence Hall', lugar: 'Independence Hall', sale: { tipo: 'dias', dias: 30 }, u: 'https://www.nps.gov/inde/planyourvisit/independencehalltickets.htm',
    que: 'Tour con hora en recreation.gov (US$1). Plan B sin reserva: entrada libre 9:00–10:30 (lleguen 8:30).', porque: 'El plan empieza en las Escaleras de Rocky (9:00) y llega a Independence después de las 10:30: a esa hora se necesita boleto.',
    segunda: 'Los boletos del día siguiente salen a las 17:00 (hora del este) del día anterior.', noVan: 'El US$1 no se devuelve.', cambio: 'Se puede modificar hasta la medianoche (hora del este) del día anterior.', plata: 'US$1 por persona' },
  { id: 'holocausto', n: 'Museo del Holocausto (pase con hora)', lugar: 'Museo del Holocausto', sale: { tipo: 'ya' }, u: 'https://www.ushmm.org/information/visit-the-museum/plan-your-visit/admission-tickets',
    que: 'Pase gratis con hora para la exposición permanente (en línea cobran US$1 de servicio). Los de noviembre ya están a la venta.', porque: 'El de las 13:30 deja la mañana para dormir después de Nueva York y para la Oficina de Grabado, que queda al lado.',
    segunda: 'Cada día a las 7:00 (hora del este) salen pases en línea para ese mismo día.', noVan: 'Solo pierden el US$1 de servicio.', cambio: 'Saquen pases para la nueva fecha.', plata: 'US$1 por persona' },
  { id: 'grabado', n: 'Tour de la Oficina de Grabado (dólares)', lugar: 'Oficina de Grabado (donde imprimen dólares)', sale: { tipo: 'ya' }, u: 'https://www.bep.gov/visitor-centers/washington-dc-tour-and-visitor-center/tour/',
    que: 'Tiquete gratis con hora: lunes a viernes, recorridos de 9:00 a 14:00 (máximo 9 por persona).', porque: 'A las 11:30 alcanzan a dormir después de Nueva York, y queda al lado del Museo del Holocausto.',
    segunda: 'El mismo día salen pocos en línea a las 8:00, por orden de llegada.', noVan: 'Gratis: no pierden nada.', cambio: 'Reserven otro turno.', plata: 'Nada' },
  { id: 'capitolioes', n: 'Tour del Capitolio EN ESPAÑOL (opcional)', lugar: 'Capitolio', sale: { tipo: 'ya' }, u: 'mailto:CVCReservations@aoc.gov?subject=Spanish%20tour%20request',
    que: 'Tour guiado en español a las 8:40, con audífonos de traducción. Se pide por correo a CVCReservations@aoc.gov entre 3 y 90 días antes (fecha, hora 8:40, número de personas y nombres).', porque: 'Para entender todo sin depender del inglés. Si lo confirman, cancelen el de las 9:20 para liberar los cupos.',
    segunda: 'En los mostradores dan un folleto en español que sigue al guía del tour en inglés.', noVan: 'Gratis: avisen por correo.', cambio: 'Escriban al mismo correo.', plata: 'Nada' },
  { id: 'planetword', n: 'Planet Word (pase gratis)', lugar: 'Planet Word (museo del idioma)', sale: { tipo: 'ya' }, u: 'https://planetwordmuseum.org/plan-your-visit/',
    que: 'Pase gratis con hora (recomendado). Los de noviembre ya salieron.', porque: 'El mismo día quedan pocos.', segunda: 'Lleguen temprano: hay algunos cupos sin reserva.', noVan: 'Gratis: no pierden nada.', cambio: 'Saquen otro pase.', plata: 'Nada' },
  { id: 'dumbarton', n: 'Dumbarton Oaks (registro gratis)', lugar: 'Jardines de Dumbarton Oaks', sale: { tipo: 'ya' }, u: 'https://www.doaks.org/visit/plan',
    que: 'Gratis del 1 nov al 31 dic. Registro gratis en Eventbrite (recomendado; la web se contradice).', porque: 'Asegura la entrada en la tarde (14:00–17:00).', segunda: 'Prueben en la puerta.', noVan: 'Gratis: no pierden nada.', cambio: 'Regístrense para otro día.', plata: 'Nada' },
  { id: 'sphere', n: 'Universal Sphere (tiquete gratis del mismo día)', lugar: 'Universal Sphere y videopared de Comcast', sale: { tipo: 'dias', dias: 0, h: 9 }, u: 'https://comcastcentercampus.com/universal-sphere',
    que: 'Tiquete gratis del mismo día en TheUniversalSphere.com desde las 9:00 (o en el lugar con un guía).', porque: 'La función actual termina el 20 nov.', segunda: 'Pidan cupo en el lugar.', noVan: 'Gratis.', cambio: 'Solo sirve el mismo día.', plata: 'Nada' },
  { id: 'glenstone', n: 'Glenstone (tiquete gratis)', lugar: 'Glenstone (arte y naturaleza, Maryland)', sale: { tipo: 'ya' }, u: 'https://www.glenstone.org/plan-your-visit',
    que: 'Tiquete gratis con hora (salen el día 1 de cada mes a las 10:00). Si llegan en el bus Ride On 301, entran sin reserva.', porque: 'Los fines de semana se agotan.', segunda: 'Lleguen en el bus 301: entran sin tiquete.', noVan: 'Gratis.', cambio: 'Saquen otro.', plata: 'Nada' },
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
  return typeof pasesComoRes === 'function' ? pasesComoRes(x) : x;
}
function filaReserva(r, ahora, hc) {
  var i = idxLugar(r.lugar), n = i > -1 ? diasDe(P[i])[0] : 0;
  if (!n) return null;
  var c = cuandoSale(r, n), hecha = hc[r.id], f = horaFija(P[i], n), hora = f ? horaTxt(f.t) : '';
  if (r.horaTren) { var acts = diaDeN(n).acts; for (var q = 0; q < acts.length; q++) if (horaNum(acts[q][0]) != null) { hora = (typeof r.horaTren === 'string' ? r.horaTren : 'tren de las') + ' ' + acts[q][0]; break; } }
  var otra = hecha && hecha.f && hecha.f !== isoDia(n);
  if (hecha && hecha.h && !otra) hora = hecha.h;
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
/* Confirmar una reserva con el día y la hora que les dieron (va al plan compartido y a Google Calendar) */
function confirmarReserva(id, fPlan, el) {
  var r = RESERVAS.filter(function (x) { return x.id === id; })[0]; if (!r) return;
  var res = MIPLAN.res || {}, x = res[id] || {}, fila = filaReserva(r, new Date(), hechas()) || {}, hc = hechas()[id] || {};
  var hn = horaNum(x.h || hc.h || fila.hora || ''), hora = hn != null ? ('0' + Math.floor(hn)).slice(-2) + ':' + ('0' + Math.round(hn % 1 * 60)).slice(-2) : '';
  var h = '<p class="gnota">Escriban el día y la hora que les confirmaron. Queda guardado en los dos teléfonos y, si Google Calendar está conectado, se crea el evento con alerta el día antes y 2 horas antes.</p>' +
    (hc.pase ? '<p class="gnota">🎫 Esta reserva ya tiene ticket en la carpeta: la fecha del ticket manda.</p>' : '') +
    '<div class="pzform"><label class="gl">Día<input class="gin" type="date" id="rcF" min="2026-10-30" max="2026-11-24" value="' + (x.f || hc.f || fPlan) + '"></label><label class="gl">Hora<input class="gin" type="time" id="rcH" value="' + hora + '"></label></div>' +
    '<div class="row mt"><button class="btn pri" id="rcOk">✓ Reserva confirmada</button>' + (res[id] ? '<button class="btn gdel" id="rcNo">Quitar ✓</button>' : '') + '<a class="btn" href="' + r.u + '" target="_blank" rel="noopener">Abrir la página ↗</a></div>';
  hoja('🎟️ ' + r.n, h, function (d) {
    function guardar(v) { MIPLAN.res = res; if (v) res[id] = v; else delete res[id]; MIPLAN.modificado = Date.now(); MIPLAN.pend = 1; planGuardar(); cerrarHoja(); renderReservas(el); }
    d.querySelector('#rcOk').onclick = function () {
      var f = d.querySelector('#rcF').value, hh = d.querySelector('#rcH').value;
      if (!f) return toast('Escojan el día');
      guardar({ f: f, h: hh ? String(+hh.split(':')[0]) + ':' + hh.split(':')[1] : '', t: Date.now() });
      toast('✓ ' + r.n + ': ' + fechaIsoTxt(f) + (hh ? ' a las ' + hh : ''));
    };
    var no = d.querySelector('#rcNo'); if (no) no.onclick = function () { guardar(null); toast('Reserva desmarcada'); };
  });
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
  h += '<p class="gnota" style="margin:0 0 10px">' + (malas ? '<b class="av">⚠️ ' + malas + ' reserva' + (malas > 1 ? 's quedaron' : ' quedó') + ' en otra fecha por un cambio del plan.</b> ' : '') + (pend ? 'Faltan ' + pend + '. Cuando reserven, toquen ✓ y escriban el día y la hora: queda en los dos teléfonos y en Google Calendar con alerta.' : '✓ ¡Todo listo!') + ' Si mueven un día, las fechas se recalculan solas.</p>';
  h += '<ul class="reservas">';
  L.forEach(function (x) {
    var r = x.r;
    h += '<li class="' + (x.hecha && !x.otra ? 'ok' : x.cl === 'r' ? 'urge' : '') + '"><button class="rchk" data-r="' + r.id + '" data-f="' + isoDia(x.n) + '" aria-label="Confirmar día y hora">' + (x.hecha ? '✓' : '') + '</button><div><b>' + esc(r.n) + '</b><small>Para el <b>Día ' + x.n + ' · ' + fechaCorta(x.n) + (x.hora ? ', ' + x.hora : '') + '</b>' + (x.cuando ? ' · ' + esc(x.cuando) : '') + '</small>' +
      (x.hecha && !x.otra ? '<small class="okt">✓ Confirmada: ' + fechaIsoTxt(x.hecha.f) + (x.hecha.h ? ', ' + esc(x.hecha.h) : ' (toquen ✓ para poner la hora)') + (x.hecha.pase ? ' · ticket en 🎫 Nuestros pases' : '') + '</small>' : '') +
      (x.otra ? '<small class="av">⚠️ Reservaron para el ' + fechaIsoTxt(x.hecha.f) + ', pero el plan ahora dice ' + fechaCorta(x.n) + '. ' + esc(r.cambio) + '</small>' : '') +
      '<details class="rdet"><summary>Qué pasa si…</summary><dl><dt>📝 Qué es</dt><dd>' + esc(r.que) + '</dd><dt>🤔 Por qué ese día</dt><dd>' + esc(r.porque) + '</dd><dt>🔁 Si se agotan</dt><dd>' + esc(r.segunda) + '</dd><dt>🙅 Si reservan y no van</dt><dd>' + esc(r.noVan) + '</dd><dt>📅 Cambiar la fecha</dt><dd>' + esc(r.cambio) + '</dd><dt>💵 Plata en riesgo</dt><dd>' + esc(r.plata) + '</dd></dl></details></div>' +
      '<div class="rcu"><span class="pill ' + x.cl + '">' + (x.hecha && !x.otra ? (x.hecha.pase ? '🎫 Con ticket' : 'Lista') : x.est) + '</span>' + (x.hecha && x.hecha.pase ? '<button class="lnk" data-pz="' + esc(x.hecha.pase) + '">Ver pase</button>' : '<a href="' + r.u + '" target="_blank" rel="noopener">Abrir ↗</a>') + '</div></li>';
  });
  h += '</ul>';
  if (typeof gcalHTML === 'function') h += gcalHTML();
  h += '<details class="rdet faq"><summary>🤔 ¿Son las mejores fechas? ¿Y si reservamos y no vamos?</summary><ul class="insights">' +
    '<li><b>Fechas:</b> ' + (av ? 'hay ' + av + ' aviso' + (av > 1 ? 's' : '') + ' en el plan actual: ábranlos en la pestaña Días.' : 'con el plan actual todo abre el día que van y no hay choques de horario.') + ' Arlington va primero (llegan a casa), luego DC entre semana (menos filas), Nueva York lunes y martes con una noche de hotel (el lunes el museo del 11-S es gratis en la tarde), Baltimore un sábado (el Walters abre) y al final compras.</li>' +
    '<li><b>Pases gratis</b> (Capitolio, Library, museos, Zoo): si no van no pierden nada. Cancelen para liberar el cupo y saquen otro para el día nuevo.</li>' +
    '<li><b>Washington Monument e Independence Hall:</b> pierden US$1 por persona. El Monument tiene una segunda oportunidad el día anterior a las 15:00 (hora del este).</li>' +
    '<li><b>Lo que cuesta plata:</b> el Amtrak a Filadelfia (compren con tarifa <b>Flex</b> o cancelen dentro de las 24 h), el bus a Nueva York (Greyhound devuelve un bono, no plata) y el hotel (cancelación gratis hasta 2 días antes).</li>' +
    '<li><b>MARC:</b> no lo compren antes; sirve cualquier día.</li>' +
    '<li>Si cambian un día en la pestaña Días, esta lista recalcula las fechas y les avisa qué reserva hay que mover.</li></ul></details>';
  el.innerHTML = h;
  [].forEach.call(el.querySelectorAll('[data-pz]'), function (b) { b.onclick = function () { verPase(b.dataset.pz); }; });
  [].forEach.call(el.querySelectorAll('[data-r]'), function (b) {
    b.onclick = function () { confirmarReserva(b.dataset.r, b.dataset.f, el); };
  });
  if (typeof bindGcal === 'function') bindGcal();
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
  var pzs = typeof pasesDelDia === 'function' ? pasesDelDia(n) : [];
  if (pzs.length) h += '<div class="row">' + pzs.map(function (p) { return '<button class="btn pri" data-pz="' + esc(p.id) + '">🎫 Pase: ' + esc(p.t) + '</button>'; }).join('') + '</div>';
  el.innerHTML = h;
  [].forEach.call(el.querySelectorAll('[data-pz]'), function (b) { b.onclick = function () { verPase(b.dataset.pz); }; });
  if (hayRuta) {
    if (prox) document.getElementById('hoyIr').onclick = function () { irA({ ll: P[prox.i].ll, n: P[prox.i].n, i: prox.i }); };
    document.getElementById('hoyRuta').onclick = function () { verRutaDia(n); };
  }
  document.getElementById('hoyPlan').onclick = function () { abrirDia(n); };
}
