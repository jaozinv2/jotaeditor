const $=id=>document.getElementById(id);
const cv=$('cv'),ctx=cv.getContext('2d'),frame=$('frame'),ov=$('ov'),sel=$('sel');
let cur=null,orig=null,undo=[],fx={gray:0,sepia:0,invert:0},crop=null,rect=null;
const sliders=['br','co','sa','bl'];

function toast(t){const e=$('toast');e.textContent=t;e.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove('on'),1600)}
function mk(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c}
function clone(c){const n=mk(c.width,c.height);n.getContext('2d').drawImage(c,0,0);return n}
function filterStr(w,h){
  w=w||cv.clientWidth||cur.width;h=h||cv.clientHeight||cur.height;
  const b=($('bl').value/100*0.03*Math.max(w,h)).toFixed(2);
  return `brightness(${$('br').value}%) contrast(${$('co').value}%) saturate(${$('sa').value}%) blur(${b}px) grayscale(${fx.gray}) sepia(${fx.sepia}) invert(${fx.invert})`;
}
function render(){
  if(!cur)return;
  cv.width=cur.width;cv.height=cur.height;ctx.drawImage(cur,0,0);
  cv.style.filter=filterStr();
  $('status').textContent=`${cur.width} × ${cur.height} px`;
  $('undo').disabled=!undo.length;
}
function enable(on){
  document.querySelectorAll('[data-op],[data-f],#cropBtn,#ratio,#dl,#reset').forEach(b=>b.disabled=!on);
}
function load(file){
  if(!file||!file.type.startsWith('image/')){toast('Escolha um arquivo de imagem.');return}
  const img=new Image();
  img.onload=()=>{
    const MAX=3840,s=Math.min(1,MAX/Math.max(img.naturalWidth,img.naturalHeight));
    cur=mk(Math.round(img.naturalWidth*s),Math.round(img.naturalHeight*s));cur.getContext('2d').drawImage(img,0,0,cur.width,cur.height);
    $('name').value=(file.name.replace(/\.[^.]+$/,'')||'foto')+'-editado';
    orig=clone(cur);undo=[];resetAdj();endCrop();
    $('drop').style.display='none';frame.style.display='inline-block';
    enable(true);render();URL.revokeObjectURL(img.src);
    if(s<1)toast('Foto reduzida para até 3840 px para funcionar bem no aparelho');
  };
  img.onerror=()=>toast('Não foi possível abrir essa imagem.');
  img.src=URL.createObjectURL(file);
}
function push(){undo.push(clone(cur));if(undo.length>10)undo.shift()}
function resetAdj(){
  $('br').value=$('co').value=$('sa').value=100;$('bl').value=0;fx={gray:0,sepia:0,invert:0};
  sliders.forEach(id=>$(id+'n').value=$(id).value);
}

$('file').onchange=e=>load(e.target.files[0]);
const stage=$('stage'),drop=$('drop');
['dragenter','dragover'].forEach(t=>stage.addEventListener(t,e=>{e.preventDefault();drop.classList.add('over')}));
['dragleave','drop'].forEach(t=>stage.addEventListener(t,e=>{e.preventDefault();drop.classList.remove('over')}));
stage.addEventListener('drop',e=>load(e.dataTransfer.files[0]));

document.querySelectorAll('[data-op]').forEach(b=>b.onclick=()=>{
  if(!cur)return;endCrop();push();
  const op=b.dataset.op,w=cur.width,h=cur.height;let n;
  if(op==='rl'||op==='rr'){
    n=mk(h,w);const c=n.getContext('2d');
    c.translate(h/2,w/2);c.rotate(op==='rr'?Math.PI/2:-Math.PI/2);c.drawImage(cur,-w/2,-h/2);
  }else{
    n=mk(w,h);const c=n.getContext('2d');
    if(op==='fh'){c.translate(w,0);c.scale(-1,1)}else{c.translate(0,h);c.scale(1,-1)}
    c.drawImage(cur,0,0);
  }
  cur=n;render();
});

sliders.forEach(id=>{
  const r=$(id),n=$(id+'n');
  r.oninput=()=>{n.value=r.value;cv.style.filter=filterStr()};
  n.oninput=()=>{
    const v=parseFloat(n.value);if(isNaN(v))return;
    r.value=Math.min(Math.max(v,+r.min),+r.max);cv.style.filter=filterStr();
  };
  n.onchange=()=>{if(isNaN(parseFloat(n.value)))r.value=r.defaultValue;n.value=r.value;cv.style.filter=filterStr()};
});
document.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{
  const k=b.dataset.f;fx[k]=fx[k]?0:1;
  if(fx[k]&&k==='gray')fx.sepia=0;if(fx[k]&&k==='sepia')fx.gray=0;
  cv.style.filter=filterStr();
});

$('undo').onclick=()=>{if(undo.length){cur=undo.pop();endCrop();render()}};
$('reset').onclick=()=>{if(!orig)return;push();cur=clone(orig);resetAdj();endCrop();render();toast('Foto original restaurada')};

/* recorte */
function endCrop(){crop=null;rect=null;ov.style.display='none';sel.style.display='none';$('cropOk').style.display='none';$('cropBtn').textContent='Recortar'}
$('cropBtn').onclick=()=>{
  if(crop){endCrop();return}
  crop=true;ov.style.display='block';$('cropOk').style.display='';$('cropBtn').textContent='Cancelar';
  toast('Arraste sobre a foto para escolher a área');
};
let start=null;
function pos(e){const r=cv.getBoundingClientRect();return{x:Math.min(Math.max(e.clientX-r.left,0),r.width),y:Math.min(Math.max(e.clientY-r.top,0),r.height),W:r.width,H:r.height}}
ov.onpointerdown=e=>{start=pos(e);ov.setPointerCapture(e.pointerId);drawSel(start)};
ov.onpointermove=e=>{if(start)drawSel(pos(e))};
ov.onpointerup=()=>{start=null};
function drawSel(p){
  const ratio=parseFloat($('ratio').value);
  let w=p.x-start.x,h=p.y-start.y;
  if(ratio){
    const sx=Math.sign(w)||1,sy=Math.sign(h)||1;
    let aw=Math.abs(w),ah=Math.abs(h);
    if(aw/ah>ratio)aw=ah*ratio;else ah=aw/ratio;
    const maxW=sx>0?p.W-start.x:start.x,maxH=sy>0?p.H-start.y:start.y;
    const k=Math.min(1,maxW/aw,maxH/ah);aw*=k;ah*=k;w=aw*sx;h=ah*sy;
  }
  const x=Math.min(start.x,start.x+w),y=Math.min(start.y,start.y+h);
  rect={x,y,w:Math.abs(w),h:Math.abs(h),W:p.W};
  Object.assign(sel.style,{display:'block',left:x+'px',top:y+'px',width:rect.w+'px',height:rect.h+'px'});
}
$('cropOk').onclick=()=>{
  if(!rect||rect.w<4||rect.h<4){toast('Selecione uma área maior para recortar.');return}
  const k=cur.width/rect.W;push();
  const w=Math.round(rect.w*k),h=Math.round(rect.h*k),n=mk(w,h);
  n.getContext('2d').drawImage(cur,Math.round(rect.x*k),Math.round(rect.y*k),w,h,0,0,w,h);
  cur=n;endCrop();render();toast('Recortado');
};

window.addEventListener('resize',()=>{if(cur)cv.style.filter=filterStr()});
/* download */
const hasCtxFilter=(()=>{try{
  const t=mk(1,1),c=t.getContext('2d');c.filter='invert(1)';c.fillStyle='#fff';c.fillRect(0,0,1,1);
  return c.getImageData(0,0,1,1).data[0]===0;
}catch(e){return false}})();

function blurLine(src,dst,start,stride,n,r){
  const k=2*r+1;let sum=0;
  for(let i=-r;i<=r;i++)sum+=src[start+Math.min(Math.max(i,0),n-1)*stride];
  for(let i=0;i<n;i++){
    dst[start+i*stride]=sum/k;
    sum+=src[start+Math.min(i+r+1,n-1)*stride]-src[start+Math.max(i-r,0)*stride];
  }
}
function boxBlur(d,w,h,r){
  const b=new Uint8ClampedArray(d.length);
  for(let p=0;p<3;p++){
    for(let y=0;y<h;y++)for(let ch=0;ch<4;ch++)blurLine(d,b,y*w*4+ch,4,w,r);
    for(let x=0;x<w;x++)for(let ch=0;ch<4;ch++)blurLine(b,d,x*4+ch,w*4,h,r);
  }
}
/* aplica os ajustes na foto; no Safari/iPhone (sem ctx.filter) faz pixel a pixel */
function bakeFilters(src){
  const w=src.width,h=src.height,out=mk(w,h),c=out.getContext('2d');
  if(hasCtxFilter){c.filter=filterStr(w,h);c.drawImage(src,0,0);return out}
  c.drawImage(src,0,0);
  const br=$('br').value/100,co=$('co').value/100,sa=$('sa').value/100,bl=$('bl').value/100*0.03*Math.max(w,h);
  const img=c.getImageData(0,0,w,h),d=img.data,L=d.length;
  const cl=v=>v<0?0:v>255?255:v;
  if(br!==1||co!==1||sa!==1){
    for(let i=0;i<L;i+=4){
      let r=cl(d[i]*br),g=cl(d[i+1]*br),b=cl(d[i+2]*br);
      r=cl((r-127.5)*co+127.5);g=cl((g-127.5)*co+127.5);b=cl((b-127.5)*co+127.5);
      const l=.213*r+.715*g+.072*b;
      d[i]=cl(l+(r-l)*sa);d[i+1]=cl(l+(g-l)*sa);d[i+2]=cl(l+(b-l)*sa);
    }
  }
  const rad=Math.min(Math.round(bl),Math.floor(Math.min(w,h)/2)-1);
  if(rad>=1)boxBlur(d,w,h,rad);
  if(fx.gray||fx.sepia||fx.invert){
    for(let i=0;i<L;i+=4){
      let r=d[i],g=d[i+1],b=d[i+2];
      if(fx.gray){const l=.2126*r+.7152*g+.0722*b;r=g=b=l}
      if(fx.sepia){const R=.393*r+.769*g+.189*b,G=.349*r+.686*g+.168*b,B=.272*r+.534*g+.131*b;r=cl(R);g=cl(G);b=cl(B)}
      if(fx.invert){r=255-r;g=255-g;b=255-b}
      d[i]=r;d[i+1]=g;d[i+2]=b;
    }
  }
  c.putImageData(img,0,0);
  return out;
}

function fileName(ext){
  const n=($('name').value||'').trim()
    .replace(/\.(png|jpe?g|webp)$/i,'')
    .replace(/[\\/:*?"<>|\x00-\x1f]/g,'')
    .replace(/[. ]+$/,'').slice(0,60);
  return (n||'jotaeditor')+'.'+ext;
}
$('name').onkeydown=e=>{if(e.key==='Enter'&&!$('dl').disabled)$('dl').click()};
$('dl').onclick=()=>{
  toast('Preparando a foto…');
  setTimeout(()=>{
    const type=$('fmt').value,src=bakeFilters(cur);
    let out=src;
    if(type==='image/jpeg'){
      out=mk(src.width,src.height);const c=out.getContext('2d');
      c.fillStyle='#fff';c.fillRect(0,0,out.width,out.height);c.drawImage(src,0,0);
    }
    out.toBlob(b=>{
      if(!b){toast('Não foi possível gerar a foto.');return}
      const ext=b.type.split('/')[1].replace('jpeg','jpg');
      const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=fileName(ext);
      document.body.appendChild(a);a.click();a.remove();
      setTimeout(()=>URL.revokeObjectURL(a.href),4000);toast('Foto baixada');
    },type,.92);
  },30);
};

/* instalação como app (PWA) e uso offline: só funciona em https ou localhost */
if('serviceWorker' in navigator && location.protocol.startsWith('http')){
  navigator.serviceWorker.register('sw.js').catch(()=>{});
}
