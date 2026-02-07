// ------------------ 1️⃣ FIREBASE CONFIG ------------------
const firebaseConfig = {
  apiKey: "AIzaSyBUpwKSfPr6n0dWj14nri0e83PVFVNb-2c",
  authDomain: "gta-multiplayer-game.firebaseapp.com",
  projectId: "gta-multiplayer-game",
  storageBucket: "gta-multiplayer-game.firebasestorage.app",
  messagingSenderId: "690537023893",
  appId: "1:690537023893:web:ee65b4f1dd98283b76ce9c",
  measurementId: "G-WR7D12188Q"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ------------------ 2️⃣ VARIABLES ------------------
const playerId = Math.random().toString(36).substring(2,10);
let lobbyId = null;
let players = {};
let npcs = {};
let cars = {};
let bullets = [];

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// UI elements
const lobbyInput = document.getElementById("lobbyInput");
const createBtn = document.getElementById("createBtn");
const joinBtn = document.getElementById("joinBtn");
const status = document.getElementById("status");

// ------------------ 3️⃣ CREATE / JOIN LOBBY ------------------
createBtn.onclick = () => {
  lobbyId = lobbyInput.value || Math.random().toString(36).substring(2,6);
  const lobbyRef = db.ref("lobbies/" + lobbyId);

  lobbyRef.set({
    host: playerId,
    players: { [playerId]: { x:100, y:100, color:"lime", hp:100 } },
    npcs: {
      npc1: {x:300,y:200,color:"red",hp:50},
      npc2: {x:500,y:400,color:"red",hp:50}
    },
    cars: {
      car1:{x:200,y:200,color:"yellow"},
      car2:{x:600,y:300,color:"yellow"}
    },
    started: false,
    wantedLevel: 0
  });

  listenLobby();
  status.innerText = `Lobby created: ${lobbyId}`;
};

joinBtn.onclick = () => {
  lobbyId = lobbyInput.value;
  if(!lobbyId) return alert("Enter a lobby ID");

  const playerRef = db.ref(`lobbies/${lobbyId}/players/${playerId}`);
  playerRef.set({ x:100, y:100, color:"blue", hp:100 });

  listenLobby();
  status.innerText = `Joined lobby: ${lobbyId}`;
};

// ------------------ 4️⃣ LISTEN FOR LOBBY UPDATES ------------------
function listenLobby() {
  const lobbyRef = db.ref("lobbies/" + lobbyId);
  lobbyRef.on("value", snapshot => {
    const data = snapshot.val();
    if(!data) return;
    players = data.players || {};
    npcs = data.npcs || {};
    cars = data.cars || {};
    wantedLevel = data.wantedLevel || 0;
  });
}

// ------------------ 5️⃣ PLAYER MOVEMENT ------------------
const keys = { w:[0,-5], s:[0,5], a:[-5,0], d:[5,0] };
document.addEventListener("keydown", e => {
  if(!players[playerId]) return;
  if(!keys[e.key]) return;

  const move = keys[e.key];
  players[playerId].x += move[0];
  players[playerId].y += move[1];

  db.ref(`lobbies/${lobbyId}/players/${playerId}`).update({
    x: players[playerId].x,
    y: players[playerId].y
  });
});

// ------------------ 6️⃣ SHOOTING ------------------
canvas.addEventListener("click", e => {
  if(!players[playerId]) return;
  bullets.push({x:players[playerId].x, y:players[playerId].y, tx:e.offsetX, ty:e.offsetY});
});

// ------------------ 7️⃣ GAME LOOP ------------------
function draw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // Draw buildings (example)
  ctx.fillStyle="gray";
  ctx.fillRect(250,150,100,200);
  ctx.fillRect(500,100,150,150);

  // Draw cars
  for(const car of Object.values(cars)){
    ctx.fillStyle = car.color;
    ctx.fillRect(car.x-15, car.y-10,30,20);
  }

  // Draw NPCs
  for(const [id, npc] of Object.entries(npcs)){
    ctx.fillStyle = npc.color;
    ctx.fillRect(npc.x-10, npc.y-10,20,20);
  }

  // Draw players
  for(const p of Object.values(players)){
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x-10, p.y-10,20,20);
  }

  // Draw bullets
  bullets.forEach((b,i)=>{
    ctx.fillStyle="orange";
    ctx.fillRect(b.x-3,b.y-3,6,6);

    // Move bullet
    const dx = b.tx-b.x;
    const dy = b.ty-b.y;
    const dist = Math.sqrt(dx*dx+dy*dy);
    const speed = 10;
    b.x += dx/dist*speed;
    b.y += dy/dist*speed;

    // Check collision with NPCs
    for(const [id,npc] of Object.entries(npcs)){
      const d = Math.sqrt((npc.x-b.x)**2 + (npc.y-b.y)**2);
      if(d<15){
        // Hit: remove NPC
        db.ref(`lobbies/${lobbyId}/npcs/${id}`).remove();
        bullets.splice(i,1);
      }
    }

    // Remove if offscreen
    if(b.x<0||b.x>canvas.width||b.y<0||b.y>canvas.height) bullets.splice(i,1);
  });

  requestAnimationFrame(draw);
}
draw();
