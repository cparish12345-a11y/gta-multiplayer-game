// ------------------ FIREBASE CONFIG ------------------
const firebaseConfig = {
  apiKey: "YOUR_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT.firebaseio.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ------------------ VARIABLES ------------------
const playerId = Math.random().toString(36).substring(2,10);
let lobbyId = null;
let players = {};

const lobbyInput = document.getElementById("lobbyInput");
const createBtn = document.getElementById("createBtn");
const joinBtn = document.getElementById("joinBtn");
const status = document.getElementById("status");

// ------------------ THREE.JS SETUP ------------------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x333333);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(0, 20, 30);
camera.lookAt(0,0,0);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lighting
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10,20,10);
scene.add(light);

// Floor
const floorGeo = new THREE.PlaneGeometry(100,100);
const floorMat = new THREE.MeshPhongMaterial({color:0x555555});
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.rotation.x = -Math.PI/2;
scene.add(floor);

// Buildings
const buildingGeo = new THREE.BoxGeometry(5,10,5);
const buildingMat = new THREE.MeshPhongMaterial({color:0x888888});
const building1 = new THREE.Mesh(buildingGeo, buildingMat);
building1.position.set(10,5,-10);
scene.add(building1);

const building2 = new THREE.Mesh(buildingGeo, buildingMat);
building2.position.set(-15,5,15);
scene.add(building2);

// Player cubes storage
const playerMeshes = {};

// ------------------ CREATE / JOIN LOBBY ------------------
createBtn.onclick = () => {
  lobbyId = lobbyInput.value || Math.random().toString(36).substring(2,6);
  const lobbyRef = db.ref("lobbies/" + lobbyId);

  lobbyRef.set({
    players: { [playerId]: { x:0, y:0, z:0, color:0x00ff00 } }
  });

  listenLobby();
  status.innerText = `Lobby created: ${lobbyId}`;
};

joinBtn.onclick = () => {
  lobbyId = lobbyInput.value;
  if(!lobbyId) return alert("Enter a lobby ID");

  const playerRef = db.ref(`lobbies/${lobbyId}/players/${playerId}`);
  playerRef.set({ x:0, y:0, z:0, color:0x0000ff });

  listenLobby();
  status.innerText = `Joined lobby: ${lobbyId}`;
};

// ------------------ LISTEN FOR LOBBY ------------------
function listenLobby() {
  const lobbyRef = db.ref("lobbies/" + lobbyId);
  lobbyRef.on("value", snapshot => {
    const data = snapshot.val();
    if(!data) return;
    players = data.players || {};

    // Create meshes for new players
    for(const [id,p] of Object.entries(players)){
      if(!playerMeshes[id]){
        const geo = new THREE.BoxGeometry(2,2,2);
        const mat = new THREE.MeshPhongMaterial({color:p.color});
        const mesh = new THREE.Mesh(geo, mat);
        scene.add(mesh);
        playerMeshes[id] = mesh;
      }
    }
  });
}

// ------------------ PLAYER MOVEMENT ------------------
const keys = { w:[0,0,-0.5], s:[0,0,0.5], a:[-0.5,0,0], d:[0.5,0,0] };
document.addEventListener("keydown", e=>{
  if(!players[playerId]) return;
  if(!keys[e.key]) return;

  const move = keys[e.key];
  players[playerId].x += move[0];
  players[playerId].y += move[1];
  players[playerId].z += move[2];

  db.ref(`lobbies/${lobbyId}/players/${playerId}`).update({
    x: players[playerId].x,
    y: players[playerId].y,
    z: players[playerId].z
  });
});

// ------------------ ANIMATION LOOP ------------------
function animate(){
  requestAnimationFrame(animate);

  for(const [id, p] of Object.entries(players)){
    const mesh = playerMeshes[id];
    if(mesh){
      mesh.position.set(p.x, p.y+1, p.z); // y+1 so cube sits on floor
    }
  }

  // Camera follows local player
  if(players[playerId]){
    const p = players[playerId];
    camera.position.set(p.x, 20, p.z+30);
    camera.lookAt(p.x,0,p.z);
  }

  renderer.render(scene, camera);
}
animate();
