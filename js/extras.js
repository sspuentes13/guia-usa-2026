/* JD & Santi On Tour · planes extra (teatro barato, patinaje en hielo y misa del domingo).
   Cada plan es un lugar del mapa (P): se agrega a un día con el mismo selector del plan
   y entra a la ruta, al cronograma, a los avisos y al presupuesto de ese día. */

var TIPOS_EXTRA = { misa: '⛪ Misa del domingo', hielo: '⛸️ Patinar en hielo', teatro: '🎭 Teatro y shows baratos', deporte: '🏀 Partidos baratos' };

function idxExtra(x) { return idxLugar(x.lugar); }
/* Días en que se puede hacer (según funciones, temporada o domingos) */
function diasPosibles(i) {
  var H = horario(i), o = [];
  for (var n = 3; n <= 24; n++) { var oc = abreCierra(H, fechaDia(n).getDay(), isoDia(n)); if (oc !== null) o.push(n); }
  return o;
}
/* Mejor día sugerido: de los posibles, primero el que trae en el plan; si no, días libres o de la misma ciudad */
function diaSugerido(x) {
  var i = idxExtra(x), p = P[i], pos = diasPosibles(i), hoyN = diaDeHoy();
  pos = pos.filter(function (n) { return hoyN < 1 || n >= hoyN; });
  if (x.sugerido && DIA_DE[x.sugerido] && pos.indexOf(DIA_DE[x.sugerido]) > -1) return DIA_DE[x.sugerido];
  var libres = pos.filter(function (n) { return !esPaseo(DAYS[n - 1].id) && !DAYS[n - 1].fijo; });
  var misma = pos.filter(function (n) { return DAYS[n - 1].city === p.c; });
  if (['ny', 'bal', 'phi', 'del'].indexOf(p.c) > -1) return misma[0] || null;   // fuera de Arlington y DC solo sirve el día de esa ciudad
  libres = libres.filter(function (n) { return ['arl', 'dc'].indexOf(DAYS[n - 1].city) > -1; });
  return libres[0] || misma[0] || pos[0] || null;
}

function planesExtraHTML() {
  if (typeof PLANES_EXTRA === 'undefined') return '';
  var h = '<div class="card extras"><div class="row spread"><h3 class="gh3">✨ Planes extra</h3><small>Teatro barato, patinaje y misa: agréguenlos a un día y entran al cronograma</small></div>';
  Object.keys(TIPOS_EXTRA).forEach(function (t) {
    var L = PLANES_EXTRA.filter(function (x) { return x.tipo === t && idxExtra(x) > -1; });
    if (!L.length) return;
    h += '<h4 class="gh4">' + TIPOS_EXTRA[t] + '</h4><div class="extragrid">';
    L.forEach(function (x) {
      var i = idxExtra(x), p = P[i], ds = diasDe(p), sug = ds.length ? null : diaSugerido(x);
      h += '<article class="extra' + (ds.length ? ' en' : '') + '"><div class="extra-h"><span class="extra-e">' + emo(p) + '</span><div><b>' + esc(x.t) + '</b><small>' + esc(p.n) + ' · ' + esc(CITYNAME[p.c]) + '</small></div></div>' +
        '<div class="extra-p"><span class="pill o">' + esc(x.precio) + '</span>' + (x.idioma ? '<span class="pill">' + esc(x.idioma) + '</span>' : '') + (ds.length ? '<span class="pill g">✓ ' + ds.map(etiquetaDia).join(' y ') + '</span>' : '') + '</div>' +
        '<p>' + esc(x.por) + '</p><small>🕘 ' + esc(x.cuando) + '</small>' + (x.como ? '<small>🎟️ ' + esc(x.como) + '</small>' : '') + (x.conf ? '<small><i>Confirmen cerca de la fecha: ' + esc(x.conf) + '</i></small>' : '') +
        (!ds.length && sug ? '<small class="okt">💡 Mejor día: ' + etiquetaDia(sug) + ' (' + esc(DAYS[sug - 1].title) + ')</small>' : '') +
        '<div class="row">' + (ds.length ? '<button class="btn sm" data-xmv="' + i + '">📅 Cambiar de día</button><button class="btn sm" data-xq="' + i + '">Quitar</button>' :
          (sug ? '<button class="btn sm or" data-xadd="' + i + '" data-n="' + sug + '">＋ Agregar al ' + fechaCorta(sug) + '</button>' : '') + '<button class="btn sm" data-xmv="' + i + '">📅 Otro día</button>') +
        '<button class="btn sm" data-pl="' + i + '">🗺️ Ver</button>' + (x.u ? '<a class="btn sm" href="' + x.u + '" target="_blank" rel="noopener">' + (t === 'misa' ? 'Horarios ↗' : 'Entradas ↗') + '</a>' : '') + '</div></article>';
    });
    h += '</div>';
  });
  return h + '</div>';
}
function bindExtras(el) {
  [].forEach.call(el.querySelectorAll('[data-xadd]'), function (b) { b.onclick = function () { planMoverLugar(+b.dataset.xadd, null, DAYS[+b.dataset.n - 1].id); }; });
  [].forEach.call(el.querySelectorAll('[data-xmv]'), function (b) { b.onclick = function () { var i = +b.dataset.xmv; elegirDiaLugar(i, bloquesDe(P[i])[0] || null); }; });
  [].forEach.call(el.querySelectorAll('[data-xq]'), function (b) { b.onclick = function () { var i = +b.dataset.xq; bloquesDe(P[i]).forEach(function (bl) { planMoverLugar(i, bl, null); }); }; });
}
