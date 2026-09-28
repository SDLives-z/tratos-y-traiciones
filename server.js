const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));

const salas = {};

function crearSalaId() {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

function estadoPublico(sala) {
  return {
    jugadores: sala.jugadores,
    turno: sala.turno,
    mensaje: sala.mensaje,
    iniciada: sala.iniciada
  };
}

io.on("connection", socket => {
  socket.on("crearSala", nombre => {
    let codigo;

    do {
      codigo = crearSalaId();
    } while (salas[codigo]);

    salas[codigo] = {
      jugadores: [],
      turno: 0,
      iniciada: false,
      mensaje: "Esperando jugadores..."
    };

    const jugador = {
      id: socket.id,
      nombre: nombre || "Jugador 1",
      posicion: 0,
      monedas: 100,
      prestigio: 0,
      color: "#06d6a0"
    };

    salas[codigo].jugadores.push(jugador);
    socket.join(codigo);
    socket.sala = codigo;
    socket.jugadorId = socket.id;

    socket.emit("salaCreada", {
      codigo,
      jugador: jugador
    });

    io.to(codigo).emit("estado", estadoPublico(salas[codigo]));
  });

  socket.on("unirseSala", datos => {
    const codigo = String(datos.codigo || "").toUpperCase();
    const nombre = datos.nombre || "Jugador";

    const sala = salas[codigo];

    if (!sala) {
      socket.emit("errorJuego", "La sala no existe.");
      return;
    }

    if (sala.jugadores.length >= 3) {
      socket.emit("errorJuego", "La sala ya está llena.");
      return;
    }

    if (sala.iniciada) {
      socket.emit("errorJuego", "La partida ya comenzó.");
      return;
    }

    const colores = ["#06d6a0", "#ef476f", "#118ab2"];

    const jugador = {
      id: socket.id,
      nombre,
      posicion: 0,
      monedas: 100,
      prestigio: 0,
      color: colores[sala.jugadores.length]
    };

    sala.jugadores.push(jugador);

    socket.join(codigo);
    socket.sala = codigo;
    socket.jugadorId = socket.id;

    socket.emit("unidoSala",Estás en el lugar correcto. En GitHub, **`server.js` es simplemente otro archivo dentro de tu repositorio**.

Haz exactamente esto:

1. Abre tu repositorio `tratos-y-traiciones`.
2. Pulsa **Add file**.
3. Pulsa **Create new file**.
4. En el campo superior escribe:

```text
server.js
  
