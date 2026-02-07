// ------------------ 1️⃣ FIREBASE CONFIG ------------------
const firebaseConfig = {
  apiKey: "AIza...YOUR_KEY...",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT.firebaseio.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ------------------ 2️⃣ VARIABLES ------------------
const playerId = Math.random().toString(36).substring(2,10);
let lobbyId = null;
let players = {};
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
    players: { [playerId]: { x:50, y:50, color:"lime" } },
    started: false,
    npcs: { npc1: {x:300, y:200, color:"red"} }
  });

  listenLobby();
  status.innerText = `Lobby created: ${lobbyId}`;
};

joinBtn.onclick = () => {
  lobbyId = lobbyInput.value;
  if(!lobbyId) return alert("Enter a lobby ID");

  const playerRef = db.ref(`lobbies/${lobbyId}/players/${playerId}`);
  playerRef.set({ x:50, y:50, color:"blue" });

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

// ------------------ 6️⃣ SHOOTING (CLICK TO FIRE) ------------------
canvas.addEventListener("click", e => {
  if(!players[playerId]) return;
  const mouseX = e.offsetX;
  const mouseY = e.offsetY;

  // Example: mark a “shot” on all NPCs
  for(const [npcId, npc] of Object.entries(npcs)){
    const dx = mouseX - npc.x;
    const dy = mouseY - npc.y;
    if(Math.sqrt(dx*dx + dy*dy) < 20){
      // NPC hit, remove it
      db.ref(`lobbies/${lobbyId}/npcs/${npcId}`).remove();
    }
  }
});

// ------------------ 7️⃣ GAME LOOP ------------------
function draw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // Draw players
  for(const p of Object.values(players)){
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x-10, p.y-10, 20,20);
  }

  // Draw NPCs
  for(const n of Object.values(npcs || {})){
    ctx.fillStyle = n.color;
    ctx.fillRect(n.x-10, n.y-10, 20,20);
  }

  requestAnimationFrame(draw);
}
draw();

