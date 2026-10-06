/* Antes de viajar, emergencias y guía práctica. Verificado el 6 oct 2026 en fuentes oficiales
   (CBP, Cancillería, DIAN, WMATA, OMNY, SEPTA, MTA Maryland, impuestos de DC/VA/NY/PA, SURA, Avianca).
   fecha = recordatorio (hora de Colombia) que también se exporta al calendario. */

var PREPARAR = [
  { g: '📄 Documentos', items: [
    { id: 'pasaporte', t: 'Pasaporte y visa B1/B2 vigentes', cuando: 'Ya', d: 'Los colombianos necesitan visa B1/B2 (no aplica ESTA). Colombia está exenta de la regla de los 6 meses: el pasaporte debe servir toda la estadía, pero lo más seguro es que tenga 6 meses o más.', u: 'https://www.cbp.gov/travel/international-visitors' },
    { id: 'copias', t: 'Copias en el celular y en la nube', d: 'Foto del pasaporte, visa, cédula, tiquetes, seguro y la dirección donde se quedan. Compártanlas entre los dos.' },
    { id: 'migracion', t: 'Papeles para migración en Dulles', d: 'Impreso y en el celular: dirección en Arlington, tiquete de regreso del 23 nov, tarjetas o fondos y constancia de trabajo o estudio. Practiquen el simulacro en la pestaña Inglés. El Mobile Passport Control NO aplica para visa de turista: hagan la fila normal.' },
    { id: 'i94', t: 'Descargar el I-94 al llegar', cuando: 'Lun 2 nov', fecha: '2026-11-02T10:00:00-05:00', d: 'Es el registro de entrada electrónico. Revisen que la fecha "admit until" sea después del 23 nov.', u: 'https://i94.cbp.dhs.gov' },
    { id: 'checkmig', t: 'Check-Mig (opcional)', d: 'Ya no es obligatorio para salir de Colombia, pero algunas aerolíneas lo piden: es gratis y toma 10 minutos.', u: 'https://www.migracioncolombia.gov.co/' }
  ] },
  { g: '✈️ Vuelos y maletas', items: [
    { id: 'tarifa', t: 'Revisar qué maleta incluye su tarifa Avianca', cuando: 'Antes del 25 oct', fecha: '2026-10-25T10:00:00-05:00', d: 'Basic: solo un artículo personal (45×35×20 cm). Classic y Flex: maleta de mano de 10 kg (55×35×25) y maleta de bodega de 23 kg (158 cm lineales). Si les falta, compren la maleta en línea con más de 48 h: ~US$60–85, frente a US$80–120 en el aeropuerto.', u: 'https://www.avianca.com/en/information-and-help/avianca-fares/' },
    { id: 'checkin1', t: 'Check-in de ida, antes de subir al bus', cuando: 'Vie 30 oct desde las 17:50', fecha: '2026-10-30T18:00:00-05:00', d: 'Para vuelos a EE. UU. abre 24 h antes y cierra 60 min antes. Háganlo antes del bus de las 20:30. En el aeropuerto: 3 h antes en vuelos internacionales y 2 h en nacionales.', u: 'https://www.avianca.com/es/' },
    { id: 'checkin2', t: 'Check-in de regreso', cuando: 'Dom 22 nov desde las 5:50', fecha: '2026-11-22T08:00:00-05:00', d: 'El vuelo sale a las 5:50 del 23: el check-in abre 24 h antes. Uber a Dulles a las 2:00.' },
    { id: 'pesar', t: 'Pesar las maletas de regreso (23 kg)', cuando: 'Sáb 21 nov', fecha: '2026-11-21T18:00:00-05:00', d: 'Una balanza de mano cuesta ~US$10 en CVS o Target. Lo pesado va en la maleta de bodega.' }
  ] },
  { g: '🩺 Salud y seguro', items: [
    { id: 'tarjetaseguro', t: 'Primero: ¿su tarjeta de crédito trae seguro gratis?', cuando: 'Antes del 15 oct', fecha: '2026-10-15T18:00:00-05:00', d: 'Tarjetas de crédito Bancolombia (Clásica, Oro, Platinum; no E-card ni Ideal): asistencia AXA gratis de US$40.000–65.000, sin deducible. Pidan el certificado al 01 8000 954000 o por WhatsApp al 316 434 8887, y pregunten si exigen haber pagado el tiquete con la tarjeta. Cubre al titular (y cónyuge): si no son pareja, cada uno necesita su tarjeta. Visa Platinum/Signature de otros bancos: hay que haber pagado el tiquete con la tarjeta (certificado en visa.com/portalbeneficios). La tarjeta Nu NO trae seguro médico.', u: 'https://www.bancolombia.com/centro-de-ayuda/preguntas-frecuentes/que-ofrece-axa-siempre-protegido' },
    { id: 'seguro', t: 'Si no tienen tarjeta que cubra: seguro barato', cuando: 'Antes del 20 oct', fecha: '2026-10-20T19:00:00-05:00', d: 'Atlas America (WorldTrips) de US$100.000 con deducible de US$250: ~US$49 por persona (~COP 313.000 los dos, para 28 años, cotizado el 6 oct). Más barato: Patriot America Plus US$100.000 (~COP 279.000 los dos) o Atlas US$50.000 (~COP 250.000). Fechas: 31 oct – 23 nov. Eviten los planes de "beneficio fijo" y los de menos de US$50.000. Guarden el número de asistencia en 🆘.', u: 'https://www.americanvisitorinsurance.com/world-trips/atlas-america-insurance.asp' },
    { id: 'meds', t: 'Medicamentos con fórmula y botiquín', d: 'Lo que tomen siempre, en su caja original y con la fórmula. Botiquín básico: acetaminofén, antialérgico, curitas, sales de rehidratación. En CVS y Walgreens se consiguen sin fórmula.' },
    { id: 'vacuna', t: 'Vacuna de la influenza (recomendable)', cuando: '2 semanas antes', fecha: '2026-10-16T18:00:00-05:00', d: 'Noviembre es temporada de gripa en EE. UU. Consulten con su EPS o farmacia: tarda unas 2 semanas en proteger.' }
  ] },
  { g: '💵 Plata', items: [
    { id: 'banco', t: 'Avisar al banco y llevar 2 tarjetas', cuando: 'Antes del 28 oct', fecha: '2026-10-27T18:00:00-05:00', d: 'Una principal y una de respaldo, de bancos distintos. Pregunten la comisión por compras en el exterior (suele ser ~3 %). En los datáfonos paguen SIEMPRE en dólares, nunca en pesos.' },
    { id: 'wallet', t: 'Tarjetas en Apple Pay o Google Pay', d: 'Sirven para el metro de DC, Nueva York y Filadelfia acercando el celular. Si la tarjeta física falla en el torniquete, el celular suele funcionar.' },
    { id: 'efectivo', t: 'US$50–100 en efectivo en billetes pequeños', d: 'Para propinas, food trucks que no reciben tarjeta y emergencias. Los cajeros cobran US$3–5 más la comisión del banco.' }
  ] },
  { g: '📱 Celular e internet', items: [
    { id: 'esim', t: 'eSIM o plan de datos', cuando: 'Antes del 29 oct', fecha: '2026-10-28T19:00:00-05:00', d: 'Lo más rendidor: T-Mobile Prepaid "U.S. Pass" por 30 días a US$50 (5G ilimitado con 50 GB, número de EE. UU. y llamadas). Otras: Airalo 20 GB ~US$36 o Holafly ilimitado US$75. El celular tiene que estar liberado y aceptar eSIM. El roaming colombiano sale más caro para 26 días.', u: 'https://prepaid.t-mobile.com/prepaid-plans/esim-usa-travel-plans' },
    { id: 'appoffline', t: 'Preparar esta app para usar sin internet', d: 'En Inicio: "Preparar sin internet" con wifi. En el mapa: 🏠 Guardar casa al llegar. Instalen la app en los dos celulares y conecten Gastos (así se comparte el plan).' }
  ] },
  { g: '🧳 Maleta para noviembre', items: [
    { id: 'ropa', t: 'Ropa para 2–17 °C', d: 'Por capas: camisetas, saco o buzo, chaqueta abrigada, impermeable o sombrilla (8–9 días de lluvia en el mes), bufanda y guantes (para patinar también), y zapatos cómodos que aguanten agua. Después de las 5 p. m. hace frío y viento.' },
    { id: 'enchufe', t: 'Sin adaptador: el enchufe es el mismo', d: 'EE. UU. y Colombia usan el mismo enchufe (tipo A/B, 110–120 V). Lleven una regleta pequeña y un cargador portátil.' }
  ] },
  { g: '🛃 Al volver a Colombia', items: [
    { id: 'aduana', t: 'Franquicia DIAN: hasta US$2.000 por persona', d: 'Hasta US$2.000 en compras por persona entran sin pagar ni declarar (máx. 10 unidades iguales, nada comercial). Por encima, hasta US$3.000 más pagan un tributo único del 15 % y hay que declarar en el Formulario 530. Máximo 3 celulares por persona, declarados con su IMEI. Efectivo de más de US$10.000: hay que declararlo. Guarden las facturas.', u: 'https://www.dian.gov.co/Viajeros-y-Servicios-aduaneros/Paginas/Modalidad-viajeros.aspx' }
  ] }
];

var EMERGENCIA = {
  llamar: [
    { n: '911', t: 'Emergencias: ambulancia, policía, bomberos', rojo: 1 },
    { n: '1-888-764-3326', t: 'Cancillería de Colombia, gratis 24 h' },
    { n: '202-885-9279', t: 'Consulado de Colombia en Washington' },
    { n: '1-800-222-1222', t: 'Intoxicaciones (Poison Control) 24 h' },
    { n: '703-558-2222', t: 'Policía de Arlington (no urgente)' },
    { n: '311', t: 'Washington DC (no urgente)' }
  ],
  secciones: [
    { t: '🇨🇴 Consulado y Embajada de Colombia', tel: '202-885-9279', u: 'https://washington.consulado.gov.co/ayuda/datos-contacto', p: [
      'Consulado: 1724 Massachusetts Ave NW, 2.º piso, Washington DC (Metro Dupont Circle). Lunes a viernes 8:00–14:00, con cita. consuladocolwashingtondc@cancilleria.gov.co',
      'Embajada: misma dirección, 202-387-8338.',
      'Línea gratis 24 h de la Cancillería desde EE. UU.: 1-888-764-3326. Desde cualquier lugar: +57 601 382 6999. También hay chat y videollamada 24 h en cancilleria.gov.co.'
    ] },
    { t: '🛂 Si pierden el pasaporte', u: 'https://co.usembassy.gov/loststolen-visa/', p: [
      '1. Denuncio: Policía de Arlington 703-558-2222 o en línea; en DC, 311.',
      '2. Al Consulado con el denuncio, copia de la cédula y 2 fotos de 3×4 con fondo blanco: pasaporte de emergencia (el mismo día, con costo) o pasaporte exento (gratis, solo para volver a Colombia).',
      '3. La visa de EE. UU. no se puede renovar dentro de EE. UU. El I-94 sigue sirviendo para salir. Después se pide una visa nueva en Bogotá.'
    ] },
    { t: '🤒 Si se enferman', p: [
      '1. Llamen o escriban PRIMERO a la asistencia del seguro: los dirige y autoriza. Lo que paguen por su cuenta sin autorización puede no cubrirse. El número está en el certificado o la póliza: guárdenlo arriba en este 🆘.',
      'Con Atlas America: busquen primero un hospital o urgent care de la red UnitedHealthcare (sale más barato) y paguen el deducible de US$250.',
      '2. Algo leve: la telemedicina del seguro o la farmacia (CVS Clarendon, 3141 Wilson Blvd, ~7:00–24:00).',
      '3. Fiebre, torcedura, puntos: urgent care (~US$150–300). Cerca: PMA Immediate Care Clarendon, 3301 Wilson Blvd, 703-522-1860 (lun–vie 8–19, fin de semana 9–14).',
      '4. Algo grave (pecho, respiración, accidente): 911 o sala de urgencias (ER), y avisen al seguro en las 36 horas siguientes.',
      'Las cuentas de hospital llegan semanas después: no paguen en el momento si el seguro no se lo pide; mándenselas al seguro.'
    ] },
    { t: '📍 Si se pierden o se separan', p: [
      'Punto de encuentro: la estación de Metro más cercana al lugar donde estaban, o la casa.',
      'En el mapa, 🏠 los lleva a casa aunque no tengan internet (si guardaron la casa y prepararon el mapa).',
      'Compartan la ubicación en tiempo real por WhatsApp mientras estén separados.'
    ] }
  ]
};

var GUIA = [
  { e: '🩺', t: 'Seguro médico barato', u: 'https://www.americanvisitorinsurance.com/world-trips/atlas-america-insurance.asp', ut: 'Cotizar Atlas America', p: [
    '1) Gratis: si alguno tiene tarjeta de crédito Bancolombia (Clásica, Oro o Platinum), trae asistencia AXA de US$40.000–65.000 sin deducible. Pidan el certificado al 01 8000 954000 y confirmen las condiciones. Cubre al titular y a su cónyuge: si no son pareja, cada uno necesita su tarjeta.',
    '2) Barato: Atlas America (WorldTrips), US$100.000 con deducible de US$250. Cuesta ~COP 313.000 los dos por 24 días (cotizado el 6 oct, para 28 años; a los 30–39 sube a ~COP 400.000). Cubre COVID como cualquier enfermedad y tiene red de hospitales UnitedHealthcare.',
    'Aún más barato: Patriot America Plus US$100.000 (~COP 279.000 los dos) o Atlas US$50.000 (~COP 250.000). Debajo de US$50.000 no vale la pena en EE. UU.',
    'El deducible son los primeros US$250 que pagan ustedes en cada atención. Los trámites son en inglés y a veces toca pagar y pedir reembolso.',
    'Eviten los planes de "beneficio fijo" (Visitors Care, Visit USA Budget): pagan un monto fijo, no la cuenta real del hospital.',
    'Más caros, sin deducible y en español: Universal Assistance (~COP 1,1 millones los dos, con 25 % de descuento en octubre), Assist Card (~COP 1,6 millones) y SURA o Seguros Éxito, que venden el mismo seguro.',
    'Patinar en una pista pública no está excluido. El hockey sobre hielo sí.'
  ] },
  { e: '💵', t: 'Impuestos y propinas', p: [
    'Los precios NO incluyen el impuesto: se suma en la caja.',
    'Impuesto: Arlington 6 % (11 % en restaurantes); DC 6 % (10 % en restaurantes); Nueva York 8,875 %, pero la ropa y los zapatos de menos de US$110 no pagan; Filadelfia 8 %, y la ropa no paga; Delaware 0 %.',
    'Propina: restaurante con mesero 18–20 % (antes de impuestos). Mostrador y food truck: opcional. Uber: 10–15 % en la app.',
    'En DC muchos restaurantes ya cobran un "service charge" de 18–22 %: revisen la cuenta antes de dejar más.',
    'El presupuesto de la app suma ~15 % a las comidas por impuestos y propinas.'
  ] },
  { e: '🚇', t: 'Cómo pagar el transporte', u: 'https://www.wmata.com/pay/tap-ride-go.html', ut: 'WMATA Tap. Ride. Go.', p: [
    'Metro y bus de DC: acerquen la tarjeta (Visa o Mastercard) o el celular al ENTRAR y al SALIR. Cada persona, su tarjeta. Entre semana US$2,25–6,75; noches después de 21:30 y fines de semana US$2,25–2,50. Bus US$2,25.',
    'Opcional: la tarjeta SmarTrip en Apple Wallet (US$2; recargas desde US$4).',
    'Nueva York: OMNY, US$3 por viaje acercando tarjeta o celular. Después de 12 viajes en 7 días no se cobra más (tope de US$35).',
    'Filadelfia: SEPTA US$2,90 con tarjeta contactless; transbordos gratis por 2 h.',
    'Baltimore: MARC US$9 por trayecto (máquina o app CharmPass); Light Rail y Metro US$2.',
    'Algunos bancos extranjeros bloquean los pagos de transporte: lleven una segunda tarjeta o usen el celular.'
  ] },
  { e: '📱', t: 'Internet en el celular', u: 'https://prepaid.t-mobile.com/prepaid-plans/esim-usa-travel-plans', ut: 'T-Mobile U.S. Pass', p: [
    'Mejor opción: eSIM T-Mobile Prepaid "U.S. Pass", 30 días por US$50, con número de EE. UU.',
    'Solo datos: Airalo 20 GB ~US$36; Holafly ilimitado ~US$75.',
    'El celular tiene que estar liberado y ser compatible con eSIM (iPhone XS o más nuevo; Samsung y Pixel recientes).',
    'Esta app funciona sin internet: mapa, metro, cronograma, frases y gastos.'
  ] },
  { e: '✈️', t: 'Aeropuertos y Avianca', p: [
    'Check-in en línea para EE. UU.: abre 24 h antes y cierra 60 min antes. Lleguen 3 h antes a vuelos internacionales y 2 h a nacionales.',
    'En Dulles: fila normal de migración (el Mobile Passport Control no aplica para visa de turista). Después, Metro línea Plateada a Arlington.',
    'El 23 nov sale el vuelo a las 5:50: Uber a las 2:00 (no hay Metro a esa hora).'
  ] },
  { e: '🇨🇴', t: 'Escala de 8 horas en Bogotá (23 nov)', p: [
    'Bogotá es su primera entrada a Colombia: pasan migración (Biomig) y aduana DIAN allá. Pregunten en Dulles si tienen que recoger las maletas y volverlas a entregar en "conexiones".',
    'Pueden salir del aeropuerto: hacia las 12:30–13:00 y de vuelta a las 17:15 (2 h antes del vuelo a Cali).',
    'Cerca: centros comerciales Gran Estación o Salitre (15–20 min) para almorzar. Usaquén o Parque 93 si hay buen tráfico (30–60 min). El Museo del Oro cierra los lunes.',
    'Para descansar: sala VIP nacional de Avianca (~COP 168.000 por 3 h).'
  ] },
  { e: '🛍️', t: 'Compras y Black Friday', p: [
    'Se van el 23 y el Black Friday es el 27 nov, pero hay ofertas anticipadas desde mediados de noviembre, y por Veterans Day (11 nov) también.',
    'Ropa y tecnología: en Delaware (0 % de impuesto) o en Nueva York si es ropa de menos de US$110.',
    'Recuerden el límite de US$2.000 por persona de la DIAN y guarden las facturas.'
  ] },
  { e: '🧥', t: 'Clima de noviembre', u: 'https://www.weather.gov/lwx/dcanme', ut: 'Clima (NOAA)', p: [
    'Promedio: máxima 14 °C y mínima 5 °C. A principios de mes ~18/8 °C; a finales ~11/3 °C.',
    'Llueve 8–9 días del mes; nieve casi nunca. Oscurece hacia las 5 p. m. y hace viento junto al río.'
  ] }
];
