const socket = io();

let miNombre = "";
let miSala = "";
let soyAnfitrion = false;
let estadoActual = null;

function crearSala() {
  miNombre = document.getElementById("nombre").value.trim();

  if (!miNombre) {
    mostrarError("Escribe tu nombre.");
    return;
  }

  socket.emit("crearSala", miNombre);
  soyAnfitrion = true;
}

function unirseSala() {
  miNombre = document.getElementById("nombre").value.trim();
  const codigo = document.getElementById("codigo").value.trim().toUpperCase();

  if (!miNombre) {
    mostrarError("Escribe tu nombre.");
    return;
  }

  if (!codigo) {
    mostrarError("Escribe el código de la sala.");
    return;
  }

  socket.emit("unirseSala", {
    nombre: miNombre,
    codigo: codigo
  });
}

socket.on("salaCreada", datos => {
  miSala = datos.codigo;
  mostrarSala();
});

socket.on("unidoSala", datos => {
  miSala = datos.codigo;
  mostrarSala();
});

socket.on("errorJuego", mensaje => {
  mostrarError(mensaje);
});

socket.on("estado", estado => {
  estadoActual = estado;

  if (estado.iniciada) {
    mostrarPartida();
  } else {
    actualizarEspera();
  }

  dibujarJugadores(estado.jugadores);
});

function mostrarSala() {
  document.getElementById("inicio").classList.add("oculto");
  document.getElementById("espera").classList.remove("oculto");
  document.getElementById("codigoSala").textContent = miSala;
}

function actualizarEspera() {
  document.getElementById("estadoSala").textContent =
    "Jugadores conectados: " +
    estadoActual.jugadores.length +
    " de 3";

  document.getElementById("listaJugadores").innerHTML =
    estadoActual.jugadores.map(j => `
      <div class="jugador" style="border-bottom:4px solid ${j.color}">
        ${j.nombre}
      </div>
    `).join("");
}

function mostrarPartida() {
  document.getElementById("inicio").classList.add("oculto");
  document.getElementById("espera").classList.add("oculto");
  document.getElementById("partida").classList.remove("oculto");

  document.getElementById("turno").textContent =
    "Turno de: " + estadoActual.jugadores[estadoActual.turno].nombre;

  dibujarTablero();
}

function dibujarJugadores(jugadores) {
  document.getElementById("jugadores").innerHTML =
    jugadores.map(j => `
      <div class="jugador" style="border-bottom:4px solid ${j.color}">
        <b>${j.nombre}</b><br>
        💰 ${j.monedas}<br>
        ⭐ ${j.prestigio}<br>
        📍 Casilla ${j.posicion}
      </div>
    `).join("");
}

function dibujarTablero() {
  const tablero = document.getElementById("tablero");

  tablero.innerHTML = "";

  for (let i = 0; i < 25; i++) {
    const casilla = document.createElement("div");
    casilla.className = "casilla";

    const jugadoresEnCasilla =
      estadoActual.jugadores
        .filter(j => j.posicion === i)
        .map(j => "🔵")
        .join("");

    casilla.innerHTML = `
      <b>${i}</b>
      <span>${i === 0 ? "Inicio" : i === 24 ? "Meta" : "Ciudad"}</span>
      <div>${jugadoresEnCasilla}</div>
    `;

    tablero.appendChild(casilla);
  }
}

function tirarDado() {
  socket.emit("tirarDado");
}

socket.on("resultadoDado", datos => {
  document.getElementById("mensaje").textContent =
    datos.nombre + " sacó un " + datos.numero;

  estadoActual = datos.estado;
  mostrarPartida();
  dibujarJugadores(estadoActual.jugadores);
});

function mostrarError(texto) {
  document.getElementById("error").textContent = texto;
}
