/* JD & Santi On Tour · 🎫 pases reservados (tickets, QR y confirmaciones).
   La página es pública, así que los archivos están cifrados en pases/ (ver herramientas/cifrar-pases.js).
   Cada teléfono escribe la clave una vez y queda guardada solo en ese teléfono.
   Valida cada pase contra el plan y avisa qué reserva marcada con ✓ no tiene ticket en la carpeta. */
var PASES = null, pz = { llave: null, abriendo: null, err: '', urls: {} };

function pzClave() { try { return localStorage.getItem('guiaPasesClave') || ''; } catch (e) { return ''; } }
function pzB64(s) { var b = atob(s), u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
function pzBajar(f) { return fetch('pases/' + f).then(function (r) { if (!r.ok) throw new Error('No se pudo descargar el pase.'); return r.arrayBuffer(); }); }
function pzDescifrar(buf) { var u = new Uint8Array(buf); return crypto.subtle.decrypt({ name: 'AES-GCM', iv: u.slice(0, 12) }, pz.llave, u.slice(12)); }

function pasesAbrir(clave) {
  clave = String(clave || '').trim().toLowerCase();
  if (!window.crypto || !crypto.subtle) return Promise.reject(new Error('Este navegador no puede abrir los pases. Usen Safari o Chrome.'));
  var L;
  pz.abriendo = fetch('pases/lista.json').then(function (r) { if (!r.ok) throw new Error('Sin internet: abran la guía una vez con wifi.'); return r.json(); }).then(function (x) {
    L = x;
    return crypto.subtle.importKey('raw', new TextEncoder().encode(clave), 'PBKDF2', false, ['deriveKey']);
  }).then(function (k) {
    return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: pzB64(L.sal), iterations: L.iter, hash: 'SHA-256' }, k, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
  }).then(function (llave) { pz.llave = llave; return pzBajar(L.indice); }).then(pzDescifrar).then(function (b) {
    PASES = JSON.parse(new TextDecoder().decode(b)); pz.err = '';
    try { localStorage.setItem('guiaPasesClave', clave); } catch (e) {}
    L.archivos.forEach(function (f) { fetch('pases/' + f).catch(function () {}); });   // quedan guardados para usar sin internet
    return PASES;
  }).catch(function (e) {
    pz.llave = null; PASES = null;
    pz.err = e && e.name === 'OperationError' ? 'Clave incorrecta.' : (e && e.message) || 'No se pudieron abrir los pases.';
    throw new Error(pz.err);
  }).then(function (x) { pz.abriendo = null; return x; }, function (e) { pz.abriendo = null; throw e; });
  return pz.abriendo;
}
function pasesOlvidar() { try { localStorage.removeItem('guiaPasesClave'); } catch (e) {} PASES = null; pz.llave = null; Object.keys(pz.urls).forEach(function (k) { URL.revokeObjectURL(pz.urls[k]); }); pz.urls = {}; }
function pzRefrescar() { if (typeof tab !== 'undefined' && tab === 'inicio') renderInicio(); }

/* ---------- validación contra el plan ---------- */
function pasesDeRes(id) { return (PASES || []).filter(function (p) { return p.res === id; }); }
function pzReserva(p) { return RESERVAS.filter(function (r) { return r.id === p.res; })[0] || null; }
function pzDiaPlan(p) { var r = pzReserva(p), i = r ? idxLugar(r.lugar) : -1; return i > -1 ? diasDe(P[i])[0] || 0 : 0; }
function pzHoraPlan(p, n) { var r = pzReserva(p), i = r ? idxLugar(r.lugar) : -1, f = i > -1 && n ? horaFija(P[i], n) : null; return f ? horaTxt(f.t) : ''; }
/* Las reservas con ticket cuentan como hechas para la fecha del ticket (manda el ticket, no el ✓) */
function pasesComoRes(x) {
  var o = Object.assign({}, x);
  (PASES || []).forEach(function (p) {
    if (!p.res) return;
    var n = pzDiaPlan(p), f = p.fecha || (o[p.res] && o[p.res].f) || (n ? isoDia(n) : null);
    if (f) o[p.res] = { f: f, pase: p.id };
  });
  return o;
}
function pzEstado(p) {
  var n = pzDiaPlan(p), r = pzReserva(p), hp = pzHoraPlan(p, n);
  if (!n) return { cl: 'o', txt: 'Ese lugar no está en el plan actual: agréguenlo al ' + (p.fecha ? fechaIsoTxt(p.fecha) : 'día de la reserva') + ' en la pestaña Días.' };
  if (!p.fecha) return { cl: 'o', n: n, txt: 'El ticket no muestra la fecha. El plan lo tiene el ' + etiquetaDia(n) + (hp ? ', ' + hp : '') + ': confírmenlo en el correo.' };
  if (p.fecha !== isoDia(n)) return { cl: 'r', n: n, txt: 'El ticket es para el ' + fechaIsoTxt(p.fecha) + ', pero el plan tiene ' + (r ? r.n : p.t) + ' el ' + etiquetaDia(n) + '. ' + (r ? r.cambio : '') };
  if (p.hora && hp && p.hora !== hp) return { cl: 'o', n: n, txt: 'Coincide con el ' + etiquetaDia(n) + ', pero el ticket es a las ' + p.hora + ' y el plan dice ' + hp + '.' };
  return { cl: 'g', n: n, txt: '✓ Coincide con el plan: ' + etiquetaDia(n) + (p.hora ? ', ' + p.hora : '') + '.' };
}
/* Reservas marcadas con ✓ que no tienen ticket en la carpeta */
function marcadasSinTicket() {
  var x = MIPLAN.res || {};
  return RESERVAS.filter(function (r) { return x[r.id] && !pasesDeRes(r.id).length; });
}
function pasesDelDia(n) { return (PASES || []).filter(function (p) { return p.fecha ? p.fecha === isoDia(n) : pzDiaPlan(p) === n; }); }

/* ---------- tarjeta de Inicio ---------- */
function renderPases(el) {
  if (!el) return;
  var h = '<div class="row spread"><h3 class="gh3">🎫 Nuestros pases</h3>';
  if (!PASES) {
    var guardada = pzClave();
    h += '<span class="pill">🔒 Protegidos</span></div><p class="gnota">Tickets, QR y confirmaciones de lo que ya reservaron. Van cifrados porque la página es pública: escriban la clave una vez y queda guardada en este teléfono (también sin internet).</p>';
    if (guardada && (pz.abriendo || !pz.err)) h += '<p class="gnota">Abriendo los pases…</p>';
    else h += '<div class="pzform"><input class="gin" id="pzClave" type="password" autocomplete="off" autocapitalize="none" placeholder="Clave de los pases (xxxx-xxxx-xxxx)"><button class="btn pri" id="pzAbrir">Abrir</button></div>' + (pz.err ? '<p class="gnota av">⚠️ ' + esc(pz.err) + '</p>' : '');
    el.innerHTML = h;
    var b = el.querySelector('#pzAbrir');
    if (b) b.onclick = function () {
      var v = el.querySelector('#pzClave').value; if (!v.trim()) return toast('Escriban la clave');
      b.disabled = true; b.textContent = 'Abriendo…';
      pasesAbrir(v).then(function () { toast('✓ Pases abiertos'); pzRefrescar(); }, function () { renderPases(el); });
    };
    if (guardada && !pz.abriendo && !pz.err) pasesAbrir(guardada).then(pzRefrescar, function () { renderPases(el); });
    return;
  }
  var L = PASES.slice().sort(function (a, b) { return (a.fecha || '9') < (b.fecha || '9') ? -1 : 1; });
  var est = L.map(pzEstado), malos = est.filter(function (e) { return e.cl !== 'g'; }).length, sin = marcadasSinTicket();
  h += '<span class="pill ' + (malos || sin.length ? 'r' : 'g') + '">' + L.length + ' reserva' + (L.length > 1 ? 's' : '') + (malos + sin.length ? ' · ⚠️ ' + (malos + sin.length) : ' ✓') + '</span></div>';
  h += '<ul class="reservas pases">';
  L.forEach(function (p, k) {
    var e = est[k], na = p.archivos.length;
    h += '<li class="' + (e.cl === 'r' ? 'urge' : '') + '"><span class="pzico">' + (p.archivos.some(function (a) { return a.qr; }) ? '🎫' : '🎟️') + '</span><div><b>' + esc(p.t) + '</b><small>' +
      (p.fecha ? '<b>' + fechaIsoTxt(p.fecha) + (p.hora ? ', ' + esc(p.hora) : '') + '</b>' : '<b>Fecha por confirmar</b>') + (p.personas ? ' · ' + p.personas + ' persona' + (p.personas > 1 ? 's' : '') : '') + '</small>' +
      '<small class="' + (e.cl === 'g' ? 'okt' : 'av') + '">' + (e.cl === 'g' ? '' : '⚠️ ') + esc(e.txt) + '</small></div>' +
      '<div class="rcu"><button class="btn sm or" data-pz="' + esc(p.id) + '">Ver ' + (na > 1 ? na + ' pases' : 'pase') + '</button></div></li>';
  });
  h += '</ul>';
  if (sin.length) h += '<div class="box nota"><b>⚠️ Marcadas con ✓ pero sin ticket en la carpeta:</b><ul>' + sin.map(function (r) { var f = MIPLAN.res[r.id].f; return '<li>' + esc(r.n) + (f ? ' (para el ' + fechaIsoTxt(f) + ')' : '') + '</li>'; }).join('') + '</ul>Guarden la confirmación (captura o PDF) en la carpeta Reservas para tenerla aquí, o quiten el ✓ si todavía no reservaron.</div>';
  h += '<p class="gnota">Funcionan sin internet. Para agregar uno nuevo, pónganlo en la carpeta Reservas del computador y vuelvan a publicar la guía.</p>';
  h += '<div class="row"><button class="btn sm" id="pzLink">📲 Abrir en el otro teléfono</button><button class="btn sm gdel" id="pzSalir">🔒 Cerrar en este teléfono</button></div>';
  el.innerHTML = h;
  [].forEach.call(el.querySelectorAll('[data-pz]'), function (b) { b.onclick = function () { verPase(b.dataset.pz); }; });
  el.querySelector('#pzLink').onclick = function () {
    var u = location.origin + location.pathname + '#pases=' + encodeURIComponent(pzClave());
    if (navigator.share) navigator.share({ title: 'Pases del viaje', text: 'Abre este link en tu teléfono para ver los pases (lleva la clave: no lo reenvíes):', url: u }).catch(function () {});
    else if (navigator.clipboard) navigator.clipboard.writeText(u).then(function () { toast('Link copiado: mándenlo solo por chat privado'); });
  };
  el.querySelector('#pzSalir').onclick = function () { if (confirm('¿Cerrar los pases en este teléfono? Para volver a verlos hay que escribir la clave.')) { pasesOlvidar(); pzRefrescar(); } };
}

/* ---------- ver un pase (pantalla blanca para escanear) ---------- */
function pzUrl(a) {
  if (pz.urls[a.f]) return Promise.resolve(pz.urls[a.f]);
  return pzBajar(a.f).then(pzDescifrar).then(function (b) { return (pz.urls[a.f] = URL.createObjectURL(new Blob([b], { type: a.tipo }))); });
}
function verPase(id) {
  var p = (PASES || []).filter(function (x) { return x.id === id; })[0]; if (!p) return;
  var e = pzEstado(p), h = '<div class="pzver">';
  h += '<p class="pzfecha">' + (p.fecha ? fechaIsoTxt(p.fecha) + (p.hora ? ' · ' + esc(p.hora) : '') : 'Fecha por confirmar') + (p.personas ? ' · ' + p.personas + ' personas' : '') + '</p>';
  if (e.cl !== 'g') h += '<div class="box nota av">⚠️ ' + esc(e.txt) + '</div>';
  if (p.codigo) h += '<div class="pzcod"><small>Número de reserva</small><b>' + esc(p.codigo) + '</b></div>';
  if (p.nota) h += '<div class="box">💡 ' + esc(p.nota) + '</div>';
  p.archivos.forEach(function (a, k) {
    h += '<figure class="pzimg' + (a.qr ? ' qr' : '') + '" data-k="' + k + '"><figcaption>' + esc(a.t || 'Pase ' + (k + 1)) + (p.archivos.length > 1 ? ' · ' + (k + 1) + ' de ' + p.archivos.length : '') + '</figcaption><div class="pzph">Abriendo…</div></figure>';
  });
  if (p.quien) h += '<p class="gnota">' + esc(p.quien) + '</p>';
  if (p.archivos.some(function (a) { return a.qr; })) h += '<p class="gnota">Suban el brillo al máximo para que el lector lea el código.</p>';
  hoja('🎫 ' + p.t, h + '</div>', function (d) {
    p.archivos.forEach(function (a, k) {
      var fig = d.querySelector('[data-k="' + k + '"] .pzph');
      pzUrl(a).then(function (u) {
        fig.outerHTML = a.tipo === 'application/pdf' ? '<a class="btn pri" href="' + u + '" target="_blank" rel="noopener">Abrir el PDF</a>' : '<img src="' + u + '" alt="' + esc(a.t || p.t) + '">';
      }, function () { fig.textContent = 'No se pudo abrir (¿sin internet la primera vez?).'; });
    });
  });
}

/* Link con la clave para el otro teléfono (#pases=…): se guarda y se borra de la barra */
(function () {
  var m = /[#&]pases=([^&]+)/.exec(location.hash); if (!m) return;
  try { localStorage.setItem('guiaPasesClave', decodeURIComponent(m[1])); } catch (e) {}
  history.replaceState(null, '', location.pathname + location.search);
})();
