let pestañaActual = "activas"; // "activas" | "historial"

const lista = document.getElementById("lista");
const listTitle = document.getElementById("list-title");
const vacioMsg = document.getElementById("vacio-msg");
const buscador = document.getElementById("buscador");
const formPieza = document.getElementById("form-pieza");
const formMsg = document.getElementById("form-msg");

// ---------- Cambiar de pestaña ----------
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    pestañaActual = btn.dataset.tab;
    listTitle.textContent = pestañaActual === "activas" ? "Piezas activas" : "Historial de piezas eliminadas";
    buscador.value = "";
    cargarPiezas();
  });
});

// ---------- Cargar piezas (activas o historial) ----------
async function cargarPiezas() {
  const endpoint = pestañaActual === "activas" ? "/piezas" : "/historial";
  const query = buscador.value.trim();
  const url = `${API_URL}${endpoint}${query ? `?buscar=${encodeURIComponent(query)}` : ""}`;

  lista.innerHTML = "";
  vacioMsg.style.display = "none";

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("No se pudo cargar la lista");
    const piezas = await res.json();

    if (piezas.length === 0) {
      vacioMsg.textContent = pestañaActual === "activas"
        ? "No hay piezas en el inventario todavía."
        : "El historial está vacío.";
      vacioMsg.style.display = "block";
      return;
    }

    piezas.forEach(p => lista.appendChild(crearTarjeta(p)));
  } catch (err) {
    vacioMsg.textContent = "Error al conectar con el servidor. Revisa que el backend esté corriendo.";
    vacioMsg.style.display = "block";
  }
}

// ---------- Crear una tarjeta visual de pieza ----------
function crearTarjeta(p) {
  const div = document.createElement("div");
  div.className = "tarjeta" + (pestañaActual === "historial" ? " historial" : "");

  const fecha = pestañaActual === "activas" ? p.fecha_agregado : p.fecha_eliminado;
  const fechaTexto = fecha ? new Date(fecha).toLocaleDateString("es-MX", { year: "numeric", month: "short", day: "numeric" }) : "";

  div.innerHTML = `
    <div class="tarjeta-codigo">${p.codigo || "SIN CÓDIGO"}</div>
    <div class="tarjeta-nombre">${escapeHtml(p.nombre_pieza)}</div>
    <div class="tarjeta-datos">
      <span><b>${escapeHtml(p.marca)}</b></span>
      <span>${escapeHtml(p.modelo)}</span>
      <span>· ${p.anio}</span>
    </div>
    ${p.descripcion ? `<div class="tarjeta-desc">${escapeHtml(p.descripcion)}</div>` : ""}
    <div class="tarjeta-linea"></div>
    <div class="tarjeta-footer">
      <span class="tarjeta-fecha">${pestañaActual === "activas" ? "Agregada" : "Eliminada"}: ${fechaTexto}</span>
      ${pestañaActual === "activas"
        ? `<button class="btn-eliminar" data-id="${p.id}">Eliminar</button>`
        : `<span class="tag-eliminado">${p.motivo || "eliminada"}</span>`}
    </div>
  `;

  if (pestañaActual === "activas") {
    div.querySelector(".btn-eliminar").addEventListener("click", () => eliminarPieza(p.id, p.nombre_pieza));
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

// ---------- Agregar pieza ----------
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
