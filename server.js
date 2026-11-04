const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });
app.use(express.static("public"));
const rooms = new Map();
const names = ["Technician","Hacker","Operator","Commander"];
const colors = ["#64d8ff","#ffb45e","#b58cff","#8ce39b"];
const puzzles = [
 {type:"pattern",title:"Pattern Relay",desc:"Find the missing symbol in the sequence. The clue is on the wall terminal.",answer:"triangle",options:["circle","triangle","square"],hint:"The symbols gain one corner each time: circle, triangle, square."},
 {type:"memory",title:"Memory Grid",desc:"Repeat the four-symbol sequence shown on the operator's display.",answer:"blue-star",sequence:["red-circle","blue-star","yellow-triangle","green-square"],hint:"Read the sequence from left to right on the reference screen."},
 {type:"logic",title:"Signal Logic",desc:"A fictional signal panel needs the only number that satisfies the clue.",answer:"7",options:["4","7","9"],hint:"It is an odd prime between 5 and 8."},
 {type:"pattern",title:"Glyph Lock",desc:"Choose the glyph that completes the repeating pattern.",answer:"moon",options:["sun","moon","star"],hint:"The pattern alternates sun, moon, sun, moon."}
];
function makeRoom(code){return {code,players:{},status:"lobby",time:300,mission:"SUBWAY SIGNAL ROOM",solved:[],puzzles:[],log:["Dispatch: Team assembled. Find the consoles and solve the fictional logic challenges."],lastTick:Date.now(),interval:null};}
function publicRoom(r){
 const players=Object.values(r.players).map(p=>({id:p.id,name:p.name,role:p.role,x:p.x,y:p.y,angle:p.angle,color:p.color,ready:p.ready}));
 return {code:r.code,status:r.status,time:r.time,mission:r.mission,players,solved:r.solved.length,total:r.puzzles.length,log:r.log.slice(-8),puzzles:r.puzzles.map((p,i)=>({id:i,type:p.type,title:p.title,desc:p.desc,solved:r.solved.includes(i)}))};
}
function emitRoom(r){io.to(r.code).emit("state",publicRoom(r));}
function addLog(r,msg){r.log.push(msg); if(r.log.length>30)r.log.shift();}
function start(r){
 if(r.status!=="lobby"||Object.keys(r.players).length<2)return;
 r.status="playing";r.time=300;r.solved=[];r.puzzles=[...puzzles].sort(()=>Math.random()-.5).slice(0,3);
 addLog(r,"Dispatch: Five minutes. Stay calm, communicate, and solve all three panels.");
 if(r.interval)clearInterval(r.interval);
 r.interval=setInterval(()=>{if(r.status!=="playing")return;r.time--;if(r.time<=0){r.time=0;r.status="failed";addLog(r,"MISSION FAILED: The timer expired. Dispatch is sending another team.");clearInterval(r.interval);}emitRoom(r);},1000);
 emitRoom(r);
}
io.on("connection",socket=>{
 socket.on("join",({code,name})=>{
  code=String(code||"").toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,6);
  if(!code)code=Math.random().toString(36).slice(2,8).toUpperCase();
  let r=rooms.get(code);if(!r){r=makeRoom(code);rooms.set(code,r);}
  if(Object.keys(r.players).length>=4){socket.emit("errorMsg","That room is full (maximum 4).");return;}
  if(r.status!=="lobby"){socket.emit("errorMsg","That mission has already started. Create another room.");return;}
  const count=Object.keys(r.players).length;
  const p={id:socket.id,name:String(name||"Agent").slice(0,18),role:names[count],x:2+count*.7,y:2,angle:0,color:colors[count],ready:false};
  r.players[socket.id]=p;socket.join(code);socket.data.room=code;
  addLog(r,`${p.name} joined as ${p.role}.`);socket.emit("joined",{code,id:socket.id});emitRoom(r);
 });
 socket.on("move",d=>{const r=rooms.get(socket.data.room),p=r?.players[socket.id];if(!p||r.status!=="playing")return;p.x=Math.max(1,Math.min(8,Number(d.x)||p.x));p.y=Math.max(1,Math.min(8,Number(d.y)||p.y));p.angle=Number(d.angle)||0;emitRoom(r);});
 socket.on("chat",msg=>{const r=rooms.get(socket.data.room),p=r?.players[socket.id];if(!p)return;const s=String(msg||"").slice(0,180);if(!s.trim())return;addLog(r,`${p.name}: ${s}`);io.to(r.code).emit("chat",{name:p.name,text:s});emitRoom(r);});
 socket.on("start",()=>{const r=rooms.get(socket.data.room);if(r&&Object.keys(r.players).length>=2)start(r);});
 socket.on("solve",({id,answer})=>{const r=rooms.get(socket.data.room);if(!r||r.status!=="playing"||!Number.isInteger(id)||!r.puzzles[id]||r.solved.includes(id))return;const puzzle=r.puzzles[id];if(String(answer).toLowerCase()===puzzle.answer){r.solved.push(id);addLog(r,`${r.players[socket.id]?.name||"Agent"} solved ${puzzle.title}.`);if(r.solved.length===r.puzzles.length){r.status="success";addLog(r,"MISSION SUCCESS: All panels stabilized. Excellent teamwork.");clearInterval(r.interval);}emitRoom(r);}else{addLog(r,`${r.players[socket.id]?.name||"Agent"} entered an incorrect response on ${puzzle.title}.`);r.time=Math.max(0,r.time-12);if(!r.time){r.status="failed";clearInterval(r.interval);}emitRoom(r);}});
 socket.on("reset",()=>{const r=rooms.get(socket.data.room);if(!r)return;r.status="lobby";r.time=300;r.solved=[];r.puzzles=[];r.log=["Dispatch: New shift. Ready up when the team is assembled."];if(r.interval)clearInterval(r.interval);emitRoom(r);});
 socket.on("disconnect",()=>{const r=rooms.get(socket.data.room);if(!r)return;const p=r.players[socket.id];if(p){addLog(r,`${p.name} disconnected.`);delete r.players[socket.id];emitRoom(r);}if(!Object.keys(r.players).length){if(r.interval)clearInterval(r.interval);rooms.delete(r.code);}});
});
const PORT=process.env.PORT||3000;server.listen(PORT, "0.0.0.0", () => console.log(`DEADLINE server listening on port ${PORT}`));
