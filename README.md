# JD & Santi On Tour ✈️

La app del viaje de Juan David y Santiago (30 oct – 24 nov 2026): plan día a día que se puede cambiar, mapa satelital con cómo llegar, reservas, restaurantes baratos, presupuesto, inglés, fotos, lugares gratis y **registro de gastos**. Funciona en computador, iPad y celular, **con o sin internet**.

**Abrir la guía:** https://sspuentes13.github.io/guia-usa-2026/

---

## 📲 Instalarla en el iPad o iPhone

1. Abre el link en **Safari** (en iPhone/iPad tiene que ser Safari).
2. Toca el botón **Compartir** (cuadro con flecha hacia arriba).
3. Toca **Agregar a pantalla de inicio** → **Agregar**.
4. Ábrela siempre desde el ícono naranja ✈️.

En Android: Chrome → menú ⋮ → **Instalar app**.

## 📶 Prepararla para usar sin internet

1. Con **wifi**, abre la guía desde el ícono.
2. En **Inicio**, baja hasta **📶 Usar sin internet** y toca **📥 Preparar para usar sin internet**.
3. Espera a que llegue a 100 % (2 a 10 minutos, unos 55 MB). No cierres la app mientras tanto.
4. Listo: el mapa satelital de todos los lugares (zoom 12 a 17) queda guardado. El resto de la guía se guarda sola al abrirla.

En el mapa, el botón de arriba a la izquierda cambia entre **🛰️ satélite** y **✏️ mapa dibujado** (este último funciona siempre, sin descargar nada).

---

## 🗓️ El plan: seguirlo al pie de la letra o cambiarlo

El plan recomendado está pensado para seguirlo tal cual:

| Fechas | Qué |
|---|---|
| dom 1 – mar 3 nov | Llegada y Arlington: cementerio, Iwo Jima, Air Force; Roosevelt Island y Gravelly Point |
| mié 4 – vie 6 nov | DC: National Mall al amanecer; Capitolio, Library y museos; Washington Monument, Georgetown y show |
| sáb 7 nov | Old Town Alexandria (el mercado solo es los sábados) y Mount Vernon opcional |
| lun 9 – mar 10 nov | Zoológico y catedral; National Gallery, Museo Afroamericano y The Wharf |
| jue 12 nov | Nueva York en un día (tren de entre semana; el museo del 11-S abre) |
| sáb 14 nov | Baltimore (el Walters y el Monumento abren) |
| lun 16 – mié 18 nov | Libres en Arlington: compras y un día comodín para lo pendiente |
| jue 19 nov | Filadelfia y compras sin impuesto en Delaware |
| vie 20 – dom 22 nov | Último día en DC, Pentagon City, maletas y despedida |

Los días 8, 11, 13 y 15 son de descanso.

**Si algo cambia, todo se reajusta solo** (pestaña **Días**):
- **🔀 Cambiar de día:** intercambia un día con otro. Antes de elegir, la app muestra con ✓ o ⚠️ qué días sirven: lo que cierra ese día de la semana o ese festivo (por ejemplo, la Library of Congress el 11 nov), el mercado de Old Town que solo es los sábados, trenes de entre semana, la hora del atardecer de esa fecha y dos viajes largos seguidos.
- **⇄ en cada lugar** (o **📅 Cambiar de día** en su ficha del mapa): pasa un solo lugar a otro día o lo quita. También sirve para agregar un extra (por ejemplo, Ben's Chili Bowl) a un día.
- **✓ Lo hicimos / ✗ No fuimos:** lo que no se hizo queda en **🗂️ Pendientes**, con un botón para pasarlo a otro día (por ejemplo, al día comodín).
- La ruta, el cronograma, las reservas, la tarjeta **Hoy** y los restaurantes cercanos se recalculan con la fecha nueva. **↺ Volver al recomendado** deshace todo, pero conserva las reservas marcadas.
- **Compartir:** si Gastos está conectado, el plan viaja por la misma hoja privada y gana el último cambio. Si no, **📲 Compartir plan** manda un enlace que aplica el mismo plan en el otro teléfono.

## 🎟️ Reservas

En Inicio, **🎟️ Reservas según su plan** calcula cuándo salen los pases **para el día en que está cada actividad**, con hora del este y hora de Colombia. Por ejemplo, el Washington Monument del vie 6 nov sale el mié 7 oct a las 10:00 (9:00 en Colombia). Cada reserva explica:
- qué hacer si se agotan (segunda oportunidad);
- qué pasa si reservan y no van, y cómo cambiar la fecha;
- cuánta plata está en riesgo.

Marquen ✓ al reservar: queda guardada la fecha. Si después mueven ese día, la app avisa en rojo que esa reserva hay que cambiarla.

En resumen: los pases gratis (Capitolio, Library, museos y Zoo) no cuestan nada si no van. El Washington Monument y el Independence Hall cuestan US$1 por persona. Lo único con plata grande es **Amtrak**: compren apenas confirmen la fecha, con tarifa **Flex** si no están seguros, o cancelen dentro de las 24 horas. El **MARC** no se compra antes.

## 🍽️ Comer rico y barato

La pestaña **Comer** trae 50 restaurantes verificados en octubre de 2026, en DC, Arlington, Old Town, Nueva York, Baltimore, Filadelfia y Delaware. Cada uno tiene precio por persona, qué pedir, por qué vale la pena, horario y **🧭 Cómo llegar**. Hay filtros por ciudad y por **● Abierto ahora**, y aparecen los más cercanos a ti cuando la ubicación está activa. Cada día de paseo muestra también **lo rico y barato cerca de su ruta, abierto ese día**. Los lugares cerrados (Ray's Hell Burger, Good Stuff Eatery y otros) están listados para no ir.

## 🖥️ Pantallas

- En **computador y iPad horizontal**, las pestañas pasan a una barra lateral, el contenido usa todo el ancho y el mapa llena la pantalla. El botón ⛶ de arriba pone la app en pantalla completa.
- En **celular**, funciona en vertical y horizontal. Instalada desde Safari o Chrome, ya abre a pantalla completa.

## 💸 Gastos: crear la Google Sheet (una sola vez)

Los gastos **no** quedan en este sitio. Se guardan en cada teléfono y se sincronizan con una Google Sheet privada en tu Drive. Solo quien tenga el enlace del script **y** la clave puede verlos.

**1. Crear la hoja**
- Entra a https://sheets.new con tu cuenta de Google. Ponle de nombre "Gastos viaje USA".

**2. Pegar el código**
- En la hoja: menú **Extensiones → Apps Script**.
- Borra todo lo que aparece y pega el contenido del archivo [`apps-script/Codigo.gs`](apps-script/Codigo.gs) (ábrelo, botón "Copy raw file").
- Toca el ícono 💾 **Guardar**.

**3. Poner la clave**
- Vuelve a la pestaña de la hoja y **recárgala** (F5). Aparece un menú nuevo: **Gastos de la guía**.
- Toca **Gastos de la guía → Preparar hoja y clave**.
- Google pide permisos: **Continuar** → escoge tu cuenta → si sale "Google no ha verificado esta app", toca **Configuración avanzada → Ir a … (no seguro)** → **Permitir**. (Es tu propio código: solo usa esta hoja.)
- Vuelve a tocar **Gastos de la guía → Preparar hoja y clave** y escribe la clave (mínimo 6 caracteres). Se crean las pestañas *Gastos* y *Config*.

**4. Publicar el script**
- En Apps Script: botón azul **Implementar → Nueva implementación**.
- En ⚙️ "Seleccionar tipo" escoge **Aplicación web**.
- *Ejecutar como:* **Yo**. *Quién tiene acceso:* **Cualquier persona**.
- **Implementar** → copia la **URL de la aplicación web** (termina en `/exec`).
- "Cualquier persona" es necesario para que la app llegue al script; sin la clave el script no entrega nada.

**5. Conectar cada teléfono**
- Abre la guía → pestaña **💸 Gastos** → pega la URL y escribe la clave → **Conectar**.
- La primera vez agrega las personas del viaje en **⚙️ Ajustes**.
- Para los demás: en **⚙️ Ajustes → 🔗 Link para otro teléfono** se comparte el enlace; **la clave mándala en un mensaje aparte**.

> **Nunca** pongas la URL del script ni la clave en este repositorio: es público.

**Si cambias el código del script después:** Implementar → **Administrar implementaciones** → ✏️ → Versión: **Nueva versión** → Implementar (así la URL no cambia).

**O desde este proyecto (computador ya vinculado con [clasp](https://github.com/google/clasp)):** el código de `apps-script/` se sube a la hoja así, sin cambiar la URL:

```bash
cd apps-script
npx @google/clasp -A ~/.clasp-personal/.clasprc.json push --force
npx @google/clasp -A ~/.clasp-personal/.clasprc.json update-deployment "$(cat .despliegue)" -d "Gastos guía USA"
```

Los archivos `apps-script/.clasp.json` (ID del script) y `apps-script/.despliegue` (ID de la URL `/exec`) son privados: están en `.gitignore` y solo existen en el computador vinculado.

### Una sola hoja para todos
- Se crea **una sola** Google Sheet y se publica **una sola vez**. Todos los teléfonos (el tuyo, el de Juan…) usan **la misma URL `/exec` y la misma clave**: así todos los gastos quedan en la misma pestaña *Gastos*, sin importar quién los anote.
- Juan **no** necesita cuenta de Google ni permiso en la hoja: el script escribe en tu nombre ("Ejecutar como: Yo"). Si quieres que vea la hoja, compártela con él como *Lector*.
- Nunca hagas "Nueva implementación" otra vez para lo mismo: crearía otra URL. Para cambios usa *Administrar implementaciones → Nueva versión*.
- Para comprobar que la URL sirve, ábrela en el navegador: debe decir `"ok":true … Funciona`.

### Cómo funciona
- Cada gasto se guarda **primero en el teléfono** (📱). Si hay internet se sube a la hoja en segundos (☁️). Sin internet queda en cola y se sube solo al volver la conexión.
- Cada teléfono trae lo de los demás al guardar un gasto, al abrir la pestaña Gastos, al volver el internet y cada 90 segundos con la app abierta. Para forzarlo, toca el estado verde ("☁️ Sincronizado").
- Si dos personas editan el mismo gasto, queda la última edición.
- También se puede corregir directamente en la hoja (monto, descripción, etc.): el cambio llega a todos los teléfonos. Para borrar desde la hoja escribe **sí** en la columna `borrado` (no borres la fila). Las columnas `id`, `creado` y `modificado` no se tocan.
- Exportar: **Reportes → CSV** (abre en Excel y Google Sheets) o **JSON** (respaldo). Importar JSON en **Ajustes → Respaldo**.
- Si se pierde un teléfono: cambia la clave (menú **Gastos de la guía → Cambiar la clave**) y conecta de nuevo los demás.
- La misma conexión comparte el **plan del viaje** (orden de los días, lugares movidos, días hechos y reservas marcadas). Se guarda en la pestaña *Config*, filas 3 y 4. Gana el último cambio.

---

## ✏️ Actualizar la guía después

Los datos están separados por tema en `js/datos/`:

| Archivo | Qué tiene |
|---|---|
| `dias.js` | Bloques del itinerario (`BLOQUES`), plan recomendado (`PLAN_BASE`: qué bloque va en cada fecha) y clima (`CLIMA`) |
| `lugares.js` | Lugares del mapa (`P`): nombre, coordenadas, bloque (`b`), precio, foto |
| `horarios.js` | Horarios verificados, cierres por fecha (`cerradoFechas`), duración y reservas |
| `restaurantes.js` | Restaurantes baratos (`RESTAURANTES`), supermercados y lugares cerrados |
| `presupuesto.js` | Presupuesto planeado (`BUDGET`) y tasa (`RATE`) |
| `contenido.js` | Lugares gratis, comida, canciones, poses |
| `ingles.js` | Frases de inglés con tips de pronunciación, simulacro de migración y sonidos difíciles |
| `ciudades.js` | Ciudades y descripciones |
| `mapas.js` | Mapas dibujados (generados; no editar a mano) |

**Desde la página de GitHub (sin instalar nada):**
1. Entra a https://github.com/sspuentes13/guia-usa-2026, abre el archivo y toca ✏️ **Edit**.
2. Cambia el texto con cuidado de no borrar comillas `"` ni comas.
3. **Commit changes**. En 1–2 minutos queda publicado.
4. Si el cambio es grande, edita también `sw.js` y cambia la línea `var VERSION='…'` (por ejemplo, súmale una letra). Así los teléfonos muestran el aviso **"Hay una versión nueva · Actualizar"**.

**Desde el computador:** edita los archivos, prueba con `python -m http.server` dentro de la carpeta y abre http://localhost:8000, luego `git add . && git commit -m "…" && git push`.

## ✅ Auditoría de horarios (6 de octubre de 2026)

Cada lugar del plan se verificó en su página oficial (NPS, Smithsonian, visitthecapitol.gov, loc.gov, Amtrak, MARC, SEPTA, etc.). Los horarios están en `js/datos/horarios.js`, con fuente y nivel de confianza. El **cronograma** de cada día (pestaña Días y ruta del día en el mapa) calcula llegadas, traslados y esperas, y avisa si algo está cerrado o no alcanza el tiempo. Con el plan recomendado, los 13 días con ruta quedan **sin avisos**. Si cambian el plan, se vuelve a revisar con las fechas nuevas.

Cambios importantes que salieron de la auditoría:
- **Washington Monument:** cerrado el miércoles 4 de noviembre por mantenimiento → va el **viernes 6 a las 9:00**. Los tiquetes salen el **7 de octubre a las 10:00** (hora del este).
- **Kennedy Center:** edificio principal cerrado por renovación; el show gratis ahora es en The REACH (viernes y sábados) → va el **viernes 6 a las 18:00**. El jueves 5 se termina en la National Portrait Gallery (hasta las 19:00).
- **Nueva York (jueves 12):** tren de **6:20** (llega ~9:45) y regreso **19:52**. No hay trenes a las 6:00 ni a las 19:35. El museo del 11-S no abre los martes de noviembre: por eso Nueva York pasó a jueves. El árbol de Rockefeller todavía estará sin luces.
- **Library of Congress:** cierra el 11 de noviembre (Veterans Day).
- **1 de noviembre:** termina el horario de verano; desde ese día Washington tiene la misma hora de Colombia.
- **Baltimore:** primer MARC del sábado a las **8:55**.
- **Filadelfia:** Amtrak de las **6:30**. SEPTA a Wilmington a las **14:04** (los de 13:13 y 15:33 no llegan). Regreso Amtrak **20:32**.
- **Old Town Alexandria:** el mercado se mudó a **100 N Royal St / Tavern Square** (sábados 7:00–12:00). El trolley pasa desde las 11:00. Mount Vernon se alcanza en el bus 101 de las 11:58.
- **Amaneceres y atardeceres:** se calculan para cada fecha y ciudad (±2 min). Por ejemplo, amanecer el 4 nov a las 6:38 y atardecer a las 17:04; en Nueva York el 12 nov, a las 16:42. Si mueven un día con atardecer, la hora se ajusta.
- **Sin riesgo de cierre del gobierno federal** durante el viaje (financiado hasta el 11 de diciembre de 2026).

Durante el viaje, Inicio muestra **📅 Hoy**: el cronograma del día, la próxima actividad, las notas de la fecha (madrugar para el tren, festivos) y un botón para cambiar el plan.

## 📍 Ubicación, cómo llegar y transporte

- **Ubicación en vivo:** punto azul con dirección, botón ◎ para seguirte y **✨ Para ti, ahora** en Inicio (lugares cercanos, estación más cercana y comida o atardecer según la hora). Los lugares se marcan como visitados al pasar cerca.
- **🧭 Cómo llegar** (en cada lugar, estación o casa): compara a pie y en transporte público.
  - Metro: qué línea tomar, en qué dirección, cuántas paradas y dónde bajarse, con tarifa y cómo pagar.
  - A pie: calle por calle con internet; sin internet, una flecha y la distancia.
  - **Navegación en vivo** con aviso por voz opcional; la pantalla no se apaga y avisa al llegar.
- **🏠 Casa:** se guarda **solo en el teléfono** (no se publica) y descarga el satélite de los alrededores para volver sin internet.
- **Transporte incluido:** Metro de Washington, metro de Nueva York, SEPTA Metro (líneas L y B) de Filadelfia, y Light Rail y Metro de Baltimore. Las estaciones y el orden de las paradas vienen de OpenStreetMap (© colaboradores de OSM). Para regenerarlos: descargar las rutas con Overpass y correr `node herramientas/armar-transporte.js <carpeta>` (las consultas están dentro del archivo).
- **Tarifas verificadas en octubre de 2026** en las páginas oficiales:
  - Metro de Washington: US$2,25–6,75 entre semana y US$2,25–2,50 noches y fines de semana ([wmata.com](https://www.wmata.com/fares/basic.cfm)).
  - Nueva York: US$3 ([mta.info](https://www.mta.info/fares-tolls/2025-changes)).
  - SEPTA Metro: US$2,90.
  - Baltimore Light Rail y Metro: US$2.
  - Tren SEPTA a Wilmington: US$8,75 entre semana y US$8 fin de semana.
  - Bus 101 de Fairfax Connector a Mount Vernon: US$2,25.
  - El DC Circulator dejó de funcionar en diciembre de 2024.
- Los horarios en vivo y las alertas de servicio se consultan con el botón **🕒 Horarios en vivo (Google Maps)**.

El mapa de Google My Maps / Organic Maps está en [`datos/viaje-google-my-maps.kml`](datos/viaje-google-my-maps.kml).

## Estructura

```
index.html              página principal
manifest.webmanifest    datos para instalarla como app
sw.js                   service worker: guarda la app y los mapas para usar sin internet
css/                    estilos (app, gastos, interfaz y pantallas, Leaflet)
js/app.js               guía: inicio, mapa, fotos, gratis
js/plan.js              plan dinámico: qué bloque va en cada fecha, cambios, avisos, sol y sincronización
js/rutas.js             orden por cercanía de los lugares de cada día (respeta horas fijas)
js/cronograma.js        horas de llegada, esperas y cierres de cada día
js/hoy.js               reservas calculadas con el plan y la tarjeta Hoy
js/mapa-rutas.js        mapa interactivo: ruta del día, cerca de mí, búsqueda, pantalla completa
js/navegar.js           ubicación en vivo, cómo llegar, metro y navegación
js/vista-dias.js        pestaña Días: plan, cambiar de día, pendientes y 📊 Análisis
js/comer.js             pestaña Comer: restaurantes, abiertos ahora y cerca de cada día
js/ingles.js            práctica de inglés: voz lenta, micrófono, tarjetas al azar
js/gastos.js            registro de gastos, reportes y sincronización
js/offline.js           descarga de mapas y aviso de versión nueva
js/datos/               contenido de la guía
js/vendor/leaflet.js    librería del mapa (Leaflet 1.9.4)
apps-script/Codigo.gs   código para la Google Sheet de gastos
iconos/                 íconos de la app
```

Imágenes satelitales © Esri · Calles © OpenStreetMap · Fotos de Wikipedia.
