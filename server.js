
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  maxHttpBufferSize: 1e5
});

app.use(express.static(path.join(__dirname, "client")));

const players = {};

io.on("connection", (socket) => {
  console.log("Pemain terhubung:", socket.id);

  players[socket.id] = {
    id: socket.id,
    name: "Pemain",
    x: 0,
    y: 0,
    z: 0,
    rotation: 0
  };

  socket.emit("currentPlayers", players);
  socket.broadcast.emit("playerJoined", players[socket.id]);

  socket.on("setName", (name) => {
    if (typeof name !== "string") return;

    const cleanName = name.trim().slice(0, 20);
    if (!cleanName) return;

    players[socket.id].name = cleanName;

    io.emit("playerUpdated", players[socket.id]);
  });

  socket.on("move", (data) => {
    if (!players[socket.id] || !data) return;

    const x = Number(data.x);
    const z = Number(data.z);
    const rotation = Number(data.rotation);

    if (![x, z, rotation].every(Number.isFinite)) return;

    // Batasi koordinat agar data tetap masuk akal.
    if (Math.abs(x) > 500 || Math.abs(z) > 500) return;

    players[socket.id].x = x;
    players[socket.id].z = z;
    players[socket.id].rotation = rotation;

    socket.broadcast.emit("playerMoved", players[socket.id]);
  });

  socket.on("disconnect", () => {
    delete players[socket.id];
    io.emit("playerLeft", socket.id);
    console.log("Pemain keluar:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {
  console.log("TOLA CITY berjalan pada port " + PORT);
});
