// ====== SOCKET.IO ======
const socket = io("https://gta-multiplayer-game.onrender.com"); // replace with your Render URL

// ====== THREE.JS SETUP ======
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lighting
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const sun = new THREE.DirectionalLight(0xffffff, 0.8);
sun.position.set(10, 20, 10);
scene.add(sun);

// ====== GAME DATA ======
const players = {};
let myId, myPlayer;

const npcMeshes = {};
const npcs = [];
const policeUnits = [];
let myCar, inCar = false;

const weapons = {
  pistol: { damage: 20, range: 5, cooldown: 500 },
  smg: { damage: 10, range: 6, cooldown: 120 },
  shotgun: { damage: 40, range: 3, cooldown: 900 }
};
let currentWeapon = "pistol";
let lastShot = 0;

// ====== HELPER FUNCTIONS ======
function createHuman(color = 0xcccccc) {
  const g = new THREE.Group();
  const mat = new THREE.MeshLambertMaterial({ color });

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.8,1.2,0.4), mat);
  torso.position.y = 1.6;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.35,16,16), mat);
  head.position.y = 2.4;
  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.25,1,0.25), mat);
  const legR = legL.clone();
  legL.position.set(-0.2,0.5,0);
  legR.position.set(0.2,0.5,0);

  g.add(torso, head, legL, legR);
  g.userData = { legL, legR, walk: 0 };
  return g;
}

function createPlayer(player) {
  const human = createHuman(0x00ff00);
  human.position.set(player.x,0,player.z);
  scene.add(human);
  players[player.id] = human;

  if (!myPlayer) { myId = player.id; myPlayer = human; }
}

function createBuilding(x,z,w,h,d){
  const geo = new THREE.BoxGeometry(w,h,d);
  const mat = new THREE.MeshLambertMaterial({ color:0x666666 });
  const b = new THREE.Mesh(geo, mat);
  b.position.set(x,h/2,z);
  scene.add(b);
}

// ====== CITY ======
createBuilding(10, 10, 6, 8, 6);
createBuilding(-10, 5, 8, 12, 8);
createBuilding(5, -10, 10, 6, 10);
createBuilding(-12, -8, 6, 10, 6);

// ====== CAR ======
const carGeo = new THREE.BoxGeometry(2,1,4);
const carMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
myCar = new THREE.Mesh(carGeo, carMat);
myCar.position.set(5,0.5,5);
scene.add(myCar);

// ====== SOCKET EVENTS ======
socket.on("currentPlayers", data => { Object.values(data).forEach(createPlayer); });
socket.on("newPlayer", createPlayer);

socket.on("playerMoved", data => {
  if(players[data.id]) players[data.id].position.set(data.x,0,data.z);
});
socket.on("playerDisconnected", id => {
  if(players[id]) { scene.remove(players[id]); delete players[id]; }
});

socket.on("npcUpdate", data => {
  data.forEach(npc => {
    if(!npcMeshes[npc.id]){
      npcMeshes[npc.id] = createHuman(0x999999);
      scene.add(npcMeshes[npc.id]);
    }
    npcMeshes[npc.id].position.set(npc.x,0,npc.z);
  });
});

socket.on("wantedUpdate", data => {
  if(data.id===myId){
    console.log("WANTED LEVEL:", "⭐".repeat(data.wanted));
  }
});

// ====== MOVEMENT ======
document.addEventListener("keydown", e=>{
  if(!myPlayer) return;
  const speed = inCar ? 0.4 : 0.2;
  if(e.key==="w") inCar ? myCar.position.z-=speed : myPlayer.position.z-=speed;
  if(e.key==="s") inCar ? myCar.position.z+=speed : myPlayer.position.z+=speed;
  if(e.key==="a") inCar ? myCar.position.x-=speed : myPlayer.position.x-=speed;
  if(e.key==="d") inCar ? myCar.position.x+=speed : myPlayer.position.x+=speed;

  if(!inCar) socket.emit("move",{ x: myPlayer.position.x, z: myPlayer.position.z });
});

document.addEventListener("keydown", e=>{
  if(e.key==="e"){
    const dist = myPlayer.position.distanceTo(myCar.position);
    if(dist<3){ inCar = !inCar; myPlayer.visible = !inCar; }
  }
  if(e.key==="1") currentWeapon="pistol";
  if(e.key==="2") currentWeapon="smg";
  if(e.key==="3") currentWeapon="shotgun";
});

document.addEventListener("click", ()=>{
  const weapon = weapons[currentWeapon];
  const now = Date.now();
  if(now-lastShot<weapon.cooldown) return;
  lastShot = now;

  Object.keys(players).forEach(id=>{
    if(id!==myId) socket.emit("shoot",{ weapon: currentWeapon, x: myPlayer.position.x, z: myPlayer.position.z, targetId: id });
  });

  // alert police
  policeUnits.forEach(cop=>cop.userData.alert=true);
});

// ====== SPAWN NPCS ======
for(let i=0;i<5;i++){
  const npc = createHuman(0x999999);
  npc.position.set(Math.random()*20-10,0,Math.random()*20-10);
  npc.userData={ type:"civilian", dir:new THREE.Vector3(Math.random()-0.5,0,Math.random()-0.5) };
  scene.add(npc);
  npcs.push(npc);
}

// ====== SPAWN POLICE ======
function spawnPolice(){
  const cop = createHuman(0x0000ff);
  cop.position.set(0,0,-10);
  cop.userData={ type:"police", alert:false, speed:0.04 };
  scene.add(cop);
  policeUnits.push(cop);
}
spawnPolice();

// ====== CAMERA ======
camera.position.y = 5;
camera.position.z = 10;

// ====== ANIMATE ======
function animate(){
  requestAnimationFrame(animate);
  // NPC movement
  npcs.forEach(npc=>{
    npc.position.add(npc.userData.dir.clone().multiplyScalar(0.02));
    if(Math.random()<0.01){ npc.userData.dir.set(Math.random()-0.5,0,Math.random()-0.5); }
    if(myPlayer && npc.position.distanceTo(myPlayer.position)<3){
      npc.userData.dir.sub(myPlayer.position.clone().sub(npc.position).normalize());
    }
    // walking animation
    npc.userData.walk = (npc.userData.walk||0)+0.1;
    npc.userData.legL.rotation.x = Math.sin(npc.userData.walk)*0.5;
    npc.userData.legR.rotation.x = -Math.sin(npc.userData.walk)*0.5;
  });

  // Player walking animation
  Object.values(players).forEach(p=>{
    if(!p.userData) return;
    p.userData.walk += 0.1;
    p.userData.legL.rotation.x = Math.sin(p.userData.walk)*0.5;
    p.userData.legR.rotation.x = -Math.sin(p.userData.walk)*0.5;
  });

  // Police AI
  policeUnits.forEach(cop=>{
    if(!myPlayer) return;
    const dist = cop.position.distanceTo(myPlayer.position);
    if(dist<8) cop.userData.alert=true;
    if(cop.userData.alert){
      const dir=myPlayer.position.clone().sub(cop.position).normalize();
      cop.position.add(dir.multiplyScalar(cop.userData.speed));
    }
  });

  renderer.render(scene,camera);
}
animate();
