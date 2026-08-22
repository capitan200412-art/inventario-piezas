let pestañaActual = "activas"; // "activas" | "historial" | "por-llegar" | "entregas"

const lista = document.getElementById("lista");
const listTitle = document.getElementById("list-title");
const vacioMsg = document.getElementById("vacio-msg");
const buscador = document.getElementById("buscador");
const formPieza = document.getElementById("form-pieza");
const formMsg = document.getElementById("form-msg");
const formPanelActivas = document.getElementById("form-pieza").closest(".panel");
const formPanelLlegar = document.getElementById("form-panel-llegar");
const formPiezaLlegar = document.getElementById("form-pieza-llegar");
const formMsgLlegar = document.getElementById("form-msg-llegar");

const titulos = {
  "activas": "Piezas activas",
  "historial": "Historial de piezas eliminadas",
  "por-llegar": "Piezas por llegar",
  "entregas": "Historial de entregas"
};

const endpoints = {
  "activas": "/piezas",
  "historial": "/historial",
  "por-llegar": "/por-llegar",
  "entregas": "/entregas"
};

// ---------- Cambiar de pestaña ----------
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    pestañaActual = btn.dataset.tab;
    listTitle.textContent = titulos[pestañaActual];
    buscador.value = "";

    formPanelActivas.style.display = pestañaActual === "activas" ? "" : "none";
    formPanelLlegar.style.display = pestañaActual === "por-llegar" ? "" : "none";

    cargarPiezas();
  });
});

// ---------- Cargar piezas (según la pestaña activa) ----------
async function cargarPiezas() {
  const endpoint = endpoints[pestañaActual];
  const query = buscador.value.trim();
  const url = `${API_URL}${endpoint}${query ? `?buscar=${encodeURIComponent(query)}` : ""}`;

  lista.innerHTML = "";
  vacioMsg.style.display = "none";

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("No se pudo cargar la lista");
    const piezas = await res.json();

    if (piezas.length === 0) {
      const vacioTextos = {
        "activas": "No hay piezas en el inventario todavía.",
        "historial": "El historial está vacío.",
        "por-llegar": "No hay piezas por llegar registradas.",
        "entregas": "Todavía no hay piezas entregadas."
      };
      vacioMsg.textContent = vacioTextos[pestañaActual];
      vacioMsg.style.display = "block";
      return;
    }

    piezas.forEach(p => lista.appendChild(crearTarjeta(p)));
  } catch (err) {
    vacioMsg.textContent = "Error al conectar con el servidor. Revisa que el backend esté corriendo.";
    vacioMsg.style.display = "block";
  }
}

// ---------- Utilidad para formatear fechas ----------
function formatearFecha(fecha) {
  if (!fecha) return "";
  return new Date(fecha).toLocaleDateString("es-MX", { year: "numeric", month: "short", day: "numeric" });
}

// ---------- Crear una tarjeta visual de pieza ----------
function crearTarjeta(p) {
  const div = document.createElement("div");
  div.className = "tarjeta" + (pestañaActual === "historial" || pestañaActual === "entregas" ? " historial" : "");

  let footerFecha = "";
  let footerAccion = "";
  let extraInfo = "";

  if (pestañaActual === "activas") {
    footerFecha = `Agregada: ${formatearFecha(p.fecha_agregado)}`;
    footerAccion = `<button class="btn-eliminar" data-id="${p.id}">Eliminar</button>`;
  } else if (pestañaActual === "historial") {
    footerFecha = `Eliminada: ${formatearFecha(p.fecha_eliminado)}`;
    footerAccion = `<span class="tag-eliminado">${p.motivo || "eliminada"}</span>`;
  } else if (pestañaActual === "por-llegar") {
    extraInfo = p.fecha_llegada ? `<div class="tarjeta-desc">Llega: ${formatearFecha(p.fecha_llegada)}</div>` : "";
    footerFecha = `Agregada: ${formatearFecha(p.fecha_agregado)}`;
    footerAccion = `<button class="btn-eliminar" data-id="${p.id}">Entregar</button>`;
  } else if (pestañaActual === "entregas") {
    extraInfo = p.fecha_llegada ? `<div class="tarjeta-desc">Llegó: ${formatearFecha(p.fecha_llegada)}</div>` : "";
    footerFecha = `Entregada: ${formatearFecha(p.fecha_entregado)}`;
    footerAccion = `<span class="tag-eliminado">entregada</span>`;
  }

  div.innerHTML = `
    <div class="tarjeta-codigo">${p.codigo || "SIN CÓDIGO"}</div>
    <div class="tarjeta-nombre">${escapeHtml(p.nombre_pieza)}</div>
    <div class="tarjeta-datos">
      <span><b>${escapeHtml(p.marca)}</b></span>
      <span>${escapeHtml(p.modelo)}</span>
      <span>· ${p.anio}</span>
    </div>
    ${p.descripcion ? `<div class="tarjeta-desc">${escapeHtml(p.descripcion)}</div>` : ""}
    ${extraInfo}
    <div class="tarjeta-linea"></div>
    <div class="tarjeta-footer">
      <span class="tarjeta-fecha">${footerFecha}</span>
      ${footerAccion}
    </div>
  `;

  if (pestañaActual === "activas") {
    div.querySelector(".btn-eliminar").addEventListener("click", () => eliminarPieza(p.id, p.nombre_pieza));
  } else if (pestañaActual === "por-llegar") {
    div.querySelector(".btn-eliminar").addEventListener("click", () => entregarPieza(p.id, p.nombre_pieza));
  }

  return div;
}

// ---------- Eliminar pieza (mueve a historial) ----------
async function eliminarPieza(id, nombre) {
  const motivo = prompt(`¿Por qué se elimina "${nombre}"? (ej: usada, vendida, dañada) — opcional`);
  if (motivo === null) return; // canceló

  try {
    const res = await fetch(`${API_URL}/piezas/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ motivo: motivo || null })
    });
    if (!res.ok) throw new Error();
    cargarPiezas();
  } catch {
    alert("No se pudo eliminar la pieza. Intenta de nuevo.");
  }
}

// ---------- Marcar como entregada (mueve de "por llegar" a "entregas") ----------
async function entregarPieza(id, nombre) {
  const fecha = prompt(`¿Qué fecha se entregó/instaló "${nombre}"? (AAAA-MM-DD) — deja vacío para usar hoy`);
  if (fecha === null) return; // canceló

  try {
    const res = await fetch(`${API_URL}/por-llegar/${id}/entregar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fecha_entregado: fecha || null })
    });
    if (!res.ok) throw new Error();
    cargarPiezas();
  } catch {
    alert("No se pudo marcar como entregada. Intenta de nuevo.");
  }
}

// ---------- Agregar pieza (activas) ----------
formPieza.addEventListener("submit", async (e) => {
  e.preventDefault();
  formMsg.textContent = "";
  formMsg.className = "form-msg";

  const nueva = {
    codigo: document.getElementById("codigo").value.trim() || null,
    nombre_pieza: document.getElementById("nombre_pieza").value.trim(),
    marca: document.getElementById("marca").value.trim(),
    modelo: document.getElementById("modelo").value.trim(),
    anio: parseInt(document.getElementById("anio").value, 10),
    descripcion: document.getElementById("descripcion").value.trim() || null
  };

  try {
    const res = await fetch(`${API_URL}/piezas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nueva)
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "Error al agregar la pieza");

    formPieza.reset();
    formMsg.textContent = "Pieza agregada correctamente.";
    formMsg.classList.add("ok");
    if (pestañaActual === "activas") cargarPiezas();
  } catch (err) {
    formMsg.textContent = err.message;
    formMsg.classList.add("error");
  }
});

// ---------- Agregar pieza (por llegar) ----------
formPiezaLlegar.addEventListener("submit", async (e) => {
  e.preventDefault();
  formMsgLlegar.textContent = "";
  formMsgLlegar.className = "form-msg";

  const nueva = {
    codigo: document.getElementById("codigo-llegar").value.trim() || null,
    nombre_pieza: document.getElementById("nombre_pieza-llegar").value.trim(),
    marca: document.getElementById("marca-llegar").value.trim(),
    modelo: document.getElementById("modelo-llegar").value.trim(),
    anio: parseInt(document.getElementById("anio-llegar").value, 10),
    descripcion: document.getElementById("descripcion-llegar").value.trim() || null,
    fecha_llegada: document.getElementById("fecha_llegada").value || null
  };

  try {
    const res = await fetch(`${API_URL}/por-llegar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nueva)
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "Error al agregar la pieza");

    formPiezaLlegar.reset();
    formMsgLlegar.textContent = "Pieza agregada a 'por llegar' correctamente.";
    formMsgLlegar.classList.add("ok");
    if (pestañaActual === "por-llegar") cargarPiezas();
  } catch (err) {
    formMsgLlegar.textContent = err.message;
    formMsgLlegar.classList.add("error");
  }
});

// ---------- Buscador (con pequeño retraso para no saturar peticiones) ----------
let temporizadorBusqueda;
buscador.addEventListener("input", () => {
  clearTimeout(temporizadorBusqueda);
  temporizadorBusqueda = setTimeout(cargarPiezas, 350);
});

// ---------- Utilidad para evitar HTML injection ----------
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text ?? "";
  return div.innerHTML;
}

// ---------- Carga inicial ----------
cargarPiezas();