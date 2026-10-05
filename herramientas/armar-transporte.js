/* Genera js/datos/transporte.js a partir de rutas de OpenStreetMap (descargadas con Overpass).
   Uso: node herramientas/armar-transporte.js <carpeta con wmata.json nyc.json phi.json bal.json>
   Consulta Overpass usada (ejemplo DC):
   [out:json];relation["type"="route"]["route"="subway"](38.75,-77.50,39.15,-76.85);out body;node(r);out skel qt;
   Datos © colaboradores de OpenStreetMap (ODbL). */
const fs = require('fs'), path = require('path');
const dir = process.argv[2];
// Nombres de respaldo (Wikidata) para paradas sin nombre en OpenStreetMap: [[nombre, lat, lon], …]
const extra = {};
try { const w = JSON.parse(fs.readFileSync(path.join(dir, 'wd_wmata-seq.json'), 'utf8')); extra.dc = Object.values(w.st).map(x => [x.n, x.ll[0], x.ll[1]]); } catch (e) {}
function nombreCercano(sis, ll) { let mejor = null, d = 0.4; (extra[sis] || []).forEach(x => { const k = hav(ll, [x[1], x[2]]); if (k < d) { d = k; mejor = x[0]; } }); return mejor; }
const sinNombre = {};
const SIS = {
  dc: { f: 'wmata.json', red: /Washington Metro/, rutas: /subway/ },
  ny: { f: 'nyc.json', red: /^NYC Subway$/, rutas: /subway/ },
  phi: { f: 'phi.json', red: /^SEPTA$/, rutas: /subway/ },
  bal: { f: 'bal.json', red: /Light RailLink|Metro SubwayLink/, rutas: /light_rail|subway/ }
};
const NOMBRE_DC = { R: 'Roja', O: 'Naranja', S: 'Plateada', B: 'Azul', Y: 'Amarilla', G: 'Verde' };
const COLOR_DC = { R: '#BF0D3E', O: '#ED8B00', S: '#919D9D', B: '#009CDE', Y: '#FFD100', G: '#00B140' };

function hav(a, b) { const R = 6371, t = Math.PI / 180, x = Math.sin((b[0] - a[0]) * t / 2) ** 2 + Math.cos(a[0] * t) * Math.cos(b[0] * t) * Math.sin((b[1] - a[1]) * t / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(x)); }
function limpio(n) { return String(n || '').replace(/\s*\((?:[^)]*(?:Line|line|track|Track|platform|Platform|to |toward|uptown|downtown|Uptown|Downtown)[^)]*)\)/g, '').replace(/\s+(Northbound|Southbound|Eastbound|Westbound|Uptown|Downtown)$/i, '').replace(/ station$/i, '').trim(); }

const estaciones = [], lineas = [];
/* nombres casi iguales (una letra de diferencia, p. ej. Loudon/Loudoun) */
function casi(a, b) { if ((a.match(/\d+/g) || []).join() !== (b.match(/\d+/g) || []).join()) return false; a = a.replace(/[^a-z0-9]/g, ''); b = b.replace(/[^a-z0-9]/g, ''); if (a === b) return true; if (Math.abs(a.length - b.length) > 1 || a.length < 7) return false; let i = 0, j = 0, dif = 0; while (i < a.length && j < b.length) { if (a[i] === b[j]) { i++; j++; } else { if (++dif > 1) return false; if (a.length > b.length) i++; else if (b.length > a.length) j++; else { i++; j++; } } } return dif + (a.length - i) + (b.length - j) <= 1; }
function estacionId(sis, nombre, ll) {
  const key = limpio(nombre).toLowerCase();
  for (let i = 0; i < estaciones.length; i++) {
    const e = estaciones[i];
    const d = hav(e.ll, ll);
    if (e.s === sis && ((casi(e._k, key) && d < 0.45) || d < 0.08)) { e._n++; e.ll = [(e.ll[0] * (e._n - 1) + ll[0]) / e._n, (e.ll[1] * (e._n - 1) + ll[1]) / e._n]; return i; }
  }
  estaciones.push({ s: sis, n: limpio(nombre), ll: ll.slice(), _k: key, _n: 1 });
  return estaciones.length - 1;
}

for (const sis in SIS) {
  const cfg = SIS[sis], j = JSON.parse(fs.readFileSync(path.join(dir, cfg.f), 'utf8'));
  const nodos = {}; j.elements.forEach(e => { if (e.type === 'node') nodos[e.id] = e; });
  const nombres = {}; j.elements.forEach(e => { if (e.type === 'node' && e.tags && e.tags.name) nombres[e.id] = e.tags.name; });
  const pats = [];
  j.elements.filter(e => e.type === 'relation' && cfg.red.test(e.tags.network || '') && cfg.rutas.test(e.tags.route || '')).forEach(r => {
    const t = r.tags, ref = (t.ref || '').replace(/[<>]/g, '');
    const paradas = [];
    r.members.filter(m => m.type === 'node' && /^stop/.test(m.role)).forEach(m => {
      const n = nodos[m.ref]; if (!n) return;
      const nom = (n.tags && n.tags.name) || nombres[m.ref] || nombreCercano(sis, [n.lat, n.lon]); if (!nom) { sinNombre[sis] = (sinNombre[sis] || 0) + 1; return; }
      const id = estacionId(sis, nom, [n.lat, n.lon]);
      if (paradas[paradas.length - 1] !== id) paradas.push(id);
    });
    if (paradas.length < 2) return;
    pats.push({ ref, color: t.colour || COLOR_DC[ref] || '#4A6A80', paradas, express: /<|express/i.test((t.ref || '') + (t.name || '')) });
  });
  // Limpieza de variantes de la misma línea:
  // - duplicadas exactas: fuera
  // - recorrido corto que es un tramo seguido de otra (p. ej. Amarilla hasta Mt Vernon Sq): se queda (sirve para decir la dirección)
  // - con todas sus estaciones dentro de otra pero saltándose paradas (relación rota o expreso): fuera
  const seguido = (a, b) => { const s = ',' + b.join(',') + ','; return s.includes(',' + a.join(',') + ',') || s.includes(',' + a.slice().reverse().join(',') + ','); };
  const subconj = (a, b) => a.every(x => b.indexOf(x) > -1);
  pats.sort((a, b) => b.paradas.length - a.paradas.length);
  const finales = [];
  pats.forEach(p => {
    if (finales.some(q => q.ref === p.ref && (q.paradas.join() === p.paradas.join() || q.paradas.join() === p.paradas.slice().reverse().join()))) return;
    if (finales.some(q => q.ref === p.ref && subconj(p.paradas, q.paradas) && !seguido(p.paradas, q.paradas))) return;
    finales.push(p);
  });
  finales.forEach(p => lineas.push({ s: sis, r: p.ref, c: p.color, p: p.paradas }));
  console.log(sis, ': variantes', pats.length, '→', finales.length, finales.map(p => p.ref + '(' + p.paradas.length + ')').join(' '));
}

// índices compactos
const usadas = new Set(); lineas.forEach(l => l.p.forEach(i => usadas.add(i)));
const mapa = {}, E = [];
estaciones.forEach((e, i) => { if (usadas.has(i)) { mapa[i] = E.length; E.push([e.s, e.n, +e.ll[0].toFixed(5), +e.ll[1].toFixed(5)]); } });
const Lns = lineas.map(l => [l.s, l.r, l.c, l.p.map(i => mapa[i])]);
const salida = '/* Transporte público: estaciones y líneas (paradas en orden). Generado por herramientas/armar-transporte.js\n   desde OpenStreetMap (© colaboradores de OpenStreetMap, ODbL), descargado el ' + new Date().toISOString().slice(0, 10) + '.\n   E = [sistema, nombre, lat, lon] · LN = [sistema, línea, color, [estaciones en orden]] */\n' +
  'var TR_E=' + JSON.stringify(E) + ';\nvar TR_LN=' + JSON.stringify(Lns) + ';\n';
fs.writeFileSync(path.join(__dirname, '..', 'js', 'datos', 'transporte.js'), salida);
console.log('paradas sin nombre (omitidas):', JSON.stringify(sinNombre));
console.log('estaciones', E.length, 'líneas', Lns.length, 'tamaño', salida.length, 'bytes');
