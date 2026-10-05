/* JD & Santi On Tour · pestaña Inglés: frases con voz normal o lenta, práctica con micrófono,
   tarjetas al azar, simulacro de migración y sonidos difíciles. */
var ING = { cat: '', q: '', lento: false, hechas: {}, carta: null, ver: false };
try { var _ig = JSON.parse(localStorage.getItem('guiaIngles') || '{}'); ING.hechas = _ig.hechas || {}; ING.lento = !!_ig.lento; } catch (e) {}
function ingGuardar() { try { localStorage.setItem('guiaIngles', JSON.stringify({ hechas: ING.hechas, lento: ING.lento })); } catch (e) {} }
var SR = window.SpeechRecognition || window.webkitSpeechRecognition || null;

function todasFrases() { var o = []; PHRASES.forEach(function (s, k) { s.l.forEach(function (x) { o.push({ en: x[0], es: x[1], tip: x[2] || '', cat: s.k, ck: k }); }); }); return o; }
function hablar(t, btn) { speak(t, btn, ING.lento ? 0.62 : 0.9); }
function normal(s) { return sinTilde(String(s).replace(/[’‘]/g, "'")).replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim(); }

/* Compara lo que dijo la persona con la frase: marca cada palabra */
function calificar(objetivo, oido) {
  var ws = normal(objetivo).split(' '), dic = {};
  normal(oido).split(' ').forEach(function (w) { dic[w] = (dic[w] || 0) + 1; });
  var ok = 0, marcas = ws.map(function (w) { var bien = dic[w] > 0; if (bien) { dic[w]--; ok++; } return { w: w, bien: bien }; });
  return { pct: Math.round(ok / Math.max(1, ws.length) * 100), marcas: marcas };
}
function practicar(texto, btn, salida) {
  if (!SR) { toast('Este navegador no permite practicar con el micrófono. Usen 🔊 y repitan en voz alta.'); return; }
  if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
  var rec = new SR(); rec.lang = 'en-US'; rec.interimResults = false; rec.maxAlternatives = 3;
  btn.classList.add('on'); btn.disabled = true; salida.innerHTML = '<span class="esc">🎙️ Escuchando… di la frase en inglés</span>';
  var listo = false;
  rec.onresult = function (e) {
    listo = true; var alts = [].slice.call(e.results[0]).map(function (a) { return a.transcript; }), mejor = null;
    alts.forEach(function (a) { var c = calificar(texto, a); if (!mejor || c.pct > mejor.pct) { mejor = c; mejor.oido = a; } });
    var msg = mejor.pct >= 85 ? '¡Excelente! 🎉' : mejor.pct >= 60 ? '¡Muy bien! Repitan las palabras en naranja.' : 'Casi. Escúchenla en 🐢 lento y vuelvan a intentar.';
    salida.innerHTML = '<div class="nota ' + (mejor.pct >= 85 ? 'g' : mejor.pct >= 60 ? 's' : 'o') + '"><b>' + mejor.pct + '%</b> · ' + msg + '<div class="palabras">' + mejor.marcas.map(function (m) { return '<span class="' + (m.bien ? 'ok' : 'mal') + '">' + esc(m.w) + '</span>'; }).join(' ') + '</div><small>Se entendió: “' + esc(mejor.oido) + '”</small></div>';
    if (mejor.pct >= 85) { ING.hechas[texto] = 1; ingGuardar(); pintarProgreso(); }
  };
  rec.onerror = function (e) { listo = true; salida.innerHTML = '<div class="nota o">' + (e.error === 'not-allowed' ? 'Permite el micrófono para esta página en los ajustes del navegador.' : e.error === 'no-speech' ? 'No se escuchó nada. Intenta otra vez, un poco más cerca.' : 'No se pudo usar el micrófono (' + esc(e.error) + '). Puede necesitar internet.') + '</div>'; };
  rec.onend = function () { btn.classList.remove('on'); btn.disabled = false; if (!listo) salida.innerHTML = ''; };
  try { rec.start(); } catch (e) { btn.classList.remove('on'); btn.disabled = false; salida.innerHTML = ''; }
}

function filaFrase(f, idx) {
  var hecha = !!ING.hechas[f.en];
  return '<div class="phr2' + (hecha ? ' hecha' : '') + '" data-idx="' + idx + '"><div class="ptx"><b>' + esc(f.en) + '</b><small>' + esc(f.es) + '</small>' + (f.tip ? '<small class="tip">🗣️ ' + esc(f.tip) + '</small>' : '') + '<div class="psal"></div></div>' +
    '<div class="pbtn"><button class="say" data-act="oir" aria-label="Escuchar">🔊</button>' + (SR ? '<button class="say mic" data-act="mic" aria-label="Practicar con el micrófono">🎤</button>' : '') + '<button class="say chk" data-act="ok" aria-label="Marcar como aprendida" aria-pressed="' + hecha + '">' + (hecha ? '✓' : '○') + '</button></div></div>';
}
function pintarProgreso() {
  var t = todasFrases().length, n = todasFrases().filter(function (f) { return ING.hechas[f.en]; }).length, e = document.getElementById('ingProg');
  if (e) e.innerHTML = '<b>' + n + '</b> de ' + t + ' frases aprendidas<span class="gbar-t"><i style="width:' + (n / t * 100).toFixed(1) + '%"></i></span>';
}

function renderIngles() {
  var F = todasFrases();
  var h = '<h2 class="big">Inglés en la calle</h2><p class="lead">Escuchen cada frase, repítanla y practiquen con el micrófono. 🔊 funciona sin internet en la mayoría de iPads y celulares.</p>';
  h += '<div class="card ingtop"><div id="ingProg" class="ingprog"></div><div class="row"><div class="toggle2" role="group" aria-label="Velocidad"><button data-vel="n"' + (ING.lento ? '' : ' class="on"') + '>🐇 Normal</button><button data-vel="l"' + (ING.lento ? ' class="on"' : '') + '>🐢 Lento</button></div><button class="btn or" id="ingCarta">🎲 Practicar al azar</button></div>' +
    (SR ? '' : '<p class="gnota">Este navegador no permite el micrófono aquí: escuchen con 🔊 y repitan en voz alta. En iPhone y iPad, Safari sí lo permite.</p>') + '<div id="ingCartaBox"></div></div>';
  // simulacro de migración
  h += '<details class="card simul"' + (ING.cat === '' && !ING.q ? ' open' : '') + '><summary><h3 class="gh3">🛂 Simulacro de migración</h3><span class="pill o">Lo primero que van a hablar en inglés</span></summary><p class="gnota">El oficial pregunta (🔊) y ustedes contestan. Digan que vienen de turismo y a visitar a unos amigos.</p><ol class="dialogo">' +
    SIMULACRO.map(function (x, k) { return '<li><div class="q"><span>👮</span><div><b>' + esc(x[0]) + '</b><small>' + esc(x[1]) + '</small></div><button class="say" data-say2="' + esc(x[0]) + '" aria-label="Escuchar pregunta">🔊</button></div><div class="a"><span>🙋</span><div><b>' + esc(x[2]) + '</b><small>' + esc(x[3]) + '</small><div class="psal" id="sim' + k + '"></div></div><button class="say" data-say2="' + esc(x[2]) + '" aria-label="Escuchar respuesta">🔊</button>' + (SR ? '<button class="say mic" data-mic2="' + esc(x[2]) + '" data-out="sim' + k + '" aria-label="Practicar respuesta">🎤</button>' : '') + '</div></li>'; }).join('') + '</ol></details>';
  // filtros
  h += '<div class="ingfil"><input id="ingQ" type="search" placeholder="🔎 Buscar frase en inglés o español" value="' + esc(ING.q) + '" autocomplete="off"><nav class="chips" id="ingCats"><button class="chip sm' + (ING.cat === '' ? ' on' : '') + '" data-cat="">Todas</button>' + PHRASES.map(function (s, k) { return '<button class="chip sm' + (ING.cat === String(k) ? ' on' : '') + '" data-cat="' + k + '">' + esc(s.k) + '</button>'; }).join('') + '</nav></div>';
  h += '<div id="ingLista"></div>';
  // sonidos difíciles
  h += '<div class="card"><h3 class="gh3">👂 Sonidos difíciles</h3><p class="gnota">Toquen cada palabra y escuchen la diferencia. Son los errores más comunes de quienes hablan español.</p><div class="sonidos">' + SONIDOS.map(function (s) { return '<div class="box"><h4>' + esc(s.t) + '</h4><div class="gchips">' + s.p.map(function (w) { return '<button class="chip sm" data-say2="' + esc(w[0]) + '">🔊 ' + esc(w[0]) + ' <small>' + esc(w[1]) + '</small></button>'; }).join('') + '</div></div>'; }).join('') + '</div></div>';
  h += '<div class="card"><h3 class="gh3">🎯 Retos del viaje</h3><div class="grid2">' + DAYS.filter(function (d) { return d.en; }).map(function (d) { return '<div class="box"><h4>' + (d.n.indexOf('–') > -1 ? 'Días ' : 'Día ') + d.n + '</h4>' + esc(d.en) + '</div>'; }).join('') + '</div></div>';
  h += '<div class="card"><h3 class="gh3">💡 Para aprender más rápido</h3><div class="grid2"><div class="box">Pidan siempre ustedes, aunque se equivoquen. Los meseros están acostumbrados.</div><div class="box">Si no entienden: <b>“Sorry, could you repeat that?”</b></div><div class="box">Cada noche, cuenten el día en inglés en un audio de 1 minuto.</div><div class="box">Usen 🐢 lento para copiar el ritmo y luego 🐇 normal.</div></div></div>';
  var el = document.getElementById('v-ingles'); el.innerHTML = h;
  pintarProgreso(); pintarFrases();
  [].forEach.call(el.querySelectorAll('[data-vel]'), function (b) { b.onclick = function () { ING.lento = b.dataset.vel === 'l'; ingGuardar(); [].forEach.call(el.querySelectorAll('[data-vel]'), function (x) { x.classList.toggle('on', x === b); }); toast(ING.lento ? 'Voz lenta 🐢' : 'Voz normal 🐇'); }; });
  [].forEach.call(el.querySelectorAll('[data-say2]'), function (b) { b.onclick = function () { hablar(b.dataset.say2, b.classList.contains('say') ? b : null); }; });
  [].forEach.call(el.querySelectorAll('[data-mic2]'), function (b) { b.onclick = function () { practicar(b.dataset.mic2, b, document.getElementById(b.dataset.out)); }; });
  [].forEach.call(el.querySelectorAll('[data-cat]'), function (b) { b.onclick = function () { ING.cat = b.dataset.cat; [].forEach.call(el.querySelectorAll('[data-cat]'), function (x) { x.classList.toggle('on', x === b); }); pintarFrases(); }; });
  document.getElementById('ingQ').oninput = function (e) { ING.q = e.target.value; pintarFrases(); };
  document.getElementById('ingCarta').onclick = function () { nuevaCarta(); };
  if (ING.carta) pintarCarta();
}
function pintarFrases() {
  var F = todasFrases(), q = normal(ING.q), cont = document.getElementById('ingLista'); if (!cont) return;
  var vis = F.map(function (f, i) { return [f, i]; }).filter(function (x) { var f = x[0]; return (ING.cat === '' || String(f.ck) === ING.cat) && (!q || normal(f.en + ' ' + f.es).indexOf(q) > -1); });
  var h = '', last = null;
  vis.forEach(function (x) { if (x[0].cat !== last) { if (last !== null) h += '</div>'; h += '<div class="card"><h3 class="gh3">' + esc(x[0].cat) + '</h3>'; last = x[0].cat; } h += filaFrase(x[0], x[1]); });
  if (last !== null) h += '</div>'; else h = '<div class="card"><p class="lead" style="margin:0">Ninguna frase con “' + esc(ING.q) + '”.</p></div>';
  cont.innerHTML = h;
  [].forEach.call(cont.querySelectorAll('.phr2'), function (row) {
    var f = F[+row.dataset.idx];
    row.querySelector('[data-act="oir"]').onclick = function (e) { hablar(f.en, e.currentTarget); };
    var mic = row.querySelector('[data-act="mic"]'); if (mic) mic.onclick = function () { practicar(f.en, mic, row.querySelector('.psal')); };
    row.querySelector('[data-act="ok"]').onclick = function (e) { var b = e.currentTarget; if (ING.hechas[f.en]) delete ING.hechas[f.en]; else ING.hechas[f.en] = 1; ingGuardar(); var on = !!ING.hechas[f.en]; row.classList.toggle('hecha', on); b.textContent = on ? '✓' : '○'; b.setAttribute('aria-pressed', on); pintarProgreso(); };
  });
}
/* Tarjeta al azar: ven el español y dicen la frase en inglés */
function nuevaCarta() {
  var F = todasFrases(), pend = F.filter(function (f) { return !ING.hechas[f.en]; }), base = pend.length ? pend : F;
  ING.carta = base[Math.floor(Math.random() * base.length)]; ING.ver = false; pintarCarta();
}
function pintarCarta() {
  var c = ING.carta, box = document.getElementById('ingCartaBox'); if (!box || !c) return;
  box.innerHTML = '<div class="carta"><small>' + esc(c.cat) + ' · ¿Cómo se dice en inglés?</small><p class="es">' + esc(c.es) + '</p>' + (ING.ver ? '<p class="en">' + esc(c.en) + '</p>' + (c.tip ? '<small class="tip">🗣️ ' + esc(c.tip) + '</small>' : '') : '') + '<div class="psal" id="cartaSal"></div><div class="row">' +
    (ING.ver ? '<button class="btn pri" id="cOir">🔊 Escuchar</button>' : '<button class="btn pri" id="cVer">👀 Mostrar en inglés</button>') + (SR ? '<button class="btn" id="cMic">🎤 Decirla</button>' : '') + '<button class="btn" id="cOk">✓ Me la sé</button><button class="btn" id="cOtra">Otra ›</button><button class="btn" id="cFin" aria-label="Cerrar">✕</button></div></div>';
  var v = document.getElementById('cVer'); if (v) v.onclick = function () { ING.ver = true; pintarCarta(); hablar(c.en); };
  var o = document.getElementById('cOir'); if (o) o.onclick = function () { hablar(c.en, o); };
  var m = document.getElementById('cMic'); if (m) m.onclick = function () { practicar(c.en, m, document.getElementById('cartaSal')); };
  document.getElementById('cOk').onclick = function () { ING.hechas[c.en] = 1; ingGuardar(); pintarProgreso(); pintarFrases(); toast('¡Una menos! 💪'); nuevaCarta(); };
  document.getElementById('cOtra').onclick = nuevaCarta;
  document.getElementById('cFin').onclick = function () { ING.carta = null; box.innerHTML = ''; };
}
