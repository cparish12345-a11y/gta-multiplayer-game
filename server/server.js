const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

// =====================
// GAME STATE
// =====================
const players = {};
const npcs = [];

// Spawn synced NPCs
for (let i = 0; i < 6; i++) {
  npcs.push({
    id: "npc_" + i,
    x: Math.random() * 20 - 10,
    z: Math.random() * 20 - 10,
    type: "civilian"
  });
}

// =====================
// SOCKET HANDLING
// =====================
io.on("connection", socket => {
  console.log("Player connected:", socket.id);

  players[socket.id] = {
    id: socket.id,
    x: 0,
    z: 0,
    hp: 100,
    wanted: 0
  };

  socket.emit("currentPlayers", players);
  socket.emit("npcUpdate", npcs);
  socket.broadcast.emit("newPlayer", players[socket.id]);

  socket.on("move", data => {
    if (!players[socket.id]) return;
    players[socket.id].x = data.x;
    players[socket.id].z = data.z;
    socket.broadcast.emit("playerMoved", players[socket.id]);
  });

  socket.on("shoot", data => {
    const shooter = players[socket.id];
    if (!shooter) return;

    shooter.wanted = Math.min(5, shooter.wanted + 1);
    io.emit("wantedUpdate", {
      id: socket.id,
      wanted: shooter.wanted
    });

    const target = players[data.targetId];
    if (!target) return;

    const dx = shooter.x - target.x;
    const dz = shooter.z - target.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    const weaponStats = {
      pistol: { damage: 20, range: 5 },
      smg: { damage: 10, range: 6 },
      shotgun: { damage: 40, range: 3 }
    };

    const weapon = weaponStats[data.weapon] || weaponStats.pistol;

    if (dist <= weapon.range) {
      target.hp -= weapon.damage;

      if (target.hp <= 0) {
        target.hp = 100;
        target.x = 0;
        target.z = 0;
      }

      io.emit("pla
