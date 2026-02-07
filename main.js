// 🔥 Firebase config (REPLACE WITH YOUR OWN)
firebase.initializeApp({
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT.firebaseio.com",
  projectId: "YOUR_PROJECT"
});

const db = firebase.database();
const playerId = Math.random().toString(36).slice(2);
let lobbyId = null;
let players = {};

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

// TEST OBJECT (you should see this)
const cube = new THREE.Mesh(
  new THREE.BoxGeometry(5,5,5),
  new THREE.MeshStandardMaterial({ color: 0xff0000 })
);
cube.position.set(0, 2.5, 0);
scene.add(cube);


const camera = new THREE.PerspectiveCamera(75, innerWidth/innerHeight, 0.1, 1000);
camera.position.set(0, 15, 25);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

// Light
scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1));

// Ground
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(200,200),
  new THREE.MeshStandardMaterial({color:0x228B22})
);
ground.rotation.x = -Math.PI/2;
scene.add(ground);

// Load humans
const loader = new THREE.GLTFLoader();
const meshes = {};

function addHuman(id){
  loader.load("models/human.glb", gltf => {
    const model = gltf.scene;
    scene.add(model);
    meshes[id] = model;
  });
}

// Controls
const keys = {};
onkeydown = e => keys[e.key] = true;
onkeyup = e => keys[e.key] = false;

// UI
const lobbyInput = document.getElementById("lobby");
const status = document.getElementById("status");

document.getElementById("create").onclick = () => {
  lobbyId = lobbyInput.value || Math.random().toString(36).slice(2,6);
  db.ref("lobbies/"+lobbyId).set({
    players:{}
  });
  joinLobby();
};

document.getElementById("join").onclick = () => {
  lobbyId = lobbyInput.value;
  joinLobby();
};

function joinLobby(){
  status.innerText = "Lobby: " + lobbyId;
  db.ref(`lobbies/${lobbyId}/players/${playerId}`).set({x:0,z:0});
  db.ref(`lobbies/${lobbyId}/players`).on("value", snap=>{
    players = snap.val() || {};
    for(const id in players){
      if(!meshes[id]) addHuman(id);
    }
  });
}

// Game loop
function animate(){
  requestAnimationFrame(animate);

  if(players[playerId]){
    let p = players[playerId];
    if(keys["w"]) p.z -= 0.1;
    if(keys["s"]) p.z += 0.1;
    if(keys["a"]) p.x -= 0.1;
    if(keys["d"]) p.x += 0.1;

    db.ref(`lobbies/${lobbyId}/players/${playerId}`).update(p);

    camera.position.set(p.x, 10, p.z + 20);
    camera.lookAt(p.x, 0, p.z);
  }

  for(const id in players){
    if(meshes[id]){
      meshes[id].position.set(players[id].x,0,players[id].z);
    }
  }

  renderer.render(scene, camera);
}
animate();
