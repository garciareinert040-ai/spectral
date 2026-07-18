import { smoothPath } from './projection.js'

// Litorais estilizados (unidades de mapa 1600×1000). Pontos autorais, com a
// irregularidade "de pena" embutida no traçado — nada de GIS.

const cuba = [
  [383, 467], [402, 452], [418, 442], [430, 443], [436, 434], [448, 443], [462, 434],
  [478, 424], [500, 407], [522, 396], [546, 384], [572, 374], [598, 367], [617, 373],
  [638, 363], [664, 357], [694, 356], [724, 358], [756, 357], [792, 361], [828, 368],
  [864, 377], [900, 391], [934, 406], [968, 423], [1002, 441], [1038, 461], [1072, 482],
  [1106, 504], [1142, 524], [1178, 545], [1216, 566], [1252, 582], [1282, 594],
  [1300, 606], [1289, 618], [1264, 621], [1234, 627], [1200, 636], [1164, 641],
  [1126, 642], [1090, 637], [1062, 645], [1032, 649], [1002, 646], [986, 639],
  [993, 626], [977, 611], [953, 596], [929, 580], [906, 562], [880, 548], [851, 538],
  [818, 521], [787, 506], [757, 496], [727, 490], [696, 485], [666, 482], [636, 487],
  [603, 495], [571, 503], [540, 506], [509, 507], [479, 505], [449, 497], [420, 486],
  [398, 477],
]

const juventude = [
  [545, 520], [568, 511], [589, 519], [586, 537], [563, 545], [543, 534],
]

const jamaica = [
  [920, 782], [948, 758], [988, 746], [1034, 744], [1078, 750], [1114, 760],
  [1140, 776], [1130, 796], [1098, 806], [1080, 794], [1058, 808], [1022, 816],
  [982, 814], [944, 800],
]

// Parcial: cortada pela borda leste; fecha fora da carta (x>1600)
const hispaniola = [
  [1660, 470], [1560, 492], [1502, 502], [1454, 516], [1421, 536], [1401, 560],
  [1413, 580], [1441, 585], [1471, 593], [1497, 611], [1513, 635], [1519, 661],
  [1502, 679], [1470, 677], [1436, 687], [1404, 701], [1381, 717], [1395, 735],
  [1429, 741], [1471, 749], [1521, 759], [1571, 767], [1660, 782],
]

const gonave = [[1432, 654], [1456, 644], [1472, 656], [1450, 666]]

const inagua = [
  [1332, 516], [1360, 509], [1390, 517], [1399, 539], [1383, 556], [1352, 557], [1333, 542],
]

const yucatan = [
  [0, 522], [58, 513], [108, 501], [148, 492], [176, 488], [196, 481], [206, 492],
  [193, 507], [184, 528], [179, 558], [177, 590], [176, 620], [172, 652], [170, 692],
  [166, 732], [161, 780], [156, 832], [150, 882], [146, 932], [142, 976], [140, 1000],
  [0, 1000],
]

const cozumel = [[222, 548], [243, 539], [254, 556], [239, 572], [222, 565]]

// Península parcial: fecha fora da carta (y<0) para o corte no topo ficar reto
const florida = [
  [556, -40], [588, 10], [600, 60], [612, 105], [626, 145], [644, 175],
  [664, 196], [692, 206], [722, 203], [748, 188], [768, 160], [784, 124],
  [794, 84], [800, 40], [804, -40],
]

const bahamas = {
  grandBahama: [[925, 62], [963, 55], [1004, 59], [1032, 70], [1004, 78], [964, 76], [934, 72]],
  abaco: [[1042, 52], [1066, 61], [1082, 85], [1092, 112], [1077, 118], [1061, 95], [1047, 71]],
  andros: [[948, 220], [963, 211], [973, 226], [979, 252], [983, 286], [979, 318], [965, 329], [952, 314], [946, 282], [944, 250]],
  providence: [[1008, 200], [1029, 193], [1046, 202], [1031, 212], [1010, 210]],
  eleuthera: [[1084, 154], [1097, 163], [1106, 187], [1112, 214], [1116, 240], [1105, 243], [1096, 214], [1087, 186], [1078, 163]],
  cat: [[1136, 258], [1146, 279], [1152, 300], [1141, 302], [1131, 277]],
  longIsland: [[1168, 322], [1181, 345], [1192, 368], [1200, 390], [1187, 394], [1175, 369], [1163, 343]],
  crooked: [[1236, 418], [1258, 423], [1272, 440], [1257, 452], [1235, 441]],
  mayaguana: [[1318, 450], [1343, 451], [1352, 464], [1331, 470], [1313, 461]],
}

// Ilhas fechadas grandes (com hachura de costa)
export const LANDMASSES = [
  { id: 'cuba', d: smoothPath(cuba, true) },
  { id: 'jamaica', d: smoothPath(jamaica, true) },
  { id: 'hispaniola', d: smoothPath(hispaniola, true, 0.9) },
  { id: 'yucatan', d: smoothPath(yucatan, true, 0.8) },
  { id: 'florida', d: smoothPath(florida, true, 0.9) },
  { id: 'inagua', d: smoothPath(inagua, true) },
  { id: 'andros', d: smoothPath(bahamas.andros, true) },
  { id: 'eleuthera', d: smoothPath(bahamas.eleuthera, true) },
]

// Ilhotas menores (sem hachura, só contorno + preenchimento)
export const ISLETS = [
  { id: 'juventude', d: smoothPath(juventude, true) },
  { id: 'gonave', d: smoothPath(gonave, true) },
  { id: 'cozumel', d: smoothPath(cozumel, true) },
  { id: 'grandBahama', d: smoothPath(bahamas.grandBahama, true) },
  { id: 'abaco', d: smoothPath(bahamas.abaco, true) },
  { id: 'providence', d: smoothPath(bahamas.providence, true) },
  { id: 'cat', d: smoothPath(bahamas.cat, true) },
  { id: 'longIsland', d: smoothPath(bahamas.longIsland, true) },
  { id: 'crooked', d: smoothPath(bahamas.crooked, true) },
  { id: 'mayaguana', d: smoothPath(bahamas.mayaguana, true) },
]

// Cadeias de recifes/chaves desenhadas como pontinhos
export const DOT_CHAINS = [
  // Chaves da Flórida
  [[706, 225], [688, 234], [668, 242], [646, 247], [622, 250], [598, 250], [576, 247], [556, 244]],
  // Dry Tortugas
  [[536, 242]],
  // Bimini
  [[842, 148], [848, 162]],
  // Exumas
  [[1058, 258], [1072, 274], [1086, 292], [1100, 310], [1114, 330]],
  // Turks
  [[1420, 486], [1436, 492]],
  // Salt Key Bank
  [[766, 295], [779, 303], [771, 312], [784, 314]],
]

// Rótulos geográficos: [texto, x, y, tamanho, rotação, espaçamento]
export const REGION_LABELS = [
  ['CUBA', 820, 508, 44, 13, 26],
  ['JAMAICA', 878, 772, 14, 2, 6],
  ['HISPANIOLA', 1468, 552, 16, 6, 7],
  ['ILHAS BAHAMAS', 1120, 138, 16, 17, 9],
  ['FLÓRIDA', 668, 108, 15, -72, 6],
  ['YUCATÁN', 108, 636, 17, -81, 8],
  ['GRANDE INAGUA', 1366, 598, 11, 0, 4],
]

export const TOWN_LABELS = [
  // [nome, x, y, rotação, px, py] — px/py: pontinho da vila (null = sem ponto)
  ['Havana', 524, 322, -4, 598, 367],
  ['Nassau', 1080, 152, 0, 1027, 200],
  ['Kingston', 1168, 806, 3, 1069, 795],
  ['Tulum', 208, 604, 0, 178, 604],
  ['Salt Key Bank', 806, 284, -8, null, null],
  ['C. Bonavista', 428, 418, -6, 442, 437],
  ['Enseada do Gralha', 1350, 498, -3, 1364, 520],
]

export const SEA_LABELS = [
  // [texto, path do arco, tamanho, espaçamento]
  ['MAR DAS CARAÍBAS', 'M 560 918 Q 900 866 1240 918', 40, 18],
  ['GOLFO DO MÉXICO', 'M 140 236 Q 350 202 560 236', 21, 8],
  ['OCEANO ATLÂNTICO', 'M 1120 134 Q 1340 94 1580 150', 21, 8],
]

export const SMALL_SEA_LABELS = [
  ['Estreito da Flórida', 648, 296, -16],
  ['Canal de Barlavento', 1350, 654, -52],
]

// Colinas decorativas no interior das ilhas grandes
export const HILLS = [
  [762, 428], [900, 468], [1050, 540], [1110, 585], [1545, 652], [1562, 712], [96, 700],
]

// Centros das linhas de rumo
export const RHUMB_CENTERS = [
  [830, 640], [1250, 220], [300, 860],
]
