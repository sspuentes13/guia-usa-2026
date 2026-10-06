/* JD & Santi On Tour · exportar al calendario del celular (.ics): recordatorios de reservas,
   pendientes antes del viaje y las actividades con hora de cada día del plan. Se recalcula con el plan. */

function icsFecha(d) { return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); }
/* hora local del viaje → instante real. Todo el viaje es UTC−5: Colombia siempre y Washington desde el 1 nov (fin del horario de verano) */
function icsInstante(n, h) { var f = fechaDia(n); return new Date(Date.UTC(f.getFullYear(), f.getMonth(), f.getDate()) + (h + 5) * 36e5); }
function icsTexto(s) { return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n'); }
/* líneas de máximo 75 bytes (regla del formato) */
function icsDoblar(l) { var o = [], b = ''; Array.from(l).forEach(function (ch) { if (unescape(encodeURIComponent(b + ch)).length > 74) { o.push(b); b = ' ' + ch; } else b += ch; }); o.push(b); return o.join('\r\n'); }

function icsEventos(que) {
  var ev = [], ahora = new Date();
  // 1) cuándo salen las reservas (con alarma 30 min antes y el día anterior)
  if (que !== 'plan') RESERVAS.forEach(function (r) {
    var x = filaReserva(r, ahora, hechas()); if (!x || x.hecha || !x.n) return;
    var c = cuandoSale(r, x.n);
    if (r.sale.tipo === 'compra') { ev.push({ id: 'res-' + r.id, ini: new Date(Math.max(ahora.getTime() + 36e5, new Date(2026, 9, 8, 9).getTime())), min: 30, t: '🎟️ Comprar: ' + r.n, d: r.que + ' ' + r.cambio, u: r.u, alarmas: [0] }); return; }
    if (!c || c.t < ahora) return;
    ev.push({ id: 'res-' + r.id, ini: c.t, min: 30, t: (c.limite ? '⏳ Último día: ' : '🎟️ Salen: ') + r.n + ' (para el ' + fechaCorta(x.n) + ')', d: r.que + ' Si se agotan: ' + r.segunda + ' Si no van: ' + r.noVan, u: r.u, alarmas: [30, 1440] });
  });
  // 2) pendientes antes del viaje que tienen fecha (check-in, seguro…)
  if (que !== 'plan' && typeof PREPARAR !== 'undefined') PREPARAR.forEach(function (g) { g.items.forEach(function (it) { if (it.fecha && !(MIPLAN.chk || {})[it.id]) { var f = new Date(it.fecha); if (f > ahora) ev.push({ id: 'prep-' + it.id, ini: f, min: 30, t: '🧳 ' + it.t, d: it.d || '', alarmas: [0, 1440] }); } }); });
  // 3) actividades con hora de cada día del plan
  if (que !== 'reservas') DAYS.forEach(function (d, k) {
    var n = k + 1;
    var con = d.acts.map(function (a) { return { h: horaNum(a[0]), t: a[1] }; }).filter(function (a) { return a.h != null; });
    con.forEach(function (a, j) {
      var fin = con[j + 1] && con[j + 1].h > a.h ? Math.min(con[j + 1].h, a.h + 3) : a.h + 1;
      ev.push({ id: 'dia' + n + '-' + j, ini: icsInstante(n, a.h), min: Math.round((fin - a.h) * 60), t: a.t.length > 70 ? a.t.slice(0, 68) + '…' : a.t, d: 'Día ' + n + ' · ' + d.title + '\n' + a.t, alarmas: [30] });
    });
  });
  return ev;
}
function icsArmar(que) {
  var L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//JD & Santi On Tour//ES', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:JD & Santi On Tour'], st = icsFecha(new Date());
  icsEventos(que).forEach(function (e) {
    L.push('BEGIN:VEVENT', 'UID:' + e.id + '-' + (MIPLAN.modificado || 0) + '@jd-santi-on-tour', 'DTSTAMP:' + st);
    L.push('DTSTART:' + icsFecha(e.ini), 'DTEND:' + icsFecha(new Date(e.ini.getTime() + e.min * 6e4)));
    L.push('SUMMARY:' + icsTexto(e.t), 'DESCRIPTION:' + icsTexto(e.d + (e.u ? '\n' + e.u : '')));
    if (e.u) L.push('URL:' + e.u);
    (e.alarmas || []).forEach(function (m) { L.push('BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsTexto(e.t), 'TRIGGER:-PT' + m + 'M', 'END:VALARM'); });
    L.push('END:VEVENT');
  });
  L.push('END:VCALENDAR');
  return L.map(icsDoblar).join('\r\n') + '\r\n';
}
/* Descarga o comparte el archivo: el celular lo abre con su app de Calendario */
function exportarCalendario(que) {
  var txt = icsArmar(que), nombre = 'jd-santi-on-tour-' + (que || 'todo') + '.ics', n = (txt.match(/BEGIN:VEVENT/g) || []).length;
  var arch = typeof File === 'function' ? new File([txt], nombre, { type: 'text/calendar' }) : null;
  var esMovil = /iPhone|iPad|Android/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Mac/.test(navigator.userAgent));
  if (esMovil && arch && navigator.canShare && navigator.canShare({ files: [arch] })) {
    navigator.share({ files: [arch], title: 'JD & Santi On Tour' }).catch(function () { descargarIcs(txt, nombre); });
  } else descargarIcs(txt, nombre);
  toast('📅 ' + n + ' eventos con alarma listos para el calendario');
  return n;
}
function descargarIcs(txt, nombre) {
  var u = URL.createObjectURL(new Blob([txt], { type: 'text/calendar;charset=utf-8' })), a = document.createElement('a');
  a.href = u; a.download = nombre; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(function () { URL.revokeObjectURL(u); }, 4000);
}
