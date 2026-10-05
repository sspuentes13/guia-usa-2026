/* Guía USA · service worker
   - App (este sitio): se sirve desde la caché y se actualiza en segundo plano.
   - Tiles de mapa: primero la caché (preparados o visitados), si no, internet.
   - Fotos de Wikipedia y fuente: caché con actualización en segundo plano.
   - Gastos (Google Apps Script): nunca se guardan aquí.
   Al publicar cambios grandes, sube VERSION para forzar la actualización. */
var VERSION='2026-10-05a';
var SHELL='guia-app-'+VERSION, PREP='guia-tiles-prep', VIS='guia-tiles-vis', EXT='guia-ext';
var ARCHIVOS=['./','index.html','manifest.webmanifest','css/leaflet.css','css/app.css','css/gastos.css','css/ui.css',
  'js/vendor/leaflet.js','js/datos/lugares.js','js/datos/ciudades.js','js/datos/presupuesto.js','js/datos/dias.js',
  'js/datos/contenido.js','js/datos/ingles.js','js/datos/mapas.js','js/offline.js','js/rutas.js','js/mapa-rutas.js','js/vista-dias.js','js/ingles.js','js/gastos.js','js/app.js',
  'iconos/icono-192.png','iconos/icono-512.png','iconos/apple-touch-icon.png'];
var MAX_VIS=2500, MAX_EXT=150;

self.addEventListener('install',function(e){
  e.waitUntil(caches.open(SHELL).then(function(c){return c.addAll(ARCHIVOS.map(function(u){return new Request(u,{cache:'reload'})}))}));
});
self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k.indexOf('guia-app-')===0&&k!==SHELL}).map(function(k){return caches.delete(k)}))}).then(function(){return self.clients.claim()}));
});
self.addEventListener('message',function(e){if(e.data==='skipWaiting')self.skipWaiting()});

function esTile(u){return /arcgisonline\.com\/.*\/tile\/|tile\.openstreetmap\.org\//.test(u)}
function esExt(u){return /fonts\.(googleapis|gstatic)\.com|wikipedia\.org\/api|upload\.wikimedia\.org/.test(u)}
function recortar(nombre,max){caches.open(nombre).then(function(c){c.keys().then(function(ks){if(ks.length>max)ks.slice(0,ks.length-max).forEach(function(k){c.delete(k)})})})}
var nVis=0,nExt=0;

self.addEventListener('fetch',function(e){
  var req=e.request,url=req.url;
  if(req.method!=='GET')return;
  if(/script\.google(usercontent)?\.com|googleusercontent\.com/.test(url))return;

  if(esTile(url)){
    e.respondWith(caches.match(req,{ignoreVary:true}).then(function(r){
      return r||fetch(req).then(function(res){
        if(res.ok||res.type==='opaque'){var cp=res.clone();caches.open(VIS).then(function(c){c.put(req,cp)});if(++nVis%100===0)recortar(VIS,MAX_VIS)}
        return res;
      });
    }));
    return;
  }

  var mismo=new URL(url).origin===self.location.origin;
  if(mismo||esExt(url)){
    var nombre=mismo?SHELL:EXT,nav=req.mode==='navigate',clave=nav?url.split('?')[0].split('#')[0]:req;
    var red=fetch(req).then(function(res){
      if(res.ok||(!mismo&&res.type==='opaque')){var cp=res.clone();caches.open(nombre).then(function(c){c.put(clave,cp)});if(!mismo&&++nExt%20===0)recortar(EXT,MAX_EXT)}
      return res;
    });
    e.waitUntil(red.catch(function(){}));
    e.respondWith(caches.open(nombre).then(function(c){
      return c.match(clave,{ignoreSearch:nav}).then(function(r){
        return r||red.catch(function(){return nav?c.match('./').then(function(x){return x||c.match('index.html')}):Response.error()});
      });
    }));
  }
});
