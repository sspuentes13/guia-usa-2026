/* JD & Santi On Tour · rutas del día ordenadas por cercanía y análisis de actividades.
   Regla: lo que tiene hora fija (amanecer, atardecer, de noche, tour con reserva, show, tren)
   se queda en su momento; el resto se acomoda donde agregue menos camino. */

var RUTA_A_PIE_MAX = 2.0;   // km: tramos más largos se hacen en metro, tren o Uber
var RUTA_STOP = ['memorial', 'museo', 'museum', 'center', 'market', 'park', 'station', 'gratis', 'national', 'washington', 'puente', 'estacion'];

function sinTilde(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }

/* diasDe(p) y diaDeN(n) están en js/plan.js: dependen del plan que eligieron */

function horaNum(t) { var m = /(\d{1,2})[:.](\d{2})/.exec(t || ''); return m ? +m[1] + m[2] / 60 : null; }
function horaTxt(h) { var hh = Math.floor(h), mm = Math.round((h - hh) * 60); return hh + ':' + ('0' + mm).slice(-2); }

/* Actividad del día que menciona el lugar (para tomar su hora) */
/* palabras con que el itinerario nombra algunos lugares */
var ALIAS_ACT = { 'Museo Afroamericano': ['afroamericana'], 'Memorial de MLK': ['mlk'], 'National Zoo': ['zoo'], 'Old Town Alexandria': ['mercado campesino'], 'Memorial del 11-S': ['11-s'], 'Toro de Wall Street': ['toro'], 'Bethesda Fountain': ['bethesda'], 'Bow Bridge': ['bow bridge'] };
function actDe(p, d) {
  if (!d) return null;
  var toks = sinTilde(p.n).split(/[^a-z0-9]+/).filter(function (t) { return t.length >= 5 && RUTA_STOP.indexOf(t) < 0; }).concat(ALIAS_ACT[p.n] || []);
  for (var k = 0; k < d.acts.length; k++) {
    var a = sinTilde(d.acts[k][1]);
    if (toks.some(function (t) { return a.indexOf(t) > -1; })) return d.acts[k];
  }
  return null;
}

/* Hora fija de un lugar en un día, o null si se puede mover */
function horaFija(p, n) {
  var act = actDe(p, diaDeN(n)), at = act ? horaNum(act[0]) : null, a = act ? sinTilde(act[1]) : '', h = sinTilde(p.h), ht = horaNum(p.h);
  function luz(s, t) {
    if (/amanecer/.test(s)) return { t: t != null ? t : 6.75, por: 'amanecer' };
    if (/atardecer|puesta/.test(s)) return { t: t != null ? t : 16.75, por: 'atardecer' };
    if (/de noche|iluminad/.test(s)) return { t: t != null ? t : 19, por: 'de noche' };
    return null;
  }
  var r = (act && luz(a, at)) || luz(h, ht != null ? ht : at);           // primero lo que dice el plan del día
  if (r && r.por === 'atardecer' && typeof solDia === 'function') {       // si el día cambió, el sol se pone a otra hora
    var d = diaDeN(n), s = solDia(n, d ? d.city : 'dc').puesta / 60;
    if (r.t > s + 5 / 60) r.t = s - 25 / 60;
  }
  if (r) return r;
  if (/show|tour|tiquete|reserva/.test(h + ' ' + a)) { var t = at != null ? at : ht; if (t != null) return { t: t, por: /show/.test(h + a) ? 'show' : 'reserva' }; }
  if (act && at != null) return { t: at, por: 'plan', act: act[1] };                      // hora del itinerario (auditado)
  var hasta = /hasta las (\d{1,2})/.exec(h);
  if (hasta) return { t: +hasta[1] - 2.5, por: 'temprano' };
  var rango = /\d{1,2}:\d{2}\s*(a|–|-)\s*\d/.test(h);                       // "10:00 a 17:00" es horario de apertura
  if (ht != null && !rango && !/abre|desde las/.test(h)) return { t: ht, por: 'plan' };
  if (/toda la manana|^manana/.test(h)) return { t: 9.5, por: 'mañana' };
  if (/mediodia|almuerzo/.test(h)) return { t: 12, por: 'almuerzo' };
  if (/tarde/.test(h)) return { t: 15, por: 'tarde' };
  return null;
}

/* ¿Se puede poner un lugar libre en esta posición? No antes de algo fijo de la mañana
   (amanecer, tour de las 9) ni después de un atardecer o de algo de noche. */
function posValida(pos, seq, fijo, est) {
  var ini = seq[0], fin = seq[seq.length - 1];
  if (pos === 0 && ini != null && (ini === est || (fijo[ini] && fijo[ini].t <= 10))) return false;
  if (pos === seq.length && fin != null && fijo[fin] && fijo[fin].t >= 16) return false;
  return true;
}

/* Lugares de un día (sin estaciones de otras ciudades) */
function paradasDia(n) {
  var d = diaDeN(n), base = d ? d.city : null, o = [];
  P.forEach(function (p, i) {
    if (diasDe(p).indexOf(n) < 0) return;
    if (p.cat === 'transporte' && p.c !== base) return;   // p. ej. Union Station en el día de Baltimore
    o.push(i);
  });
  return o;
}

function largo(orden) { var k = 0; for (var j = 1; j < orden.length; j++) k += hav(P[orden[j - 1]].ll, P[orden[j]].ll); return k; }
/* Esfuerzo de una ruta: caminar pesa más que un tramo largo en metro o tren */
function esfuerzo(orden) { var k = 0; for (var j = 1; j < orden.length; j++) { var d = hav(P[orden[j - 1]].ll, P[orden[j]].ll); k += d <= RUTA_A_PIE_MAX ? d : RUTA_A_PIE_MAX + (d - RUTA_A_PIE_MAX) * 0.35; } return k; }

/* Orden por cercanía respetando las horas fijas */
function ordenCercano(n, ids) {
  if (ids.length < 2) return ids.slice();
  var fijo = {}, libres = [], seq = [];
  ids.forEach(function (i) {
    var p = P[i], f = horaFija(p, n);
    if (p.cat === 'transporte') f = { t: -1, por: 'llegada' };          // la estación abre el día
    if (f) { fijo[i] = f; seq.push(i); } else libres.push(i);
  });
  seq.sort(function (a, b) { return fijo[a].t - fijo[b].t; });
  // la estación de llegada también cierra el día si hay regreso en tren
  var est = seq.filter(function (i) { return P[i].cat === 'transporte'; })[0];
  var cierra = est != null && /regreso/i.test(P[est].h);
  if (!seq.length) { seq.push(libres.shift()); }
  // inserción más barata de cada lugar libre (empezando por los más lejanos del resto)
  libres.sort(function (a, b) { return lejania(b, ids) - lejania(a, ids); });
  libres.forEach(function (i) {
    var mejor = 0, costo = Infinity;
    for (var pos = 0; pos <= seq.length; pos++) {
      if (!posValida(pos, seq, fijo, est)) continue;
      var a = pos > 0 ? P[seq[pos - 1]].ll : null, b = pos < seq.length ? P[seq[pos]].ll : null, c = P[i].ll;
      var add = (a ? hav(a, c) : 0) + (b ? hav(c, b) : 0) - (a && b ? hav(a, b) : 0);
      if (add < costo - 1e-9) { costo = add; mejor = pos; }
    }
    seq.splice(mejor, 0, i);
  });
  // mejora: mover cada lugar libre a la mejor posición mientras se acorte la ruta
  for (var vuelta = 0; vuelta < 4; vuelta++) {
    var mejoro = false;
    libres.forEach(function (i) {
      var sin = seq.filter(function (x) { return x !== i; }), base = esfuerzo(seq), mejorSeq = null;
      for (var pos = 0; pos <= sin.length; pos++) {
        if (!posValida(pos, sin, fijo, est)) continue;
        var prueba = sin.slice(0, pos).concat([i], sin.slice(pos));
        if (esfuerzo(prueba) < base - 1e-6) { base = esfuerzo(prueba); mejorSeq = prueba; }
      }
      if (mejorSeq) { seq = mejorSeq; mejoro = true; }
    });
    if (!mejoro) break;
  }
  if (cierra && seq[seq.length - 1] !== est) seq.push(est);
  return seq;
}
function lejania(i, ids) { var s = 0; ids.forEach(function (j) { if (j !== i) s += hav(P[i].ll, P[j].ll); }); return s; }

/* Orden original del plan: numeración del mapa */
function ordenPlan(n, ids) {
  var d = diaDeN(n), base = d ? d.city : null, k = function (i) { return (P[i].c === base ? 0 : 1000) + numOf(i); };
  var o = ids.slice().sort(function (a, b) { return k(a) - k(b) || a - b; });
  var est = o.filter(function (i) { return P[i].cat === 'transporte'; })[0];
  if (est != null) { o = o.filter(function (i) { return i !== est; }); o.unshift(est); if (/regreso/i.test(P[est].h)) o.push(est); }
  return o;
}

/* ¿Las horas fijas van en orden? */
function respetaHoras(orden, n) { var ult = -1; for (var k = 0; k < orden.length; k++) { if (P[orden[k]].cat === 'transporte') continue; var x = horaFija(P[orden[k]], n); if (!x) continue; if (x.t < ult) return false; ult = x.t; } return true; }

/* Tramos con distancia y modo (a pie o transporte) */
function tramos(orden) {
  var t = [];
  for (var j = 1; j < orden.length; j++) {
    var a = P[orden[j - 1]], b = P[orden[j]], k = hav(a.ll, b.ll);
    t.push({ de: orden[j - 1], a: orden[j], km: k, pie: k <= RUTA_A_PIE_MAX });
  }
  return t;
}
function minPie(k) { return Math.round(k * 1.25 / 4.8 * 60); }
function minTransporte(k) { return Math.round(12 + k * 2.2); }
function durTxt(m) { return m < 60 ? m + ' min' : Math.floor(m / 60) + ' h' + (m % 60 ? ' ' + (m % 60) + ' min' : ''); }

var _rutaCache = {};
function rutaDia(n) {
  if (_rutaCache[n]) return _rutaCache[n];
  var ids = paradasDia(n), plan = ordenPlan(n, ids), cerca = ordenCercano(n, ids);
  function resumen(orden) {
    var tr = tramos(orden), pie = 0, trans = 0, nT = 0;
    tr.forEach(function (x) { if (x.pie) pie += x.km; else { trans += x.km; nT++; } });
    return { orden: orden, tramos: tr, kmPie: pie * 1.25, minPie: minPie(pie), kmTrans: trans, nTrans: nT, minTrans: tr.filter(function (x) { return !x.pie; }).reduce(function (s, x) { return s + minTransporte(x.km); }, 0) };
  }
  var r = { n: n, dia: diaDeN(n), ids: ids, plan: resumen(plan), cerca: resumen(cerca) };
  // si el orden "cercano" no mejora, se queda el del plan
  if (esfuerzo(cerca) > esfuerzo(plan) + 0.01 && respetaHoras(plan, n)) r.cerca = r.plan;   // el del plan solo si es más corto y respeta las horas
  r.ahorroKm = Math.max(0, (largo(plan) - largo(r.cerca.orden)) * 1.25);
  r.ahorroPie = Math.max(0, r.plan.kmPie - r.cerca.kmPie);
  r.yaOptimo = r.cerca.orden.join() === r.plan.orden.join();
  r.viaje = !!(r.dia && r.dia.city === 'col') || ids.every(function (i) { return P[i].cat === 'transporte'; });
  _rutaCache[n] = r;
  return r;
}

/* Días con lugares (para mapas y análisis) */
function diasConLugares(ciudad) {
  var s = {};
  P.forEach(function (p) {
    if (ciudad && p.c !== ciudad) return;
    diasDe(p).forEach(function (n) { if (paradasDia(n).some(function (i) { return P[i].c === (ciudad || P[i].c) && P[i].cat !== 'transporte'; })) s[n] = 1; });
  });
  return Object.keys(s).map(Number).sort(function (a, b) { return a - b; });
}

/* Google Maps con todas las paradas (máximo 9 intermedias) */
function gmRuta(orden) {
  var pts = orden.map(function (i) { return P[i].ll.join(','); });
  var dedup = pts.filter(function (x, k) { return k === 0 || x !== pts[k - 1]; });
  if (dedup.length < 2) return gmPlace(P[orden[0]]);
  var mid = dedup.slice(1, -1).slice(0, 9);
  var largos = tramos(orden).some(function (t) { return !t.pie; });
  return 'https://www.google.com/maps/dir/?api=1&origin=' + dedup[0] + '&destination=' + dedup[dedup.length - 1] +
    (mid.length ? '&waypoints=' + encodeURIComponent(mid.join('|')) : '') + '&travelmode=' + (largos ? 'transit' : 'walking');
}

/* Intensidad del día para el análisis */
function intensidad(r) {
  var lug = r.ids.filter(function (i) { return P[i].cat !== 'transporte'; }).length, k = r.cerca.kmPie;
  var pts = lug * 1 + k * 1.2 + r.cerca.nTrans * 0.8;
  return pts >= 14 ? { t: 'Muy intenso', c: 'r', e: '🔥' } : pts >= 8 ? { t: 'Intenso', c: 'o', e: '⚡' } : pts >= 3 ? { t: 'Moderado', c: 's', e: '🙂' } : { t: 'Suave', c: 'g', e: '😌' };
}
