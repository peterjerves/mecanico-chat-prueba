/* Mecánico Chat — lógica de búsqueda (misma que la API v1).
   Chasis (VIN) -> modelos homologados ANT · Número de motor -> diámetro del cilindro.
   Todo corre en el navegador: las fotos no salen del celular. */
(function (root) {
  "use strict";

  var WILD = { x: 1, X: 1, "*": 1 };
  var OCR_FIX = { O: "0", Q: "0", I: "1" }; // letras que no existen en un VIN
  var YEAR = {};
  "ABCDEFGHJKLMNPRSTVWXY".split("").forEach(function (c, i) { YEAR[c] = 2010 + i; });
  for (var d = 1; d <= 9; d++) YEAR[String(d)] = 2000 + d;

  /* VIN genérico ANT -> máscara ('?' = variable). Nota 14 ANT: la 'x' minúscula es variable.
     Si el patrón viene todo en mayúsculas, 'X' también es variable; desde la posición 9 siempre. */
  function mascara(p) {
    var minus = p.indexOf("x") >= 0, out = "";
    for (var i = 0; i < p.length; i++) {
      var c = p[i];
      if (c === "x" || c === "*") out += "?";
      else if (c === "X" && (i >= 8 || !minus)) out += "?";
      else out += c.toUpperCase();
    }
    return out;
  }

  function cargar(payload) {
    var cols = payload.cols, idx = {};
    cols.forEach(function (c, i) { idx[c] = i; });
    var modelos = payload.rows.map(function (r) {
      var o = {};
      cols.forEach(function (c, i) { o[c] = r[i]; });
      o.vin = (o.vin || "").trim();
      o.mascara = mascara(o.vin);
      o.fijos = o.mascara.split("").filter(function (ch) { return ch !== "?"; }).length;
      return o;
    });
    var porWmi = {};
    modelos.forEach(function (m) {
      if (m.vin.length >= 3) {
        var w = m.vin.slice(0, 3).toUpperCase();
        (porWmi[w] = porWmi[w] || {})[m.marca] = 1;
      }
    });
    return { modelos: modelos, porWmi: porWmi };
  }

  function normalizarVin(s) {
    var avisos = [];
    var v = String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    v = v.replace(/[OQI]/g, function (ch) {
      avisos.push("'" + ch + "' no existe en un VIN; se leyó como '" + OCR_FIX[ch] + "'");
      return OCR_FIX[ch];
    });
    return { vin: v, avisos: avisos };
  }

  function coincide(vin, pat) {
    var n = Math.min(vin.length, pat.length), s = 0;
    for (var i = 0; i < n; i++) {
      var p = pat[i];
      if (p === "?") continue;
      if (p !== vin[i]) return -1;
      s++;
    }
    return s;
  }

  function buscarChasis(base, entrada) {
    var nv = normalizarVin(entrada), vin = nv.vin, avisos = nv.avisos.slice();
    if (vin.length < 3) return { ok: false, error: "Escribe al menos los primeros 3 caracteres del chasis." };
    if (vin.length > 17) { avisos.push("Tiene más de 17 caracteres; se usan los primeros 17."); vin = vin.slice(0, 17); }
    var completo = vin.length === 17;
    var hits = [];
    base.modelos.forEach(function (m) {
      if (m.vin.length < 8 || m.fijos < 6) return;
      var s = coincide(vin, m.mascara);
      if (s >= 0) hits.push([s, m]);
    });
    var wmi = vin.slice(0, 3);
    var r = {
      ok: true, chasis: vin, completo: completo, avisos: avisos,
      wmi: wmi, marcasWmi: Object.keys(base.porWmi[wmi] || {}).sort(),
      anio: completo ? (YEAR[vin[9]] || null) : null,
      coincidencias: [], confianza: "sin_coincidencia"
    };
    if (!hits.length) return r;
    var best = Math.max.apply(null, hits.map(function (h) { return h[0]; }));
    var grupos = {};
    hits.filter(function (h) { return h[0] === best; }).forEach(function (h) {
      var m = h[1], k = [m.marca, m.modelo, m.cc, m.transmision].join("|");
      var g = grupos[k];
      if (!g) {
        g = grupos[k] = { marca: m.marca, modelo: m.modelo, version: m.version, descripcion: m.descripcion,
          cc: m.cc, kw: m.kw, combustible: m.combustible, transmision: m.transmision, tipo: m.tipo,
          subcategoria: m.subcategoria, vin: m.vin, representante: m.representante, estados: {},
          fechas: {}, ids: [] };
      }
      g.estados[m.estado] = 1;
      if (m.fecha_embarque) g.fechas[m.fecha_embarque] = 1;
      g.ids.push(m.id);
    });
    var cands = Object.keys(grupos).map(function (k) {
      var g = grupos[k];
      g.estados = Object.keys(g.estados).sort();
      g.fechas = Object.keys(g.fechas);
      return g;
    }).sort(function (a, b) { return (a.marca + a.modelo).localeCompare(b.marca + b.modelo); });
    var marcas = {}, ccs = {};
    cands.forEach(function (c) { marcas[c.marca] = 1; if (c.cc != null) ccs[c.cc] = 1; });
    var nMarcas = Object.keys(marcas).length, nCc = Object.keys(ccs).length;
    r.coincidencias = cands;
    r.marcas = Object.keys(marcas).sort();
    r.cilindrajes = Object.keys(ccs).map(Number).sort(function (a, b) { return a - b; });
    r.fijos = best;
    r.confianza = cands.length === 1 ? "alta" : (nMarcas === 1 && nCc <= 1 ? "media_mismo_cilindraje" : "baja_varios_modelos");
    if (!completo) r.avisos.push("Chasis incompleto: resultado aproximado por los primeros caracteres.");
    return r;
  }

  var MOTOR_RE = /^(\d)P?(\d{2})([A-Z]{2,4})/;
  function leerMotor(numero) {
    var s = String(numero || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    var m = s.match(MOTOR_RE);
    if (!m) return { ok: false, numero: s, error: "No reconozco un código de motor al inicio (ej. 162FMJ)." };
    return { ok: true, numero: s, codigo: m[0], cilindros: +m[1], diametro: +m[2],
      nota: "Diámetro según la convención china de códigos de motor. Confirmar con la ficha del repuesto." };
  }

  /* Del texto del OCR saca posibles chasis y códigos de motor.
     Prueba cada ventana de 17 caracteres contra la base y ordena por las que encuentran algo. */
  function candidatosOCR(base, texto) {
    var lineas = String(texto || "").toUpperCase().split(/\n+/);
    var vistos = {}, chasis = [], motores = [];
    lineas.forEach(function (l) {
      var compacta = l.replace(/[^A-Z0-9]/g, "");
      // códigos de motor: al inicio de una palabra (ej. "MOTOR: 163FML 2401234"), nunca "CC"
      var re = /(?:^|[^A-Z0-9])(\dP?\d{2}[A-Z]{2,4})[\s\-.]?([0-9A-Z]{0,12})/g, mm;
      while ((mm = re.exec(l))) {
        if (/^\dP?\d{2}CC/.test(mm[1])) continue;
        var c = (mm[1] + mm[2]).replace(/[^A-Z0-9]/g, "");
        if (!vistos["m" + c]) { vistos["m" + c] = 1; motores.push(c); }
      }
      // chasis: tokens largos
      (compacta.length >= 11 ? [compacta] : []).forEach(function (t) {
        var vent = [];
        if (t.length >= 17) for (var i = 0; i + 17 <= t.length; i++) vent.push(t.slice(i, i + 17));
        else vent.push(t);
        vent.forEach(function (v) {
          if (vistos["c" + v]) return;
          vistos["c" + v] = 1;
          var r = buscarChasis(base, v);
          chasis.push({ texto: v, resultados: r.coincidencias ? r.coincidencias.length : 0, fijos: r.fijos || 0 });
        });
      });
    });
    chasis.sort(function (a, b) { return (b.resultados > 0) - (a.resultados > 0) || b.fijos - a.fijos; });
    return { chasis: chasis.slice(0, 6), motores: motores.slice(0, 4) };
  }

  var api = { mascara: mascara, cargar: cargar, normalizarVin: normalizarVin, buscarChasis: buscarChasis, leerMotor: leerMotor,
    candidatosOCR: candidatosOCR };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.MecCore = api;
})(this);
