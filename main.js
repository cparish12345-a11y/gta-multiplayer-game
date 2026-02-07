// 1️⃣ Initialize Firebase
const firebaseConfig = {
  apiKey: "AIza...yourkey...",
  authDomain: "gta-browser-game.firebaseapp.com",
  databaseURL: "https://gta-browser-game-default-rtdb.firebaseio.com",
  projectId: "gta-browser-game",
  storageBucket: "gta-browser-game.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// 2️⃣ Utility to generate a random ID for player
const playerId = Math.random().toString(36).substring(2, 10);

// 3️⃣ DOM elements
const lobbyInput = document.getElementById("lobbyInput");
const createBtn = document.getElementById("createBtn");
const joinBtn = document.getElementById("joinBtn");
const status = document.getElementById("status");

// 4️⃣ Create lobby
createBtn.onclick = () => {
  const lobbyId = lobbyInput.value || Math.random().toString(36).substring(2,6);
  const lobbyRef = db.ref("lobbies/" + lobbyId);

  lobbyRef.set({
    host: playerId,
    players: { [playerId]: { x:0, y:0 } },
    started: false
  });

  listenLobby(lobbyId);
  status.innerText = `Lobby created: ${lobbyId}`;
}

// 5️⃣ Join lobby
joinBtn.onclick = () => {
  const lobbyId = lobbyInput.value;
  if (!lobbyId) return alert("Enter a lobby ID");

  const lobbyRef = db.ref("lobbies/" + lobbyId + "/players");
  lobbyRef.update({ [playerId]: { x:0, y:0 } });

  listenLobby(lobbyId);
  status.innerText = `Joined lobby: ${lobbyId}`;
}

// 6️⃣ Listen for lobby updates
function listenLobby(lobbyId){
  const lobbyRef = db.ref("lobbies/" + lobbyId);
  lobbyRef.on("value", (snapshot)=>{
    const data = snapshot.val();
    if(!data) return;

    console.clear();
    console.log("Lobby data:", data);
    status.innerText = `Lobby: ${lobbyId} | Players: ${Object.keys(data.players).length}`;
    
    // Example: update player positions (here, just logs)
    for(const [id, p] of Object.entries(data.players)){
      console.log(id, p);
    }
  });
}

// 7️⃣ Move player (example)
document.addEventListener("keydown", e=>{
  const keys = {w:[0,-1],s:[0,1],a:[-1,0],d:[1,0]};
  if(!keys[e.key]) return;

  const lobbyId = lobbyInput.value;
  if(!lobbyId) return;

  const playerRef = db.ref(`lobbies/${lobbyId}/players/${playerId}`);
  playerRef.once("value").then(snap=>{
    const pos = snap.val();
    const move = keys[e.key];
    playerRef.update({ x: pos.x + move[0], y: pos.y + move[1] });
  });
});
