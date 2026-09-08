
const PALETTE = [
  "#FFB800","#4FC1F0","#E9C2E8","#BFCBBD","#E6CAB4",
  "#7BEF45","#B3070A","#FFE319","#9165C3","#152041",
  "#F35A58","#A3DEDB","#899E59","#9848F1","#F7EED8",
  "#1F8610","#250306","#F1BA79","#335776","#E23AB0",
  "#D3A392","#027F3E","#8B7EAB","#F22C82","#EFAE05",
  "#74D641","#132046","#FF72B6","#D18C20","#43D182",
  "#C392BC","#FF4B00","#5C814D","#849FC3","#CE1BD1",
  "#FFB052","#280004","#6DDF5A","#F6AF4F","#2387E8",
  "#E38641","#B80E77","#1B1F17","#C7DDE4","#FF5294",
  "#7A83DD","#D1A617","#27C982","#FF3800","#A891A7"
];

const sections = SIT_SOFT_SECTIONS;

const deck = [
  {type:"landing", section:null, question:"Sit Soft\nBrand Strategy\nSession", bg:"#010000"}
];

let colorIndex = 0;
sections.forEach((section) => {
  deck.push({
    type:"section",
    section:section.name,
    question:`Sit Soft:\n${section.name}`,
    bg:PALETTE[colorIndex++ % PALETTE.length]
  });

  section.questions.forEach((q, i) => {
    deck.push({
      type:"question",
      section:section.name,
      question:q,
      bg:PALETTE[colorIndex++ % PALETTE.length],
      questionIndex:i,
      questionCount:section.questions.length
    });
  });
});

let index = 0;
let animating = false;

const app = document.getElementById("app");
const card = document.getElementById("card");
const sectionTitle = document.getElementById("sectionTitle");
const question = document.getElementById("question");
const progress = document.getElementById("progress");
const prevZone = document.getElementById("prevZone");
const nextZone = document.getElementById("nextZone");

function hexToRgb(hex){
  const h = hex.replace("#","");
  return {
    r:parseInt(h.slice(0,2),16),
    g:parseInt(h.slice(2,4),16),
    b:parseInt(h.slice(4,6),16)
  };
}

function srgb(v){
  v /= 255;
  return v <= 0.04045 ? v/12.92 : Math.pow((v+0.055)/1.055,2.4);
}

function luminance(hex){
  const {r,g,b}=hexToRgb(hex);
  return 0.2126*srgb(r)+0.7152*srgb(g)+0.0722*srgb(b);
}

function contrastRatio(l1,l2){
  const hi=Math.max(l1,l2), lo=Math.min(l1,l2);
  return (hi+0.05)/(lo+0.05);
}

function textColor(bg){
  const l=luminance(bg);
  return contrastRatio(l,0) >= contrastRatio(l,1) ? "#010000" : "#F7F7F4";
}

function renderProgress(item){
  progress.innerHTML="";
  if(item.type!=="question"){
    progress.style.visibility="hidden";
    return;
  }

  progress.style.visibility="visible";

  const count=item.questionCount;
  const styles=getComputedStyle(document.documentElement);
  const gap=parseFloat(styles.getPropertyValue("--gap")) || 28;
  const max=parseFloat(styles.getPropertyValue("--dot-max")) || 44;
  const min=parseFloat(styles.getPropertyValue("--dot-min")) || 18;
  const available=Math.max(0, progress.clientWidth - gap*(count-1));
  const dot=Math.max(min, Math.min(max, available/count));

  progress.style.setProperty("--dot-size", `${dot}px`);

  for(let i=0;i<count;i++){
    const d=document.createElement("span");
    d.className="progress-dot"+(i===item.questionIndex ? " is-active":"");
    progress.appendChild(d);
  }
}

function render(){
  const item=deck[index];
  const fg=textColor(item.bg);

  app.style.setProperty("--bg", item.bg);
  app.style.setProperty("--fg", fg);
  app.style.setProperty(
    "--dot-inactive",
    fg==="#010000" ? "rgba(247,247,244,.95)" : "rgba(247,247,244,.32)"
  );

  document.querySelector('meta[name="theme-color"]').setAttribute("content", item.bg);

  sectionTitle.textContent = item.type==="question" ? `Sit Soft: ${item.section}` : "";
  question.textContent = item.question;

  requestAnimationFrame(()=>renderProgress(item));

  prevZone.disabled=index===0;
  nextZone.disabled=index===deck.length-1;
}

function haptic(){
  if(navigator.vibrate){
    try{ navigator.vibrate(10); }catch(e){}
  }
}

function go(direction){
  if(animating) return;

  const next=index+direction;
  if(next<0 || next>=deck.length) return;

  haptic();
  animating=true;

  const outClass=direction>0 ? "anim-next-out":"anim-prev-out";
  const inClass=direction>0 ? "anim-next-in":"anim-prev-in";

  card.classList.add(outClass);

  setTimeout(()=>{
    index=next;
    render();
    card.classList.remove(outClass);
    void card.offsetWidth;
    card.classList.add(inClass);

    setTimeout(()=>{
      card.classList.remove(inClass);
      animating=false;
    },190);
  },110);
}

prevZone.addEventListener("click",()=>go(-1));
nextZone.addEventListener("click",()=>go(1));

document.addEventListener("keydown",(e)=>{
  if(e.key==="ArrowRight" || e.key===" " || e.key==="Enter") go(1);
  if(e.key==="ArrowLeft") go(-1);
});

window.addEventListener("resize",()=>{
  const item=deck[index];
  if(item.type==="question") renderProgress(item);
});

render();
