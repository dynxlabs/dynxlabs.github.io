/* ============================================================
   DYNX Labs — Contact form v2
   Values sent to the backend are the SAME canonical Spanish strings
   that Aria writes in the "Database" sheet, whatever the page language.
   `COMUNAS` (Chile regions -> comunas) is injected from the live page.
   ============================================================ */
(function () {
  'use strict';
  var LANG = document.documentElement.lang === 'en' ? 'en' : 'es';
  var PRIVACY_VERSION = 'v5.0 - 2026-11-21';
  var SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwko8d-PGXh2MSsSBsp6K-BM6XYhC9xuNx5MAIvhRgYJlKxPBfa2EvGeiWWzAIGnDYVuQ/exec';

  /* ---------- canonical catalogs (value = what goes to the sheet) ---------- */
  var SERVICES = [
    { v: 'Automatización de atención con IA', es: ['Atención con IA', 'Chatbots para WhatsApp, Instagram y web'], en: ['AI customer service', 'Chatbots for WhatsApp, Instagram and web'], messaging: true },
    { v: 'Agentes de IA', es: ['Agentes de IA', 'Agentes que ejecutan tareas operativas'], en: ['AI agents', 'Agents that run operational tasks'] },
    { v: 'Automatización de procesos', es: ['Automatización de procesos', 'Flujos de trabajo sin tareas repetitivas'], en: ['Workflow automation', 'Workflows without repetitive tasks'] },
    { v: 'Integración de sistemas', es: ['Integración de sistemas', 'Conectar CRM, ERP y herramientas'], en: ['System integrations', 'Connect CRM, ERP and tools'] },
    { v: 'Dashboards y reportes', es: ['Dashboards y reportes', 'Métricas en tiempo real'], en: ['Dashboards & reporting', 'Real-time metrics'] },
    { v: 'Business Intelligence', es: ['Business Intelligence', 'Datos convertidos en decisiones'], en: ['Business intelligence', 'Data turned into decisions'] },
    { v: 'Software a medida (SaaS)', es: ['Software a medida', 'Una plataforma para tu operación'], en: ['Custom software', 'A platform for your operation'] },
    { v: 'Otro / no estoy seguro', es: ['Otro / no estoy seguro', 'Cuéntanos y te orientamos'], en: ['Other / not sure', 'Tell us and we will guide you'], other: true }
  ];
  // Aria's exact catalog (q7) when the service is customer messaging
  var PROBLEMS_MSG = [
    { v: 'No doy abasto, pierdo mensajes', en: 'I can’t keep up, I miss messages' },
    { v: 'Tardo mucho en responder', en: 'I take too long to reply' },
    { v: 'No tengo disponibilidad fuera de horario', en: 'I’m not available after hours' },
    { v: 'Mis clientes preguntan siempre lo mismo', en: 'Customers always ask the same things' },
    { v: 'No tengo control de mis leads', en: 'I have no control over my leads' },
    { v: 'Otro', en: 'Other', other: true }
  ];
  var PROBLEMS_OPS = [
    { v: 'Tareas repetitivas que consumen horas', en: 'Repetitive tasks that eat up hours' },
    { v: 'Información dispersa en varias herramientas', en: 'Information scattered across tools' },
    { v: 'Errores por procesos manuales', en: 'Errors from manual processes' },
    { v: 'No tengo visibilidad de mis datos', en: 'No visibility into my data' },
    { v: 'Procesos lentos que frenan el crecimiento', en: 'Slow processes that hold back growth' },
    { v: 'Otro', en: 'Other', other: true }
  ];
  var VOLUME = [ // Aria q8 (only for customer messaging)
    { v: 'Menos de 50 al día', en: 'Under 50 a day' },
    { v: 'Entre 50 y 200 al día', en: '50 to 200 a day' },
    { v: 'Más de 200 al día', en: 'Over 200 a day' },
    { v: 'No lo sé exactamente', en: 'Not sure' }
  ];
  var TEAM = [ // Aria q9
    { v: 'Solo yo', en: 'Just me' },
    { v: '2 a 5 personas', en: '2 to 5 people' },
    { v: 'Más de 5 personas', en: 'More than 5 people' },
    { v: 'Equipo dedicado', en: 'A dedicated team' }
  ];
  var URGENCY = [ // Aria q10
    { v: 'Esta semana', en: 'This week' },
    { v: 'Este mes', en: 'This month' },
    { v: 'En los próximos 3 meses', en: 'In the next 3 months' },
    { v: 'Solo estoy explorando', en: 'Just exploring' }
  ];
  // Aria master catalog (RUBROS, 50) — value ES, label EN
  var RUBROS = [
    ['Agricultura y ganadería', 'Agriculture & livestock'], ['Alimentos', 'Food production'], ['Automotriz', 'Automotive'],
    ['Belleza y estética', 'Beauty & aesthetics'], ['Biotecnología y farmacéutica', 'Biotech & pharma'], ['Centros de contacto (BPO)', 'Contact centers (BPO)'],
    ['Ciencia e investigación', 'Science & research'], ['Comercio exterior', 'International trade'], ['Construcción', 'Construction'],
    ['Cooperativas y gremios', 'Cooperatives & associations'], ['Coworking y bienestar laboral', 'Coworking & workplace wellbeing'], ['Cultura', 'Culture'],
    ['Defensa', 'Defense'], ['Deportes y fitness', 'Sports & fitness'], ['Domótica y hogar inteligente', 'Smart home'],
    ['Economía creativa', 'Creative economy'], ['Editorial e impresión', 'Publishing & printing'], ['Educación y capacitación', 'Education & training'],
    ['Energía', 'Energy'], ['Entretenimiento y eventos', 'Entertainment & events'], ['Finanzas', 'Finance'],
    ['Forestal y madera', 'Forestry & timber'], ['Gastronomía', 'Food service & restaurants'], ['Gobierno y sector público', 'Government & public sector'],
    ['Hogar y mantenciones', 'Home services & maintenance'], ['Inmobiliaria', 'Real estate'], ['Legal y cumplimiento', 'Legal & compliance'],
    ['Limpieza y aseo', 'Cleaning services'], ['Logística y almacenamiento', 'Logistics & warehousing'], ['Manufactura e industria', 'Manufacturing & industry'],
    ['Mascotas y veterinaria', 'Pets & veterinary'], ['Medio ambiente y reciclaje', 'Environment & recycling'], ['Medios y publicidad', 'Media & advertising'],
    ['Minería', 'Mining'], ['ONG y fundaciones', 'NGOs & foundations'], ['Pesca y acuicultura', 'Fishing & aquaculture'],
    ['Química', 'Chemicals'], ['Recursos Humanos', 'Human resources'], ['Religión y organizaciones religiosas', 'Religious organizations'],
    ['Retail y comercio', 'Retail & commerce'], ['Salud y bienestar', 'Health & wellness'], ['Seguridad', 'Security'],
    ['Seguros', 'Insurance'], ['Servicios funerarios', 'Funeral services'], ['Servicios profesionales', 'Professional services'],
    ['Tecnología y software', 'Technology & software'], ['Telecomunicaciones', 'Telecommunications'], ['Textil y moda', 'Textiles & fashion'],
    ['Transporte', 'Transportation'], ['Turismo y hospedaje', 'Tourism & hospitality']
  ];
  var ISO = ('AF AX AL DZ AS AD AO AI AQ AG AR AM AW AU AT AZ BS BH BD BB BY BE BZ BJ BM BT BO BQ BA BW BV BR IO BN BG BF BI CV KH CM CA KY CF TD CL CN CX CC CO KM CG CD CK CR CI HR CU CW CY CZ DK DJ DM DO EC EG SV GQ ER EE SZ ET FK FO FJ FI FR GF PF TF GA GM GE DE GH GI GR GL GD GP GU GT GG GN GW GY HT HM VA HN HK HU IS IN ID IR IQ IE IM IL IT JM JP JE JO KZ KE KI KP KR KW KG LA LV LB LS LR LY LI LT LU MO MG MW MY MV ML MT MH MQ MR MU YT MX FM MD MC MN ME MS MA MZ MM NA NR NP NL NC NZ NI NE NG NU NF MK MP NO OM PK PW PS PA PG PY PE PH PN PL PT PR QA RE RO RU RW BL SH KN LC MF PM VC WS SM ST SA SN RS SC SL SG SX SK SI SB SO ZA GS SS ES LK SD SR SJ SE CH SY TW TJ TZ TH TL TG TK TO TT TN TR TM TC TV UG UA AE GB US UM UY UZ VU VE VN VG VI WF EH YE ZM ZW').split(' ');
  var PRIORITY = ['CL', 'AR', 'PE', 'CO', 'MX', 'EC', 'UY', 'PY', 'BO', 'VE', 'CR', 'PA', 'GT', 'DO', 'ES', 'US', 'BR'];
  // E.164 country calling codes for every country in the list (national prefix shown in the chip).
  var DIAL = {
    AF: '93', AX: '358', AL: '355', DZ: '213', AS: '1', AD: '376', AO: '244', AI: '1', AQ: '672', AG: '1', AR: '54', AM: '374', AW: '297', AU: '61', AT: '43', AZ: '994',
    BS: '1', BH: '973', BD: '880', BB: '1', BY: '375', BE: '32', BZ: '501', BJ: '229', BM: '1', BT: '975', BO: '591', BQ: '599', BA: '387', BW: '267', BV: '47', BR: '55', IO: '246', BN: '673', BG: '359', BF: '226', BI: '257',
    CV: '238', KH: '855', CM: '237', CA: '1', KY: '1', CF: '236', TD: '235', CL: '56', CN: '86', CX: '61', CC: '61', CO: '57', KM: '269', CG: '242', CD: '243', CK: '682', CR: '506', CI: '225', HR: '385', CU: '53', CW: '599', CY: '357', CZ: '420',
    DK: '45', DJ: '253', DM: '1', DO: '1', EC: '593', EG: '20', SV: '503', GQ: '240', ER: '291', EE: '372', SZ: '268', ET: '251',
    FK: '500', FO: '298', FJ: '679', FI: '358', FR: '33', GF: '594', PF: '689', TF: '262', GA: '241', GM: '220', GE: '995', DE: '49', GH: '233', GI: '350', GR: '30', GL: '299', GD: '1', GP: '590', GU: '1', GT: '502', GG: '44', GN: '224', GW: '245', GY: '592',
    HT: '509', HM: '672', VA: '39', HN: '504', HK: '852', HU: '36', IS: '354', IN: '91', ID: '62', IR: '98', IQ: '964', IE: '353', IM: '44', IL: '972', IT: '39', JM: '1', JP: '81', JE: '44', JO: '962',
    KZ: '7', KE: '254', KI: '686', KP: '850', KR: '82', KW: '965', KG: '996', LA: '856', LV: '371', LB: '961', LS: '266', LR: '231', LY: '218', LI: '423', LT: '370', LU: '352',
    MO: '853', MG: '261', MW: '265', MY: '60', MV: '960', ML: '223', MT: '356', MH: '692', MQ: '596', MR: '222', MU: '230', YT: '262', MX: '52', FM: '691', MD: '373', MC: '377', MN: '976', ME: '382', MS: '1', MA: '212', MZ: '258', MM: '95',
    NA: '264', NR: '674', NP: '977', NL: '31', NC: '687', NZ: '64', NI: '505', NE: '227', NG: '234', NU: '683', NF: '672', MK: '389', MP: '1', NO: '47', OM: '968',
    PK: '92', PW: '680', PS: '970', PA: '507', PG: '675', PY: '595', PE: '51', PH: '63', PN: '64', PL: '48', PT: '351', PR: '1', QA: '974', RE: '262', RO: '40', RU: '7', RW: '250',
    BL: '590', SH: '290', KN: '1', LC: '1', MF: '590', PM: '508', VC: '1', WS: '685', SM: '378', ST: '239', SA: '966', SN: '221', RS: '381', SC: '248', SL: '232', SG: '65', SX: '1', SK: '421', SI: '386', SB: '677', SO: '252', ZA: '27', GS: '500', SS: '211', ES: '34', LK: '94', SD: '249', SR: '597', SJ: '47', SE: '46', CH: '41', SY: '963',
    TW: '886', TJ: '992', TZ: '255', TH: '66', TL: '670', TG: '228', TK: '690', TO: '676', TT: '1', TN: '216', TR: '90', TM: '993', TC: '1', TV: '688',
    UG: '256', UA: '380', AE: '971', GB: '44', US: '1', UM: '1', UY: '598', UZ: '998', VU: '678', VE: '58', VN: '84', VG: '1', VI: '1', WF: '681', EH: '212', YE: '967', ZM: '260', ZW: '263'
  };
  var TZ_COUNTRY = { 'America/Santiago': 'CL', 'America/Punta_Arenas': 'CL', 'Pacific/Easter': 'CL', 'America/Argentina/Buenos_Aires': 'AR', 'America/Buenos_Aires': 'AR', 'America/Lima': 'PE', 'America/Bogota': 'CO', 'America/Mexico_City': 'MX', 'America/Guayaquil': 'EC', 'America/Montevideo': 'UY', 'America/Asuncion': 'PY', 'America/La_Paz': 'BO', 'America/Caracas': 'VE', 'America/Costa_Rica': 'CR', 'America/Panama': 'PA', 'Europe/Madrid': 'ES', 'America/Sao_Paulo': 'BR' };

  // Example region/city per country (for the placeholders). rE/cE = English variant when it differs.
  var EX = {
    // África
    DZ: { r: 'Argel', c: 'Argel', rE: 'Algiers', cE: 'Algiers' }, AO: { r: 'Luanda', c: 'Luanda' }, BJ: { r: 'Litoral', c: 'Cotonú', rE: 'Littoral', cE: 'Cotonou' }, BW: { r: 'Gaborone', c: 'Gaborone' },
    BF: { r: 'Centro', c: 'Uagadugú', rE: 'Centre', cE: 'Ouagadougou' }, BI: { r: 'Buyumbura', c: 'Buyumbura', rE: 'Bujumbura', cE: 'Bujumbura' }, CV: { r: 'Praia', c: 'Praia' },
    CM: { r: 'Centro', c: 'Yaundé', rE: 'Centre', cE: 'Yaoundé' }, CF: { r: 'Bangui', c: 'Bangui' }, TD: { r: 'Yamena', c: 'Yamena', rE: "N'Djamena", cE: "N'Djamena" }, KM: { r: 'Moroni', c: 'Moroni' },
    CG: { r: 'Brazzaville', c: 'Brazzaville' }, CD: { r: 'Kinsasa', c: 'Kinsasa', rE: 'Kinshasa', cE: 'Kinshasa' }, CI: { r: 'Abiyán', c: 'Abiyán', rE: 'Abidjan', cE: 'Abidjan' },
    DJ: { r: 'Yibuti', c: 'Yibuti', rE: 'Djibouti', cE: 'Djibouti' }, EG: { r: 'El Cairo', c: 'El Cairo', rE: 'Cairo', cE: 'Cairo' }, GQ: { r: 'Malabo', c: 'Malabo' }, ER: { r: 'Asmara', c: 'Asmara' },
    SZ: { r: 'Mbabane', c: 'Mbabane' }, ET: { r: 'Adís Abeba', c: 'Adís Abeba', rE: 'Addis Ababa', cE: 'Addis Ababa' }, GA: { r: 'Libreville', c: 'Libreville' }, GM: { r: 'Banjul', c: 'Banjul' },
    GH: { r: 'Gran Acra', c: 'Acra', rE: 'Greater Accra', cE: 'Accra' }, GN: { r: 'Conakri', c: 'Conakri', rE: 'Conakry', cE: 'Conakry' }, GW: { r: 'Bisáu', c: 'Bisáu', rE: 'Bissau', cE: 'Bissau' },
    KE: { r: 'Nairobi', c: 'Nairobi' }, LS: { r: 'Maseru', c: 'Maseru' }, LR: { r: 'Montserrado', c: 'Monrovia' }, LY: { r: 'Trípoli', c: 'Trípoli', rE: 'Tripoli', cE: 'Tripoli' },
    MG: { r: 'Antananarivo', c: 'Antananarivo' }, MW: { r: 'Lilongwe', c: 'Lilongwe' }, ML: { r: 'Bamako', c: 'Bamako' }, MR: { r: 'Nuakchot', c: 'Nuakchot', rE: 'Nouakchott', cE: 'Nouakchott' },
    MU: { r: 'Port Louis', c: 'Port Louis' }, MA: { r: 'Casablanca-Settat', c: 'Casablanca' }, MZ: { r: 'Maputo', c: 'Maputo' }, NA: { r: 'Windhoek', c: 'Windhoek' }, NE: { r: 'Niamey', c: 'Niamey' },
    NG: { r: 'Lagos', c: 'Lagos' }, RW: { r: 'Kigali', c: 'Kigali' }, ST: { r: 'Santo Tomé', c: 'Santo Tomé', rE: 'São Tomé', cE: 'São Tomé' }, SN: { r: 'Dakar', c: 'Dakar' }, SC: { r: 'Victoria', c: 'Victoria' },
    SL: { r: 'Freetown', c: 'Freetown' }, SO: { r: 'Mogadiscio', c: 'Mogadiscio', rE: 'Mogadishu', cE: 'Mogadishu' }, SS: { r: 'Yuba', c: 'Yuba', rE: 'Juba', cE: 'Juba' }, SD: { r: 'Jartum', c: 'Jartum', rE: 'Khartoum', cE: 'Khartoum' },
    TZ: { r: 'Dar es Salaam', c: 'Dar es Salaam' }, TG: { r: 'Lomé', c: 'Lomé' }, TN: { r: 'Túnez', c: 'Túnez', rE: 'Tunis', cE: 'Tunis' }, UG: { r: 'Kampala', c: 'Kampala' }, ZM: { r: 'Lusaka', c: 'Lusaka' }, ZW: { r: 'Harare', c: 'Harare' },
    // América
    AG: { r: "Saint John's", c: "Saint John's" }, BS: { r: 'Nasáu', c: 'Nasáu', rE: 'Nassau', cE: 'Nassau' }, BB: { r: 'Bridgetown', c: 'Bridgetown' }, BZ: { r: 'Belice', c: 'Ciudad de Belice', rE: 'Belize', cE: 'Belize City' },
    DM: { r: 'Roseau', c: 'Roseau' }, GD: { r: "Saint George's", c: "Saint George's" }, GY: { r: 'Demerara-Mahaica', c: 'Georgetown' }, HT: { r: 'Oeste', c: 'Puerto Príncipe', rE: 'Ouest', cE: 'Port-au-Prince' },
    JM: { r: 'Kingston', c: 'Kingston' }, KN: { r: 'Basseterre', c: 'Basseterre' }, LC: { r: 'Castries', c: 'Castries' }, VC: { r: 'Kingstown', c: 'Kingstown' }, SR: { r: 'Paramaribo', c: 'Paramaribo' },
    TT: { r: 'Puerto España', c: 'Puerto España', rE: 'Port of Spain', cE: 'Port of Spain' },
    // Asia
    AF: { r: 'Kabul', c: 'Kabul' }, AM: { r: 'Ereván', c: 'Ereván', rE: 'Yerevan', cE: 'Yerevan' }, AZ: { r: 'Bakú', c: 'Bakú', rE: 'Baku', cE: 'Baku' }, BH: { r: 'Manama', c: 'Manama' },
    BD: { r: 'Daca', c: 'Daca', rE: 'Dhaka', cE: 'Dhaka' }, BT: { r: 'Timbu', c: 'Timbu', rE: 'Thimphu', cE: 'Thimphu' }, BN: { r: 'Bandar Seri Begawan', c: 'Bandar Seri Begawan' },
    KH: { r: 'Nom Pen', c: 'Nom Pen', rE: 'Phnom Penh', cE: 'Phnom Penh' }, CY: { r: 'Nicosia', c: 'Nicosia' }, GE: { r: 'Tiflis', c: 'Tiflis', rE: 'Tbilisi', cE: 'Tbilisi' }, ID: { r: 'Yakarta', c: 'Yakarta', rE: 'Jakarta', cE: 'Jakarta' },
    IR: { r: 'Teherán', c: 'Teherán', rE: 'Tehran', cE: 'Tehran' }, IQ: { r: 'Bagdad', c: 'Bagdad', rE: 'Baghdad', cE: 'Baghdad' }, JO: { r: 'Amán', c: 'Amán', rE: 'Amman', cE: 'Amman' }, KZ: { r: 'Almaty', c: 'Almaty' },
    KW: { r: 'Kuwait', c: 'Ciudad de Kuwait', rE: 'Kuwait', cE: 'Kuwait City' }, KG: { r: 'Biskek', c: 'Biskek', rE: 'Bishkek', cE: 'Bishkek' }, LA: { r: 'Vientián', c: 'Vientián', rE: 'Vientiane', cE: 'Vientiane' },
    LB: { r: 'Beirut', c: 'Beirut' }, MY: { r: 'Kuala Lumpur', c: 'Kuala Lumpur' }, MV: { r: 'Malé', c: 'Malé' }, MN: { r: 'Ulán Bator', c: 'Ulán Bator', rE: 'Ulaanbaatar', cE: 'Ulaanbaatar' },
    MM: { r: 'Rangún', c: 'Rangún', rE: 'Yangon', cE: 'Yangon' }, NP: { r: 'Katmandú', c: 'Katmandú', rE: 'Kathmandu', cE: 'Kathmandu' }, KP: { r: 'Pionyang', c: 'Pionyang', rE: 'Pyongyang', cE: 'Pyongyang' },
    OM: { r: 'Mascate', c: 'Mascate', rE: 'Muscat', cE: 'Muscat' }, PK: { r: 'Sindh', c: 'Karachi' }, PH: { r: 'Manila', c: 'Manila' }, QA: { r: 'Doha', c: 'Doha' }, SA: { r: 'Riad', c: 'Riad', rE: 'Riyadh', cE: 'Riyadh' },
    SG: { r: 'Singapur', c: 'Singapur', rE: 'Singapore', cE: 'Singapore' }, LK: { r: 'Colombo', c: 'Colombo' }, SY: { r: 'Damasco', c: 'Damasco', rE: 'Damascus', cE: 'Damascus' }, TJ: { r: 'Dusambé', c: 'Dusambé', rE: 'Dushanbe', cE: 'Dushanbe' },
    TH: { r: 'Bangkok', c: 'Bangkok' }, TL: { r: 'Dili', c: 'Dili' }, TM: { r: 'Asjabad', c: 'Asjabad', rE: 'Ashgabat', cE: 'Ashgabat' }, TR: { r: 'Estambul', c: 'Estambul', rE: 'Istanbul', cE: 'Istanbul' },
    UZ: { r: 'Taskent', c: 'Taskent', rE: 'Tashkent', cE: 'Tashkent' }, VN: { r: 'Ciudad Ho Chi Minh', c: 'Ciudad Ho Chi Minh', rE: 'Ho Chi Minh City', cE: 'Ho Chi Minh City' }, YE: { r: 'Saná', c: 'Saná', rE: 'Sanaa', cE: 'Sanaa' },
    // Europa
    AL: { r: 'Tirana', c: 'Tirana' }, AD: { r: 'Andorra la Vieja', c: 'Andorra la Vieja', rE: 'Andorra la Vella', cE: 'Andorra la Vella' }, AT: { r: 'Viena', c: 'Viena', rE: 'Vienna', cE: 'Vienna' },
    BY: { r: 'Minsk', c: 'Minsk' }, BA: { r: 'Sarajevo', c: 'Sarajevo' }, BG: { r: 'Sofía', c: 'Sofía', rE: 'Sofia', cE: 'Sofia' }, HR: { r: 'Zagreb', c: 'Zagreb' }, CZ: { r: 'Praga', c: 'Praga', rE: 'Prague', cE: 'Prague' },
    DK: { r: 'Copenhague', c: 'Copenhague', rE: 'Copenhagen', cE: 'Copenhagen' }, EE: { r: 'Tallin', c: 'Tallin', rE: 'Tallinn', cE: 'Tallinn' }, FI: { r: 'Uusimaa', c: 'Helsinki' }, GR: { r: 'Ática', c: 'Atenas', rE: 'Attica', cE: 'Athens' },
    HU: { r: 'Budapest', c: 'Budapest' }, IS: { r: 'Capital', c: 'Reikiavik', rE: 'Capital Region', cE: 'Reykjavik' }, LV: { r: 'Riga', c: 'Riga' }, LI: { r: 'Vaduz', c: 'Vaduz' }, LT: { r: 'Vilna', c: 'Vilna', rE: 'Vilnius', cE: 'Vilnius' },
    LU: { r: 'Luxemburgo', c: 'Luxemburgo', rE: 'Luxembourg', cE: 'Luxembourg' }, MT: { r: 'La Valeta', c: 'La Valeta', rE: 'Valletta', cE: 'Valletta' }, MD: { r: 'Chisináu', c: 'Chisináu', rE: 'Chisinau', cE: 'Chisinau' },
    MC: { r: 'Mónaco', c: 'Mónaco', rE: 'Monaco', cE: 'Monaco' }, ME: { r: 'Podgorica', c: 'Podgorica' }, MK: { r: 'Skopie', c: 'Skopie', rE: 'Skopje', cE: 'Skopje' }, NO: { r: 'Oslo', c: 'Oslo' },
    PL: { r: 'Mazovia', c: 'Varsovia', rE: 'Masovia', cE: 'Warsaw' }, RO: { r: 'Bucarest', c: 'Bucarest', rE: 'Bucharest', cE: 'Bucharest' }, RU: { r: 'Moscú', c: 'Moscú', rE: 'Moscow', cE: 'Moscow' }, SM: { r: 'San Marino', c: 'San Marino' },
    RS: { r: 'Belgrado', c: 'Belgrado', rE: 'Belgrade', cE: 'Belgrade' }, SK: { r: 'Bratislava', c: 'Bratislava' }, SI: { r: 'Liubliana', c: 'Liubliana', rE: 'Ljubljana', cE: 'Ljubljana' }, SE: { r: 'Estocolmo', c: 'Estocolmo', rE: 'Stockholm', cE: 'Stockholm' },
    UA: { r: 'Kiev', c: 'Kiev', rE: 'Kyiv', cE: 'Kyiv' },
    // Oceanía
    FJ: { r: 'Suva', c: 'Suva' }, KI: { r: 'Tarawa', c: 'Tarawa' }, MH: { r: 'Majuro', c: 'Majuro' }, FM: { r: 'Palikir', c: 'Palikir' }, NR: { r: 'Yaren', c: 'Yaren' }, PW: { r: 'Ngerulmud', c: 'Ngerulmud' },
    PG: { r: 'Port Moresby', c: 'Port Moresby' }, WS: { r: 'Apia', c: 'Apia' }, SB: { r: 'Honiara', c: 'Honiara' }, TO: { r: 'Nukualofa', c: 'Nukualofa' }, TV: { r: 'Funafuti', c: 'Funafuti' }, VU: { r: 'Port Vila', c: 'Port Vila' },
    // Mercados ya definidos
    AR: { r: 'Buenos Aires', c: 'Córdoba' }, PE: { r: 'Lima', c: 'Arequipa' }, CO: { r: 'Cundinamarca', c: 'Bogotá' }, MX: { r: 'Jalisco', c: 'Guadalajara' },
    EC: { r: 'Pichincha', c: 'Quito' }, UY: { r: 'Montevideo', c: 'Montevideo' }, PY: { r: 'Central', c: 'Asunción' }, BO: { r: 'Santa Cruz', c: 'Santa Cruz de la Sierra' },
    VE: { r: 'La Guaira', c: 'Maiquetía' }, CR: { r: 'San José', c: 'San José' }, PA: { r: 'Panamá', c: 'Ciudad de Panamá' }, GT: { r: 'Guatemala', c: 'Ciudad de Guatemala' },
    DO: { r: 'Distrito Nacional', c: 'Santo Domingo' }, SV: { r: 'San Salvador', c: 'San Salvador' }, HN: { r: 'Cortés', c: 'San Pedro Sula' }, NI: { r: 'Managua', c: 'Managua' },
    CU: { r: 'La Habana', c: 'La Habana', cE: 'Havana' }, PR: { r: 'San Juan', c: 'San Juan' }, ES: { r: 'Madrid', c: 'Barcelona' }, US: { r: 'California', c: 'San Diego' },
    CA: { r: 'Ontario', c: 'Toronto' }, BR: { r: 'São Paulo', c: 'São Paulo' }, GB: { r: 'Inglaterra', c: 'Londres', rE: 'England', cE: 'London' },
    FR: { r: 'Isla de Francia', c: 'París', rE: 'Île-de-France', cE: 'Paris' }, DE: { r: 'Baviera', c: 'Múnich', rE: 'Bavaria', cE: 'Munich' },
    IT: { r: 'Lacio', c: 'Roma', rE: 'Lazio', cE: 'Rome' }, PT: { r: 'Lisboa', c: 'Lisboa', cE: 'Lisbon' }, NL: { r: 'Holanda Septentrional', c: 'Ámsterdam', rE: 'North Holland', cE: 'Amsterdam' },
    BE: { r: 'Bruselas', c: 'Bruselas', rE: 'Brussels', cE: 'Brussels' }, CH: { r: 'Zúrich', c: 'Zúrich', rE: 'Zurich', cE: 'Zurich' }, IE: { r: 'Leinster', c: 'Dublín', cE: 'Dublin' },
    AU: { r: 'Nueva Gales del Sur', c: 'Sídney', rE: 'New South Wales', cE: 'Sydney' }, NZ: { r: 'Auckland', c: 'Auckland' }, JP: { r: 'Tokio', c: 'Tokio', rE: 'Tokyo', cE: 'Tokyo' },
    KR: { r: 'Seúl', c: 'Seúl', rE: 'Seoul', cE: 'Seoul' }, CN: { r: 'Guangdong', c: 'Shenzhen' }, IN: { r: 'Maharashtra', c: 'Mumbai' },
    AE: { r: 'Dubái', c: 'Dubái', rE: 'Dubai', cE: 'Dubai' }, IL: { r: 'Tel Aviv', c: 'Tel Aviv' }, ZA: { r: 'Gauteng', c: 'Johannesburgo', cE: 'Johannesburg' }
  };

  var ui = {
    es: {
      b1: 'Tus datos', b1s: 'Para responderte', b2: 'Tu proyecto', b2s: 'Qué quieres resolver',
      name: 'Nombre', email: 'Correo electrónico', company: 'Empresa', phone: 'Teléfono', country: 'País',
      region: 'Región', comuna: 'Comuna', state: 'Región / Estado', city: 'Ciudad',
      opt: 'opcional', phName: 'Juan Pérez', phEmail: 'juan@empresa.com', phCompany: 'Tu empresa', phPhone: '9 1234 5678', phPhoneIntl: '+código país y número',
      phState: 'Ej: tu región o estado', phCity: 'Ej: tu ciudad', exPre: 'Ej: ', selCountry: 'Selecciona tu país', searchCountry: 'Buscar país…', suggested: 'Sugerido', all: 'Todos los países',
      selRegion: 'Selecciona una región', selComunaFirst: 'Primero la región', selComuna: 'Selecciona una comuna',
      service: '¿Qué quieres automatizar?', toggle: 'Ayúdanos a preparar tu propuesta', toggleSub: '5 preguntas rápidas · opcional · 30 segundos',
      rubro: 'Rubro de tu negocio', selRubro: 'Selecciona tu rubro', rubroOther: 'Otro (escribe tu rubro)', phRubro: 'Ej: Taller de bicicletas',
      problem: '¿Cuál es el principal problema hoy?', problemOther: 'Cuéntanos el problema', volume: '¿Cuántos mensajes de clientes recibes al día?',
      team: '¿Cuántas personas hacen hoy este trabajo?', urgency: '¿Cuándo te gustaría empezar?',
      details: 'Cuéntanos más', detailsReq: 'Cuéntanos qué necesitas', phDetails: 'Describe brevemente el proceso, las herramientas que usas o lo que te gustaría lograr…',
      consent: 'Acepto la <a href="/es/privacidad/" class="cx-link" target="_blank" rel="noopener">Política de Privacidad</a> y que DYNX Labs me contacte para responder esta solicitud.',
      news: 'Quiero recibir novedades y contenido de DYNX Labs por correo electrónico. Es opcional y puedo darme de baja cuando quiera.',
      submit: 'Enviar solicitud', sending: 'Enviando…', or: 'o si prefieres hablar ahora', wa: 'Escríbenos por WhatsApp',
      hint: 'Respondemos en menos de 48 horas hábiles. Usamos tus datos solo para responder esta solicitud.',
      errReq: 'Campo obligatorio', errEmail: 'Ingresa un correo válido', errName: 'Ingresa tu nombre', errPhone: 'Revisa el número (solo dígitos, 6 a 15)', errService: 'Elige una opción',
      errConsent: 'Necesitamos tu aceptación para responderte', errText: 'Sin enlaces ni símbolos especiales al inicio', errDetails: 'Cuéntanos al menos en una frase (10 caracteres)',
      okTitle: '¡Gracias, {n}!', okSub: 'Recibimos tu solicitud. Te escribiremos a {e} en menos de 48 horas hábiles.', okAgain: 'Enviar otra solicitud', errSend: 'No pudimos enviar tu solicitud. Intenta de nuevo o escríbenos por WhatsApp.',
      mkFab: 'Mockup · ver datos → hoja Database', mkBadge: 'Mockup — no envía datos'
    },
    en: {
      b1: 'Your details', b1s: 'So we can reply', b2: 'Your project', b2s: 'What you want to solve',
      name: 'Name', email: 'Email', company: 'Company', phone: 'Phone', country: 'Country',
      region: 'Region', comuna: 'Comuna', state: 'State / Region', city: 'City',
      opt: 'optional', phName: 'Jane Smith', phEmail: 'jane@company.com', phCompany: 'Your company', phPhone: '555 123 4567', phPhoneIntl: '+country code and number',
      phState: 'E.g. your state/region', phCity: 'E.g. your city', exPre: 'E.g. ', selCountry: 'Select your country', searchCountry: 'Search country…', suggested: 'Suggested', all: 'All countries',
      selRegion: 'Select a region', selComunaFirst: 'Select the region first', selComuna: 'Select a comuna',
      service: 'What do you want to automate?', toggle: 'Help us prepare your proposal', toggleSub: '5 quick questions · optional · 30 seconds',
      rubro: 'Your industry', selRubro: 'Select your industry', rubroOther: 'Other (type your industry)', phRubro: 'E.g. Bike repair shop',
      problem: 'What is the main problem today?', problemOther: 'Tell us the problem', volume: 'How many customer messages do you get a day?',
      team: 'How many people do this work today?', urgency: 'When would you like to start?',
      details: 'Tell us more', detailsReq: 'Tell us what you need', phDetails: 'Briefly describe the process, the tools you use or what you would like to achieve…',
      consent: 'I accept the <a href="/en/privacy/" class="cx-link" target="_blank" rel="noopener">Privacy Policy</a> and agree that DYNX Labs may contact me about this request.',
      news: 'I want to receive DYNX Labs news and content by email. This is optional and I can unsubscribe anytime.',
      submit: 'Send request', sending: 'Sending…', or: 'or if you prefer to talk now', wa: 'Message us on WhatsApp',
      hint: 'We reply within 48 business hours. We only use your data to answer this request.',
      errReq: 'Required field', errEmail: 'Enter a valid email', errName: 'Enter your name', errPhone: 'Check the number (digits only, 6 to 15)', errService: 'Choose an option',
      errConsent: 'We need your consent to reply', errText: 'No links or special symbols at the start', errDetails: 'Tell us in at least one sentence (10 characters)',
      okTitle: 'Thank you, {n}!', okSub: 'We received your request. We will write to {e} within 48 business hours.', okAgain: 'Send another request', errSend: 'We could not send your request. Please try again or message us on WhatsApp.',
      mkFab: 'Mockup · view data → Database sheet', mkBadge: 'Mockup — sends nothing'
    }
  }[LANG];

  var regionNames = (function () { try { return { es: new Intl.DisplayNames(['es'], { type: 'region' }), ui: new Intl.DisplayNames([LANG], { type: 'region' }) }; } catch (e) { return null; } })();
  function cname(code, lang) { if (!regionNames) return code; return (lang === 'es' ? regionNames.es : regionNames.ui).of(code) || code; }
  function detectCountry() {
    try { var tz = Intl.DateTimeFormat().resolvedOptions().timeZone; if (TZ_COUNTRY[tz]) return TZ_COUNTRY[tz]; } catch (e) {}
    var langs = navigator.languages || [navigator.language || ''];
    for (var i = 0; i < langs.length; i++) { var m = /-([A-Z]{2})$/i.exec(langs[i] || ''); if (m && ISO.indexOf(m[1].toUpperCase()) > -1) return m[1].toUpperCase(); }
    return '';
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function lab(o) { return LANG === 'en' ? o.en : o.v; }
  function chips(name, list, extra) {
    return '<div class="cx-chips" id="cx-' + name + '">' + list.map(function (o, i) {
      return '<label class="cx-chip"><input type="radio" name="' + name + '" value="' + esc(o.v) + '"' + (o.other ? ' data-other' : '') + '><span>' + esc(lab(o)) + '</span></label>';
    }).join('') + '</div>' + (extra || '');
  }
  function optTag() { return '<span class="cx-opt">· ' + ui.opt + '</span>'; }
  function req() { return '<span class="cx-req" aria-hidden="true">*</span>'; }

  /* ---------- render ---------- */
  var card = document.querySelector('.contact-wrap .form-card');
  var detected = detectCountry();
  var allCountries = ISO.slice().sort(function (a, b) { return cname(a, LANG).localeCompare(cname(b, LANG), LANG); });
  var countryOpts = '<option value="" disabled' + (detected ? '' : ' selected') + '>' + ui.selCountry + '</option>' +
    allCountries.map(function (c) { return '<option value="' + c + '"' + (c === detected ? ' selected' : '') + '>' + esc(cname(c, LANG)) + '</option>'; }).join('');
  var rubroOpts = '<option value="">' + ui.selRubro + '</option>' + RUBROS.map(function (r) { return [r, LANG === 'en' ? r[1] : r[0]]; })
    .sort(function (a, b) { return a[1].localeCompare(b[1], LANG); })
    .map(function (x) { return '<option value="' + esc(x[0][0]) + '">' + esc(x[1]) + '</option>'; }).join('') + '<option value="Otro">' + ui.rubroOther + '</option>';
  var regionOpts = '<option value="">' + ui.selRegion + '</option>' + Object.keys(COMUNAS).sort(function (a, b) { return a.localeCompare(b, 'es'); }).map(function (r) { return '<option>' + esc(r) + '</option>'; }).join('');

  card.innerHTML =
    '<div class="success-msg" id="successMsg" role="status" aria-live="polite">' +
      '<div class="success-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:#B3B3B3" aria-hidden="true"><path d="M20 6L9 17l-5-5"></path></svg></div>' +
      '<p class="success-title" id="okTitle"></p><p class="success-subtitle" id="okSub"></p>' +
      '<button type="button" class="cx-reset" id="cxReset">' + ui.okAgain + '</button>' +
    '</div>' +
    '<div class="form-content" id="formContent"><form id="contactForm" novalidate><div class="cx-steps">' +
      // block 1
      '<section class="cx-block" aria-labelledby="cx-b1"><div class="cx-block-head"><span class="cx-num">01</span><h2 class="cx-block-title" id="cx-b1">' + ui.b1 + '</h2><span class="cx-block-sub">' + ui.b1s + '</span></div>' +
      '<div class="form-grid" style="margin:0">' +
        '<div class="form-group"><label for="cx_name">' + ui.name + '<span class="cx-req" aria-hidden="true">*</span></label><input id="cx_name" name="name" autocomplete="name" placeholder="' + ui.phName + '" maxlength="80" required><span class="error-msg" id="err-cx_name"></span></div>' +
        '<div class="form-group"><label for="cx_email">' + ui.email + '<span class="cx-req" aria-hidden="true">*</span></label><input id="cx_email" name="email" type="email" autocomplete="email" inputmode="email" placeholder="' + ui.phEmail + '" maxlength="120" required><span class="error-msg" id="err-cx_email"></span></div>' +
        '<div class="form-group"><span class="cx-label" id="cx_country_lbl">' + ui.country + req() + '</span>' +
          '<div class="cx-country" id="cxCountry">' +
            '<button type="button" class="cx-country-btn" id="cxCountryBtn" aria-haspopup="listbox" aria-expanded="false" aria-labelledby="cx_country_lbl cxCountryVal">' +
              '<img class="cx-flag" id="cxFlag" alt="" width="24" height="18" src="/assets/flags/cl.svg">' +
              '<span class="cx-country-val" id="cxCountryVal"></span><span class="select-caret" aria-hidden="true"></span></button>' +
            '<div class="cx-country-pop" id="cxCountryPop" hidden>' +
              '<input type="search" class="cx-country-search" id="cxCountrySearch" placeholder="' + ui.searchCountry + '" aria-label="' + ui.searchCountry + '" autocomplete="off">' +
              '<ul class="cx-country-list" id="cxCountryList" role="listbox" aria-labelledby="cx_country_lbl"></ul>' +
            '</div>' +
          '</div>' +
          '<select id="cx_country" name="country" autocomplete="country" required hidden tabindex="-1" aria-hidden="true">' + countryOpts + '</select>' +
          '<span class="error-msg" id="err-cx_country"></span></div>' +
        '<div class="form-group"><label for="cx_phone">' + ui.phone + req() + '</label><div class="cx-phone"><span class="cx-dial" id="cx_dial" aria-hidden="true">+</span><input id="cx_phone" name="phone" type="tel" autocomplete="tel-national" inputmode="tel" maxlength="20" required></div><span class="error-msg" id="err-cx_phone"></span></div>' +
        '<div class="form-group full"><label for="cx_company">' + ui.company + req() + '</label><input id="cx_company" name="company" autocomplete="organization" placeholder="' + ui.phCompany + '" maxlength="100" required><span class="error-msg" id="err-cx_company"></span></div>' +
        '<div class="form-group" id="g_region_cl"><label for="cx_region_cl">' + ui.region + req() + '</label><div class="select-wrapper"><select id="cx_region_cl">' + regionOpts + '</select></div><span class="error-msg" id="err-cx_region_cl"></span></div>' +
        '<div class="form-group" id="g_comuna_cl"><label for="cx_comuna_cl">' + ui.comuna + req() + '</label><div class="select-wrapper"><select id="cx_comuna_cl" disabled><option value="">' + ui.selComunaFirst + '</option></select></div><span class="error-msg" id="err-cx_comuna_cl"></span></div>' +
        '<div class="form-group" id="g_region_x"><label for="cx_region_x">' + ui.state + req() + '</label><input id="cx_region_x" autocomplete="address-level1" placeholder="' + ui.phState + '" maxlength="60"><span class="error-msg" id="err-cx_region_x"></span></div>' +
        '<div class="form-group" id="g_city_x"><label for="cx_city_x">' + ui.city + req() + '</label><input id="cx_city_x" autocomplete="address-level2" placeholder="' + ui.phCity + '" maxlength="60"><span class="error-msg" id="err-cx_city_x"></span></div>' +
      '</div></section>' +
      // block 2
      '<section class="cx-block" aria-labelledby="cx-b2"><div class="cx-block-head"><span class="cx-num">02</span><h2 class="cx-block-title" id="cx-b2">' + ui.b2 + '</h2><span class="cx-block-sub">' + ui.b2s + '</span></div>' +
        '<fieldset class="cx-field"><legend>' + ui.service + '<span class="cx-req" aria-hidden="true">*</span></legend><div class="cx-cards" id="cx-service">' +
          SERVICES.map(function (s) { var t = s[LANG]; return '<label class="cx-card"><input type="radio" name="service" value="' + esc(s.v) + '"' + (s.messaging ? ' data-msg' : '') + (s.other ? ' data-other' : '') + '><span><b>' + esc(t[0]) + '</b><small>' + esc(t[1]) + '</small></span></label>'; }).join('') +
        '</div><span class="error-msg" id="err-service"></span></fieldset>' +
        '<div class="form-group full" id="g_details"><label for="cx_details"><span id="lbl_details">' + ui.details + '</span><span id="opt_details">' + optTag() + '</span><span class="cx-req" id="req_details" aria-hidden="true" hidden>*</span></label><textarea id="cx_details" name="details" maxlength="1000" placeholder="' + ui.phDetails + '"></textarea><div class="cx-count" id="cx_count">0 / 1000</div><span class="error-msg" id="err-cx_details"></span></div>' +
        '<button type="button" class="cx-toggle" id="cxToggle" aria-expanded="false" aria-controls="cxOptional"><span>' + ui.toggle + '<small>' + ui.toggleSub + '</small></span><span class="cx-plus" aria-hidden="true">+</span></button>' +
        '<div class="cx-optional" id="cxOptional" hidden>' +
          '<div class="form-grid" style="margin:0"><div class="form-group full"><label for="cx_rubro">' + ui.rubro + optTag() + '</label><div class="select-wrapper"><select id="cx_rubro">' + rubroOpts + '</select></div></div>' +
          '<div class="form-group full" id="g_rubro_x" hidden><label for="cx_rubro_x">' + ui.rubroOther + '</label><input id="cx_rubro_x" maxlength="60" placeholder="' + ui.phRubro + '"><span class="error-msg" id="err-cx_rubro_x"></span></div></div>' +
          '<fieldset class="cx-field"><legend>' + ui.problem + optTag() + '</legend><div id="cx-problem-wrap"></div></fieldset>' +
          '<div class="form-group full" id="g_problem_x" hidden><label for="cx_problem_x">' + ui.problemOther + '</label><input id="cx_problem_x" maxlength="120"><span class="error-msg" id="err-cx_problem_x"></span></div>' +
          '<fieldset class="cx-field" id="g_volume" hidden><legend>' + ui.volume + optTag() + '</legend>' + chips('volume', VOLUME) + '</fieldset>' +
          '<fieldset class="cx-field"><legend>' + ui.team + optTag() + '</legend>' + chips('team', TEAM) + '</fieldset>' +
          '<fieldset class="cx-field"><legend>' + ui.urgency + optTag() + '</legend>' + chips('urgency', URGENCY) + '</fieldset>' +
        '</div>' +
      '</section>' +
      // consent
      '<div class="cx-consent"><label class="cx-check"><input type="checkbox" id="cx_consent" required><span>' + ui.consent + '<span class="cx-req" aria-hidden="true">*</span></span></label><span class="error-msg" id="err-cx_consent"></span>' +
      '<label class="cx-check"><input type="checkbox" id="cx_news"><span>' + ui.news + '</span></label></div>' +
      '<div class="cx-hp" aria-hidden="true"><label for="cx_website">Website</label><input id="cx_website" name="website" tabindex="-1" autocomplete="off"></div>' +
      '<div><button type="submit" class="btn-submit" id="cxSubmit"><span class="cx-spin" aria-hidden="true"></span><svg class="cx-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"></path></svg><span id="cxSubmitTxt">' + ui.submit + '</span></button>' +
      '<div class="form-divider"><span>' + ui.or + '</span></div>' +
      '<a href="https://wa.me/56984657801" class="btn-whatsapp" target="_blank" rel="noopener noreferrer"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.47-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.06 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.18-1.41-.08-.13-.28-.2-.57-.35M12.05 21.79h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.88 9.88m8.41-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.69 1.45c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.17-3.48-8.41Z"></path></svg><span>' + ui.wa + '</span></a>' +
      '<p class="form-hint">' + ui.hint + '</p></div>' +
    '</div></form></div>';

  /* ---------- behaviour ---------- */
  var $ = function (id) { return document.getElementById(id); };
  var form = $('contactForm'), started = Date.now();
  var country = $('cx_country'), phone = $('cx_phone'), dial = $('cx_dial');

  /* ---------- phone mask per country (national number only; the prefix is shown apart) ----------
     max = national significant digits; g = display groups. Unknown countries: generic grouping. */
  var PH = {
    CL: { max: 9, g: [1, 4, 4] }, AR: { max: 10, g: [2, 4, 4] }, PE: { max: 9, g: [3, 3, 3] }, CO: { max: 10, g: [3, 3, 4] },
    MX: { max: 10, g: [2, 4, 4] }, EC: { max: 9, g: [2, 3, 4] }, UY: { max: 8, g: [1, 3, 4] }, PY: { max: 9, g: [3, 3, 3] },
    BO: { max: 8, g: [4, 4] }, VE: { max: 10, g: [3, 3, 4] }, CR: { max: 8, g: [4, 4] }, PA: { max: 8, g: [4, 4] },
    GT: { max: 8, g: [4, 4] }, DO: { max: 10, g: [3, 3, 4] }, PR: { max: 10, g: [3, 3, 4] }, SV: { max: 8, g: [4, 4] },
    HN: { max: 8, g: [4, 4] }, NI: { max: 8, g: [4, 4] }, ES: { max: 9, g: [3, 3, 3] }, US: { max: 10, g: [3, 3, 4] },
    CA: { max: 10, g: [3, 3, 4] }, BR: { max: 11, g: [2, 5, 4] }, GB: { max: 10, g: [4, 3, 3] }, FR: { max: 9, g: [1, 2, 2, 2, 2] },
    DE: { max: 11, g: [3, 4, 4] }, IT: { max: 10, g: [3, 3, 4] }, PT: { max: 9, g: [3, 3, 3] }, AU: { max: 9, g: [3, 3, 3] },
    NZ: { max: 9, g: [2, 3, 4] }, JP: { max: 10, g: [2, 4, 4] }, KR: { max: 10, g: [2, 4, 4] }, CN: { max: 11, g: [3, 4, 4] },
    IN: { max: 10, g: [5, 5] }, AE: { max: 9, g: [2, 3, 4] }, IL: { max: 9, g: [2, 3, 4] }, ZA: { max: 9, g: [2, 3, 4] }
  };
  function phMeta() { var m = PH[country.value]; if (m) return m; var dl = String(DIAL[country.value] || '').length; return { max: Math.max(6, Math.min(14, 15 - dl)), g: null }; }
  function groupDigits(d, g) {
    if (!g) return d.replace(/(\d{3})(?=\d)/g, '$1 ');
    var out = [], rest = d;
    for (var i = 0; i < g.length && rest.length; i++) { out.push(rest.slice(0, g[i])); rest = rest.slice(g[i]); }
    if (rest.length) out.push(rest);
    return out.join(' ');
  }
  function phMask() { var m = phMeta(); return m.g ? m.g.map(function (n) { return new Array(n + 1).join('X'); }).join(' ') : ui.phPhoneIntl; }
  function formatPhone() {
    var m = phMeta(), el = phone, pos = el.selectionStart || 0;
    var before = el.value.slice(0, pos).replace(/\D/g, '').length;
    var digits = el.value.replace(/\D/g, ''), dialD = String(DIAL[country.value] || '');
    if (dialD && digits.length > m.max && digits.indexOf(dialD) === 0) { digits = digits.slice(dialD.length); before = Math.max(0, before - dialD.length); }
    digits = digits.slice(0, m.max);
    el.value = groupDigits(digits, m.g);
    var seen = 0, i = 0; for (; i < el.value.length && seen < before; i++) { if (/\d/.test(el.value.charAt(i))) seen++; }
    try { el.setSelectionRange(i, i); } catch (e) {}
  }

  function setLocation() {
    var c = country.value, isCL = c === 'CL';
    ['g_region_cl', 'g_comuna_cl'].forEach(function (id) { $(id).hidden = !isCL; });
    ['g_region_x', 'g_city_x'].forEach(function (id) { $(id).hidden = isCL || !c; });
    (isCL ? ['cx_region_x', 'cx_city_x'] : ['cx_region_cl', 'cx_comuna_cl']).forEach(clearErr);
    var d = DIAL[c];
    dial.textContent = d ? '+' + d : '+';
    dial.classList.toggle('is-empty', !d);
    phone.placeholder = phMask();
    if (typeof renderCountryBtn === "function") renderCountryBtn();
    if (phone.value) formatPhone();
    if (!isCL && c) {
      var ex = EX[c];
      $('cx_region_x').placeholder = ex ? ui.exPre + (LANG === 'en' && ex.rE ? ex.rE : ex.r) : ui.phState;
      $('cx_city_x').placeholder = ex ? ui.exPre + (LANG === 'en' && ex.cE ? ex.cE : ex.c) : ui.phCity;
    }
    update();
  }
  country.addEventListener('change', function () { clearErr('cx_country'); setLocation(); });

  /* ---------- country picker with SVG flags (a native <select> cannot show flags on Windows) ---------- */
  var FLAG_BASE = '/assets/flags/';
  var cBtn = $('cxCountryBtn'), cPop = $('cxCountryPop'), cList = $('cxCountryList'), cSearch = $('cxCountrySearch');
  var cVal = $('cxCountryVal'), cFlag = $('cxFlag');
  function strip(s) { return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
  function countryName(code) { var o = country.querySelector('option[value="' + code + '"]'); return o ? o.textContent : ''; }
  function renderCountryBtn() {
    var c = country.value;
    cVal.textContent = c ? countryName(c) : ui.selCountry;
    cVal.classList.toggle('is-placeholder', !c);
    cFlag.hidden = !c;
    if (c) cFlag.src = FLAG_BASE + c.toLowerCase() + '.svg';
    cList.querySelectorAll('[role=option]').forEach(function (li) { li.setAttribute('aria-selected', String(li.dataset.v === c)); });
  }
  function buildCountryList() {
    cList.innerHTML = Array.prototype.slice.call(country.options).filter(function (o) { return o.value; }).map(function (o) {
      return '<li role="option" tabindex="-1" data-v="' + o.value + '" data-s="' + esc(strip(o.textContent)) + '" aria-selected="false">' +
        '<img class="cx-flag" src="' + FLAG_BASE + o.value.toLowerCase() + '.svg" alt="" width="24" height="18" loading="lazy">' +
        '<span class="cx-opt-name">' + esc(o.textContent) + '</span><span class="cx-opt-dial">' + (DIAL[o.value] ? '+' + DIAL[o.value] : '') + '</span></li>';
    }).join('');
  }
  function visibleOpts() { return Array.prototype.slice.call(cList.querySelectorAll('[role=option]')).filter(function (li) { return !li.hidden; }); }
  function filterCountry() {
    var q = strip(cSearch.value.trim());
    cList.querySelectorAll('[role=option]').forEach(function (li) { li.hidden = !!q && li.dataset.s.indexOf(q) < 0; });
  }
  function openCountry() {
    cPop.hidden = false; cBtn.setAttribute('aria-expanded', 'true');
    cSearch.value = ''; filterCountry();
    var sel = cList.querySelector('[aria-selected=true]');
    if (sel) sel.scrollIntoView({ block: 'nearest' });
    setTimeout(function () { cSearch.focus(); }, 0);
  }
  function closeCountry(focusBtn) { cPop.hidden = true; cBtn.setAttribute('aria-expanded', 'false'); if (focusBtn) cBtn.focus(); }
  function pickCountry(code) {
    country.value = code; clearErr('cx_country'); renderCountryBtn(); closeCountry(true);
    country.dispatchEvent(new Event('change', { bubbles: true }));
  }
  buildCountryList(); renderCountryBtn();
  cBtn.addEventListener('click', function () { if (cPop.hidden) openCountry(); else closeCountry(false); });
  cBtn.addEventListener('keydown', function (e) { if (e.key === 'ArrowDown' && cPop.hidden) { e.preventDefault(); openCountry(); } });
  cSearch.addEventListener('input', filterCountry);
  cList.addEventListener('click', function (e) { var li = e.target.closest('[role=option]'); if (li) pickCountry(li.dataset.v); });
  cSearch.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); var v = visibleOpts(); if (v.length) v[0].focus(); }
    else if (e.key === 'Enter') { e.preventDefault(); var f = visibleOpts()[0]; if (f) pickCountry(f.dataset.v); }
    else if (e.key === 'Escape') { closeCountry(true); }
  });
  cList.addEventListener('keydown', function (e) {
    var list = visibleOpts(), i = list.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); if (list.length) list[(i + 1) % list.length].focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); if (i <= 0) cSearch.focus(); else list[i - 1].focus(); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (i >= 0) pickCountry(list[i].dataset.v); }
    else if (e.key === 'Escape') { closeCountry(true); }
  });
  document.addEventListener('click', function (e) { if (!cPop.hidden && !e.target.closest('#cxCountry')) closeCountry(false); });
  $('cx_region_cl').addEventListener('change', function () {
    clearErr('cx_region_cl');
    var list = COMUNAS[this.value] || [], sel = $('cx_comuna_cl');
    sel.innerHTML = '<option value="">' + (list.length ? ui.selComuna : ui.selComunaFirst) + '</option>' + list.slice().sort(function (a, b) { return a.localeCompare(b, 'es'); }).map(function (x) { return '<option>' + esc(x) + '</option>'; }).join('');
    sel.disabled = !list.length; update();
  });
  $('cx_comuna_cl').addEventListener('change', function () { clearErr('cx_comuna_cl'); update(); });

  function renderProblems() {
    var svc = form.querySelector('input[name=service]:checked');
    var isMsg = !!(svc && svc.hasAttribute('data-msg'));
    $('cx-problem-wrap').innerHTML = chips('problem', isMsg ? PROBLEMS_MSG : PROBLEMS_OPS);
    $('g_problem_x').hidden = true;
    $('g_volume').hidden = !isMsg;
    if (!isMsg) form.querySelectorAll('input[name=volume]').forEach(function (r) { r.checked = false; });
  }
  renderProblems();

  form.addEventListener('change', function (e) {
    var t = e.target;
    if (t.name === 'service') {
      clearErr('service'); $('cx-service').classList.remove('error'); renderProblems();
      var other = t.hasAttribute('data-other');
      $('lbl_details').textContent = other ? ui.detailsReq : ui.details;
      $('opt_details').hidden = other; $('req_details').hidden = !other;
      if (!other) clearErr('cx_details');
    }
    if (t.name === 'problem') { $('g_problem_x').hidden = !t.hasAttribute('data-other'); }
    if (t.id === 'cx_rubro') { $('g_rubro_x').hidden = t.value !== 'Otro'; }
    if (t.id === 'cx_consent' && t.checked) clearErr('cx_consent');
    update();
  });
  form.addEventListener('input', function (e) { if (e.target.id === 'cx_details') $('cx_count').textContent = e.target.value.length + ' / 1000'; if (e.target.classList.contains('error')) clearErr(e.target.id); update(); });
  phone.addEventListener('input', function () { formatPhone(); clearErr('cx_phone'); });

  var tg = $('cxToggle');
  tg.addEventListener('click', function () { var open = tg.getAttribute('aria-expanded') !== 'true'; tg.setAttribute('aria-expanded', String(open)); $('cxOptional').hidden = !open; });

  /* ---------- validation ---------- */
  var BAD_START = /^[=+\-@\t\r]/, LINK = /(https?:\/\/|www\.|<|>)/i;
  function setErr(id, msg) { var el = $(id), er = $('err-' + id); if (el && el.classList) { el.classList.add('error'); el.setAttribute('aria-invalid', 'true'); } if (er) { er.textContent = msg; er.classList.add('show'); } }
  function clearErr(id) { var el = $(id), er = $('err-' + id); if (el && el.classList) { el.classList.remove('error'); el.removeAttribute('aria-invalid'); } if (er) er.classList.remove('show'); }
  function clean(v) { return String(v || '').replace(/\s+/g, ' ').trim(); }
  function safeText(id, required, min) {
    var v = clean($(id).value);
    if (!v) { if (required) { setErr(id, ui.errReq); return false; } return true; }
    if (BAD_START.test(v) || LINK.test(v)) { setErr(id, ui.errText); return false; }
    if (min && v.length < min) { setErr(id, id === 'cx_details' ? ui.errDetails : ui.errName); return false; }
    return true;
  }
  function phoneE164() {
    var digits = phone.value.replace(/\D/g, ''); if (!digits) return '';
    var d = DIAL[country.value];
    if (!d) return '+' + digits;
    return '+' + d + digits.replace(/^0+/, '');
  }
  function validate() {
    var ok = true, first = null;
    function bad(id) { ok = false; if (!first) first = id === 'cx_country' ? $('cxCountryBtn') : ($(id) || document.querySelector('[name=' + id + ']')); }
    if (!safeText('cx_name', true, 2)) bad('cx_name');
    var em = clean($('cx_email').value);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)) { setErr('cx_email', em ? ui.errEmail : ui.errReq); bad('cx_email'); }
    if (!safeText('cx_company', true, 2)) bad('cx_company');
    if (!phone.value.trim()) { setErr('cx_phone', ui.errReq); bad('cx_phone'); }
    else { var n = phoneE164().replace(/\D/g, ''); if (n.length < 6 || n.length > 15) { setErr('cx_phone', ui.errPhone); bad('cx_phone'); } }
    if (!country.value) { setErr('cx_country', ui.errReq); bad('cx_country'); }
    if (country.value === 'CL') {
      if (!$('cx_region_cl').value) { setErr('cx_region_cl', ui.errReq); bad('cx_region_cl'); }
      if (!$('cx_comuna_cl').value) { setErr('cx_comuna_cl', ui.errReq); bad('cx_comuna_cl'); }
    } else if (country.value) {
      if (!safeText('cx_region_x', true)) bad('cx_region_x');
      if (!safeText('cx_city_x', true)) bad('cx_city_x');
    }
    ['cx_rubro_x', 'cx_problem_x'].forEach(function (id) { if (!$(id).closest('[hidden]') && !safeText(id, false)) bad(id); });
    var svc = form.querySelector('input[name=service]:checked');
    if (!svc) { $('cx-service').classList.add('error'); var es = $('err-service'); es.textContent = ui.errService; es.classList.add('show'); bad('service'); }
    if (!safeText('cx_details', !!(svc && svc.hasAttribute('data-other')), svc && svc.hasAttribute('data-other') ? 10 : 0)) bad('cx_details');
    if (!$('cx_consent').checked) { setErr('cx_consent', ui.errConsent); bad('cx_consent'); }
    if (first) { first.scrollIntoView({ behavior: 'smooth', block: 'center' }); if (first.focus) first.focus({ preventScroll: true }); }
    return ok;
  }

  /* ---------- payload (proposal for the backend) ---------- */
  function radio(n) { var r = form.querySelector('input[name=' + n + ']:checked'); return r ? r.value : ''; }
  function payload() {
    var c = country.value, isCL = c === 'CL';
    var prob = radio('problem'), probX = clean($('cx_problem_x').value);
    var rub = $('cx_rubro').value, qs = new URLSearchParams(location.search);
    var utm = {}; ['source', 'medium', 'campaign', 'term', 'content'].forEach(function (k) { var v = qs.get('utm_' + k); if (v) utm[k] = v.slice(0, 100); });
    return {
      schema: 'dynx-web-contact/2',
      submittedAt: new Date().toISOString(),
      lang: LANG,
      contact: {
        name: clean($('cx_name').value), email: clean($('cx_email').value).toLowerCase(), company: clean($('cx_company').value),
        phone: phoneE164(),
        country: c ? { code: c, name: cname(c, 'es') } : null,
        region: isCL ? $('cx_region_cl').value : clean($('cx_region_x').value),
        city: isCL ? $('cx_comuna_cl').value : clean($('cx_city_x').value)
      },
      project: {
        service: radio('service'), details: clean($('cx_details').value),
        industry: rub && rub !== 'Otro' ? rub : (rub === 'Otro' ? 'Otro' : ''), industryOther: rub === 'Otro' ? clean($('cx_rubro_x').value) : '',
        problem: prob === 'Otro' ? (probX ? 'Otro: ' + probX : 'Otro') : prob,
        volume: radio('volume'), team: radio('team'), urgency: radio('urgency')
      },
      consent: { privacy: $('cx_consent').checked, privacyVersion: PRIVACY_VERSION, acceptedAt: $('cx_consent').checked ? new Date().toISOString() : null, newsletter: $('cx_news').checked },
      meta: { page: location.pathname, referrer: document.referrer ? document.referrer.slice(0, 200) : '', utm: utm },
      hp: $('cx_website').value, elapsedMs: Date.now() - started
    };
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate()) { update(); return; }
    var btn = $('cxSubmit'); btn.disabled = true; btn.classList.add('is-loading'); $('cxSubmitTxt').textContent = ui.sending;
    var p = payload();
    fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(p) })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (!data || data.status !== 'ok') throw new Error('bad status');
        $('okTitle').textContent = ui.okTitle.replace('{n}', p.contact.name.split(' ')[0]);
        $('okSub').textContent = ui.okSub.replace('{e}', p.contact.email);
        $('formContent').classList.add('hide'); $('successMsg').classList.add('show');
        $('successMsg').scrollIntoView({ behavior: 'smooth', block: 'center' });
      })
      .catch(function () {
        setErr('cx_consent', ui.errSend); $('err-cx_consent').scrollIntoView({ behavior: 'smooth', block: 'center' });
      })
      .then(function () {
        btn.disabled = false; btn.classList.remove('is-loading'); $('cxSubmitTxt').textContent = ui.submit;
      });
  });
  $('cxReset').addEventListener('click', function () {
    form.reset(); started = Date.now(); window.__cxLast = null;
    $('successMsg').classList.remove('show'); $('formContent').classList.remove('hide');
    tg.setAttribute('aria-expanded', 'false'); $('cxOptional').hidden = true;
    $('cx_comuna_cl').innerHTML = '<option value="">' + ui.selComunaFirst + '</option>'; $('cx_comuna_cl').disabled = true;
    if (detected) country.value = detected; renderProblems(); setLocation(); $('cx_count').textContent = '0 / 1000';
    $('lbl_details').textContent = ui.details; $('opt_details').hidden = false; $('req_details').hidden = true;
    ['g_rubro_x'].forEach(function (id) { $(id).hidden = true; });
  });

  function update() { /* production: mockup data drawer removed */ }
  setLocation();
})();
