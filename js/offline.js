/* Guía USA · uso sin internet: service worker, aviso de versión nueva y descarga de mapas satelitales */
var OFF={
  CACHE:'guia-tiles-prep',                // mismo nombre que en sw.js
  URL:'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  NIVELES:[[17,300],[16,700],[15,1500],[14,3000],[13,6000],[12,12000]], // [zoom, radio en metros]
  NIEVE:[[15,800],[14,2000],[13,5000],[12,10000]],                      // lugares de nieve: lejos, menos detalle
  KB_PROMEDIO:20,
  corriendo:false,cancelar:false,prog:null
};

/* ---------- service worker ---------- */
if('serviceWorker' in navigator&&location.protocol!=='file:'){
  window.addEventListener('load',function(){
    navigator.serviceWorker.register('sw.js').then(function(reg){
      function avisar(w){if(!w)return;offBanner('Hay una versión nueva de la guía.','Actualizar',function(){OFF.actualizando=true;w.postMessage('skipWaiting')})}
      if(reg.waiting&&navigator.serviceWorker.controller)avisar(reg.waiting);
      reg.addEventListener('updatefound',function(){var w=reg.installing;if(!w)return;w.addEventListener('statechange',function(){if(w.state==='installed'&&navigator.serviceWorker.controller)avisar(w)})});
      setInterval(function(){reg.update().catch(function(){})},60*60*1000);
    }).catch(function(e){console.warn('SW',e)});
    // solo recarga cuando la persona tocó "Actualizar"; en la primera instalación solo avisa que ya funciona sin internet
    var habia=!!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange',function(){
      if(OFF.actualizando){OFF.actualizando=false;location.reload();return}
      if(!habia){habia=true;toast('✓ Guía guardada: ya funciona sin internet');var c=document.getElementById('offlineCard');if(c&&!OFF.corriendo)renderOfflineCard(c)}});
  });
}
if(navigator.storage&&navigator.storage.persist)navigator.storage.persisted().then(function(p){if(!p)navigator.storage.persist().catch(function(){})}).catch(function(){});

function offBanner(txt,btn,fn){var b=document.getElementById('offBanner');if(!b){b=document.createElement('div');b.id='offBanner';b.className='offbanner';document.body.appendChild(b)}
  b.innerHTML='<span>'+txt+'</span><button class="btn or">'+btn+'</button><button class="btn" aria-label="Cerrar">✕</button>';
  b.children[1].onclick=function(){b.remove();fn()};b.children[2].onclick=function(){b.remove()}}

/* ---------- lista de tiles alrededor de cada lugar ---------- */
function offTile(lat,lon,z){var n=Math.pow(2,z);return [Math.floor((lon+180)/360*n),Math.floor((1-Math.asinh(Math.tan(lat*Math.PI/180))/Math.PI)/2*n)]}
/* puntos: lista de [lat,lon] (por defecto, todos los lugares del viaje); niveles: [[zoom, radio en metros], …] */
function offLista(puntos,niveles){var vistos={},urls=[];
  (puntos?puntos.map(function(ll){return {ll:ll,c:''}}):P).forEach(function(p){(niveles||(p.c==='snow'?OFF.NIEVE:OFF.NIVELES)).forEach(function(nv){var z=nv[0],m=nv[1],lat=p.ll[0],lon=p.ll[1],dl=m/111320,dn=m/(111320*Math.cos(lat*Math.PI/180));
    var a=offTile(lat-dl,lon-dn,z),b=offTile(lat+dl,lon+dn,z);
    for(var x=a[0];x<=b[0];x++)for(var y=b[1];y<=a[1];y++){var k=z+'/'+y+'/'+x;if(!vistos[k]){vistos[k]=1;urls.push(OFF.URL.replace('{z}',z).replace('{y}',y).replace('{x}',x))}}})});
  return urls}
function offMB(b){return b<1e6?Math.max(1,Math.round(b/1e3))+' KB':(b/1e6).toFixed(b<1e7?1:0).replace('.',',')+' MB'}
function offEstado(){try{return JSON.parse(localStorage.getItem('guiaOffline')||'null')}catch(e){return null}}
function offGuardarEstado(o){try{localStorage.setItem('guiaOffline',JSON.stringify(o))}catch(e){}}

/* ---------- descarga ---------- */
function offPreparar(onProg,urlsExtra){
  if(OFF.corriendo)return Promise.resolve();
  if(!('caches' in window))return Promise.reject(new Error('Este navegador no permite guardar mapas.'));
  if(!navigator.onLine)return Promise.reject(new Error('Conéctate a internet (ideal wifi) para descargar.'));
  OFF.corriendo=true;OFF.cancelar=false;
  var urls=urlsExtra||offLista(),total=urls.length,hechas=0,bytes=0,fallas=0,i=0;
  OFF.prog={hechas:0,total:total,bytes:0,fallas:0};
  return caches.open(OFF.CACHE).then(function(cache){
    function uno(url,intento){
      return cache.match(url).then(function(r){
        if(r)return r.blob().then(function(b){bytes+=b.size});
        return fetch(url,{mode:'cors'}).then(function(res){
          if(!res.ok)throw new Error('HTTP '+res.status);
          return res.blob().then(function(b){bytes+=b.size;return cache.put(url,new Response(b,{headers:{'Content-Type':res.headers.get('Content-Type')||'image/jpeg'}}))});
        });
      }).catch(function(){if(!intento&&!OFF.cancelar)return new Promise(function(ok){setTimeout(ok,800)}).then(function(){return uno(url,1)});fallas++});
    }
    function trabajador(){
      if(OFF.cancelar||i>=total)return Promise.resolve();
      var url=urls[i++];
      return uno(url,0).then(function(){hechas++;OFF.prog={hechas:hechas,total:total,bytes:bytes,fallas:fallas};if(onProg)onProg(OFF.prog);return trabajador()});
    }
    var hilos=[];for(var k=0;k<6;k++)hilos.push(trabajador());
    return Promise.all(hilos);
  }).then(function(){
    OFF.corriendo=false;
    var o={fecha:new Date().toISOString(),tiles:hechas-fallas,total:total,bytes:bytes,fallas:fallas,completo:!OFF.cancelar&&fallas<=total*0.01};
    if(!urlsExtra)offGuardarEstado(o);return o;
  },function(e){OFF.corriendo=false;throw e});
}
/* Guarda el satélite alrededor de unos puntos (p. ej. la casa) */
function offPrepararPuntos(puntos,niveles){if(OFF.corriendo||!navigator.onLine)return Promise.resolve(null);return offPreparar(null,offLista(puntos,niveles))}
function offBorrar(){return caches.delete(OFF.CACHE).then(function(){try{localStorage.removeItem('guiaOffline')}catch(e){}})}

/* ---------- tarjeta en Inicio ---------- */
function renderOfflineCard(el){if(!el)return;
  var st=offEstado(),n=offLista().length,est=n*OFF.KB_PROMEDIO*1000,sw='serviceWorker' in navigator&&navigator.serviceWorker.controller;
  var h='<h3 style="margin:0 0 6px">📶 Usar sin internet</h3>';
  h+='<p class="lead" style="font-size:14px;margin:0 0 10px">La guía ya queda guardada en este dispositivo al abrirla'+(sw?' <span class="pill g">✓ lista</span>':' <span class="pill o">guardando… mantén el wifi un momento</span>')+'. Los mapas satelitales se guardan aparte: descárgalos con wifi antes de salir.</p>';
  if(OFF.corriendo){h+=offBarra()}
  else if(st){h+='<div class="box'+(st.completo?'':' o')+'"><h4>'+(st.completo?'✓ Mapas guardados':'Descarga incompleta')+'</h4>'+st.tiles.toLocaleString('es-CO')+' de '+st.total.toLocaleString('es-CO')+' imágenes · <b>'+offMB(st.bytes)+'</b> · '+new Date(st.fecha).toLocaleDateString('es-CO',{day:'numeric',month:'short'})+(st.fallas?'<br>'+st.fallas+' no se pudieron bajar'+(st.completo?' (no afecta el uso).':': toca el botón otra vez para completarlas.'):'')+'</div>'}
  else h+='<div class="box">Se descargan <b>'+n.toLocaleString('es-CO')+' imágenes</b> alrededor de cada lugar (zoom 12 a 17). Ocupan cerca de <b>'+offMB(est)+'</b>. Tarda de 2 a 10 minutos con buen wifi.</div>';
  h+='<div class="row mt"><button class="btn or" id="offGo"'+(OFF.corriendo?' style="display:none"':'')+'>📥 '+(st?'Actualizar / completar mapas':'Preparar para usar sin internet')+'</button>'+(OFF.corriendo?'<button class="btn" id="offStop">Detener</button>':'')+(st&&!OFF.corriendo?'<button class="btn" id="offDel">Borrar mapas guardados</button>':'')+'</div><p class="warn" id="offUso" style="margin-bottom:0">Calculando espacio…</p>';
  el.innerHTML=h;
  var go=document.getElementById('offGo'),stp=document.getElementById('offStop'),del=document.getElementById('offDel');
  if(go)go.onclick=function(){offPreparar(function(){var b=document.getElementById('offBar');if(b)b.outerHTML=offBarra()}).then(function(o){toast(o.completo?'Listo: mapas guardados ('+offMB(o.bytes)+')':'Descarga detenida o incompleta');renderOfflineCard(document.getElementById('offlineCard'))},function(e){toast(e.message);renderOfflineCard(document.getElementById('offlineCard'))});renderOfflineCard(el)};
  if(stp)stp.onclick=function(){OFF.cancelar=true;stp.disabled=true;stp.textContent='Deteniendo…'};
  if(del)del.onclick=function(){if(confirm('¿Borrar los mapas satelitales guardados en este dispositivo?'))offBorrar().then(function(){toast('Mapas borrados');renderOfflineCard(el)})};
  if(navigator.storage&&navigator.storage.estimate)navigator.storage.estimate().then(function(e){var u=document.getElementById('offUso');if(u)u.textContent='Espacio usado por la guía en este dispositivo: '+offMB(e.usage||0)+(e.quota?' de '+offMB(e.quota)+' disponibles.':'.')}).catch(function(){});
  else{var u=document.getElementById('offUso');if(u)u.remove()}
}
function offBarra(){var p=OFF.prog||{hechas:0,total:1,bytes:0,fallas:0},pc=Math.round(p.hechas/p.total*100);
  return '<div id="offBar" class="box"><h4>Descargando mapas… '+pc+'%</h4><div class="gbar"><i style="width:'+pc+'%"></i></div><small>'+p.hechas.toLocaleString('es-CO')+' de '+p.total.toLocaleString('es-CO')+' · '+offMB(p.bytes)+(p.fallas?' · '+p.fallas+' fallas':'')+'. Puedes seguir usando la guía; no cierres la app.</small></div>'}
