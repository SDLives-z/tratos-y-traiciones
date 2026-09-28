const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const servidor = http.createServer(app);
const io = new Server(servidor);

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));

const salas = {};

const colores = [
  "#06d6a0",
  "#ef476f",
  "#118ab2"
];

function generarCodigo() {
  return Math.random()
    .toString(36)
    .substring(2, 6)
    .toUpperCase();
}

function crearJugador(id, nombre, numero) {
  return {
    id: id,
    nombre: nombre,
    posicion: 0,
    monedas: 100,
    prestigio: 0,
    color: colores[numero]
  };
}

function obtenerEstado(sala) {
  return {
    jugadores: sala.jugadores.map(jugador => ({
      id: jugador.id,
      nombre: jugador.nombre,
      posicion: jugador.posicion,
      monedas: jugador.monedas,
      prestigio: jugador.prestigio,
      color: jugador.color
    })),
    turno: sala.turno,
    iniciada: sala.iniciada,
    mensaje: sala.mensaje
  };
}

function enviarEstado(codigo) {
  const sala = salas[codigo];

  if (!sala) return;

  io.to(codigo).emit("estado", obtenerEstado(sala));
}

io.on("connection", socket => {
  socket.on("crearSala", nombre => {
    let codigo = generarCodigo();

    while (salas[codigo]) {
      codigo = generarCodigo();
    }

    salas[codigo] = {
      jugadores: [],
      turno: 0,
      iniciada: false,
      mensaje: "Esperando jugadores..."
    };

    const jugador = crearJugador(
      socket.id,
      nombre || "Jugador 1",
      0
    );

    salas[codigo].jugadores.push(jugador);

    socket.join(codigo);
    socket.sala = codigo;

    socket.emit("salaCreada", {
      codigo: codigo
    });

    enviarEstado(codigo);
  });

  socket.on("unirseSala", datos => {
    const codigo = String(datos.codigo || "").toUpperCase();
    const nombre = datos.nombre || "Jugador";

    const sala = salas[codigo];

    if (!sala) {
      socket.emit("errorJuego", "No existe esa sala.");
      return;
    }

    if (sala.jugadores.length >= 3) {
      socket.emit("errorJuego", "La sala ya tiene 3 jugadores.");
      return;
    }

    if (sala.iniciada) {
      socket.emit("errorJuego", "La partida ya comenzó.");
      return;
    }

    const jugador = crearJugador(
      socket.id,
      nombre,
      sala.jugadores.length
    );

    sala.jugadores.push(jugador);

    socket.join(codigo);
    socket.sala = codigo;

    socket.emit("unidoSala", {
      codigo: codigo
    });

    if (sala.jugadores.length === 3) {
      sala.iniciada = true;
      sala.mensaje = "La partida ha comenzado.";
    }

    enviarEstado(codigo);
  });

  socket.on("tirarDado", () => {
    const codigo = socket.sala;
    const sala = salas[codigo];

    if (!sala || !sala.iniciada) return;

    const jugador = sala.jugadores[sala.turno];

    if (!jugador || jugador.id !== socket.id) {
      socket.emit("errorJuego", "No es tu turno.");
      return;
    }

    const numero = Math.floor(Math.random() * 6) + 1;

    jugador.posicion += numero;
    jugador.monedas += 10;

    if (jugador.posicion >= 24) {
      jugador.posicion = 24;
      jugador.prestigio += 10;
      sala.mensaje = jugador.nombre + " ha ganado la partida.";

      io.to(codigo).emit("resultadoDado", {
        numero: numero,
        nombre: jugador.nombre,
        estado: obtenerEstado(sala)
      });

      return;
    }

    sala.mensaje =
      jugador.nombre + " sacó un " + numero + ".";

    io.to(codigo).emit("resultadoDado", {
      numero: numero,
      nombre: jugador.nombre,
      estado: obtenerEstado(sala)
    });

    sala.turno =
      (sala.turno + 1) % sala.jugadores.length;

    enviarEstado(codigo);
  });

  socket.on("disconnect", () => {
    const codigo = socket.sala;

    if (!codigo || !salas[codigo]) return;

    const sala = salas[codigo];

    sala.jugadores = sala.jugadores.filter(
      jugador => jugador.id !== socket.id
    );

    if (sala.jugadores.length === 0) {
      delete salas[codigo];
      return;
    }

    if (sala.turno >= sala.jugadores.length) {
      sala.turno = 0;
    }

    sala.iniciada = false;
    sala.mensaje = "Un jugador se ha desconectado.";

    enviarEstado(codigo);
  });
});

servidor.listen(PORT, () => {
  console.log("Servidor funcionando en el puerto " + PORT);
});
