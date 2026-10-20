(() => {
const {seedFor,random,layout}=LetterWallLayout;
const el=id=>document.getElementById(id),byId=new Map(data.letters.map(r=>[r.id,r]));
const samples=[...new Set(['A03','B06','C01','D35','E29',...data.letters.map(r=>r.id)])].slice(0,24);
const esc=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dogs=['../../characters/ddal_front.png','../../characters/brown_front.png','../../characters/grey_front.png','../../characters/minhebang_front.png'];
let all=true,font='Gaegu',lastTrigger=null,sizeScale=1,positions=[];
const fontButtons={};
function paper(r){return `<div class="paper" data-id="${r.id}"><img src="../assets/letter-paper.png" alt="" draggable="false"><img class="paper-clean" src="../assets/letter-paper-clean.png" alt="" draggable="false"><div class="ink" aria-label="${esc(r.display_text)}"></div></div>`;}
function attached(r,i){const seed=seedFor(r.id);return `<img class="attached-sticker ${i%3===0?'sticker-right':'sticker-top'}" src="${dogs[seed%4]}" alt="" draggable="false">`+(i%3===1?`<img class="attached-sticker sticker-bottom" src="${dogs[(seed+1)%4]}" alt="" draggable="false">`:'');}
function paw(i){const color=i%2?'#d695aa':'#674548';return `<svg viewBox="0 0 100 100" aria-hidden="true"><ellipse cx="50" cy="51" rx="47" ry="46" fill="#fff7ed"/><g fill="${color}" transform="rotate(-15 50 50)"><ellipse cx="23" cy="39" rx="10" ry="14" transform="rotate(-25 23 39)"/><ellipse cx="42" cy="24" rx="10" ry="14"/><ellipse cx="65" cy="26" rx="10" ry="14" transform="rotate(15 65 26)"/><ellipse cx="81" cy="45" rx="9" ry="13" transform="rotate(28 81 45)"/><path d="M30 62C33 48 44 42 53 44C66 45 68 55 75 66C84 85 64 88 53 82C43 88 23 84 27 70Z"/></g></svg>`;}
function stickers(){el('wall').querySelectorAll('.wall-sticker').forEach(n=>n.remove());const wallWidth=el('wall').clientWidth;const items=positions.filter((_,i)=>i%3===1);for(const [i,p] of items.entries()){const size=Math.max(38,p.width*(i%3===0?.30:.24)),x=Math.max(5,Math.min(wallWidth-size-5,p.x+p.width*(i%2?.88:-.02))),y=p.y+p.height*(i%2?.82:.15);const sticker=document.createElement('div');sticker.className='wall-sticker '+(i%3===0?'paw':i%3===1?'logo':'dog');sticker.setAttribute('aria-hidden','true');sticker.style.cssText=`left:${x}px;top:${y}px;width:${size}px;--turn:${[-21,14,28,-11][i%4]}deg`;sticker.innerHTML=i%3===0?paw(i):`<img src="${i%3===1?'../../brand/mainlogo.png':dogs[(i+2)%4]}" alt="" draggable="false">`;el('wall').appendChild(sticker);}}
function arrange(){const cards=[...el('wall').querySelectorAll('.letter-card')],result=layout(cards.map(c=>c.dataset.id),el('wall').clientWidth);positions=result.cards;cards.forEach((card,i)=>{const p=positions[i];card.style.cssText=`left:${p.x}px;top:${p.y}px;width:${p.width}px;z-index:${p.z};--tilt:${p.angle}deg`;});el('wall').style.height=result.height+'px';stickers();fitAll();}
function render(){const rows=all?data.letters:samples.map(id=>byId.get(id));el('wall').innerHTML=rows.map((r,i)=>`<figure class="letter-card" data-id="${r.id}"><button class="paper-button" data-open="${r.id}" aria-label="${r.id} 편지 크게 읽기">${paper(r)}${attached(r,i)}</button><figcaption><span>${r.createdAt?'새로 붙인 편지':'LETTER '+String(data.letters.indexOf(r)+1).padStart(2,'0')}</span></figcaption></figure>`).join('');el('count').textContent=all?`벽에 남긴 ${rows.length}편`:`${rows.length}편 둘러보기 · 전체 ${data.total}편`;arrange();}
function fit(p){const r=byId.get(p.dataset.id),width=p.clientWidth;if(!width)return;const rand=random(seedFor(r.id)),short=r.display_text.length<30,top=(short?36:31)+rand()*6,left=15+rand()*3,ink=p.querySelector('.ink');const style=seedFor(r.id)%4;ink.style.cssText=`top:${top}%;left:${left}%;width:${84-left}%;transform:rotate(${(rand()-.5)*7}deg);line-height:${1.24+rand()*.22};text-align:${style===0?'right':'center'}`;
ink.innerHTML=r.display_text.split('\n').map(line=>{const dx=(rand()-.5)*.36,lean=(rand()-.5)*3.8,scale=.96+rand()*.08;return `<span class="ink-line" style="--dx:${dx}em;--lean:${lean}deg;--letter-size:${scale}em">${esc(line)||'&#8203;'}</span>`;}).join('');
let size=width*(short?.087:r.display_text.length>90?.055:.068)*sizeScale*(font==='SingleDay'?.90:1);ink.style.fontSize=size+'px';const availableHeight=p.clientHeight*(.87-top/100);while((ink.scrollHeight>availableHeight||ink.scrollWidth>ink.clientWidth+2)&&size>width*.025){size*=.96;ink.style.fontSize=size+'px';}}
function fitAll(){document.querySelectorAll('.paper').forEach(fit);}
async function choose(next){font=next;document.documentElement.style.setProperty('--hand',font);for(const [family,id] of Object.entries(fontButtons))el(id).setAttribute('aria-pressed',String(font===family));try{const loaded=await document.fonts.load(`24px ${next}`,'사랑해');if(font!==next)return;if(!loaded.length)throw new Error('font');el('font-status').textContent='편지와 스티커를 겹쳐 붙였어요. 편지를 누르면 크게 읽을 수 있어요.';el('font-status').classList.remove('font-error');}catch{if(font!==next)return;el('font-status').textContent='손글씨 폰트를 불러오지 못했어요. fonts 폴더와 함께 열어주세요.';el('font-status').classList.add('font-error');}fitAll();}
for(const [family,id] of Object.entries(fontButtons))el(id).onclick=()=>choose(family);
el('size').oninput=e=>{sizeScale=Number(e.target.value)/100;el('size-label').textContent=e.target.value+'%';fitAll();};;
el('wall').onclick=e=>{const button=e.target.closest('[data-open]');if(!button)return;const r=byId.get(button.dataset.open);lastTrigger=button;el('dialog-title').textContent=r.createdAt?'새로 붙인 마음':`LETTER ${String(data.letters.indexOf(r)+1).padStart(2,'0')} · 남겨진 마음`;el('detail-paper').innerHTML=paper(r);el('detail-text').textContent=r.display_text;el('detail').showModal();fitAll();};
el('close').onclick=()=>el('detail').close();el('detail').addEventListener('close',()=>lastTrigger?.focus());el('detail').addEventListener('keydown',e=>{if(e.key==='Escape')e.stopPropagation();});el('detail').addEventListener('click',e=>{if(e.target===el('detail')){const b=el('detail').getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)el('detail').close();}});
let oldWidth=0;new ResizeObserver(entries=>{const width=entries[0].contentRect.width;if(Math.abs(width-oldWidth)>.5){oldWidth=width;arrange();}}).observe(el('wall'));window.addEventListener('resize',fitAll);render();choose(font);

async function loadWall(){
 const incoming=[];let cursor=null;
 try{
  do{
   const response=await fetch('/api/letter-wall'+(cursor?'?cursor='+encodeURIComponent(cursor):''),{cache:'no-store',signal:AbortSignal.timeout(20000)});
   if(!response.ok)throw new Error('load');
   const page=await response.json();
   for(const row of page.letters||[]){if(typeof row.id==='string'&&/^[a-f0-9-]{36}$/i.test(row.id)&&typeof row.display_text==='string'&&row.display_text.length<=500&&!byId.has(row.id)){byId.set(row.id,row);incoming.push(row);}}
   cursor=page.cursor||null;
  }while(cursor);
  incoming.sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||''));
  data.letters.unshift(...incoming);data.total=data.letters.length;render();
  el('wall-status').textContent=incoming.length?`지난 편지 89편 · 새로 붙인 마음 ${incoming.length}편`:'';
  const target=decodeURIComponent(location.hash.slice(1));
  if(target&&byId.has(target)){const card=[...el('wall').querySelectorAll('.letter-card')].find(c=>c.dataset.id===target);card?.classList.add('just-posted');card?.scrollIntoView({block:'center'});}
 }catch{el('wall-status').textContent='지난 편지 89편을 먼저 보여드려요. 새 편지는 연결 후 다시 확인해주세요.';}
}
loadWall();
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!el('detail').open&&window.parent!==window){window.parent.postMessage({source:'8akeryy-archive',type:'close'},location.origin);}});
})();
