/* Original exhibition dialogue and media. No kiosk inventory swap or idle reset. */
(() => {
'use strict';
const DOGS = {
  dal:  { name:"달이", img:"assets/dal.png",  tag:"활발하고 용감한 아이",
          intro:"우리 집에서 제일 씩씩한 아이. 처음 보는 길도, 처음 보는 사람도 꼬리부터 먼저 반겨. 너처럼 기운 넘치는 사람을 기다리고 있었어!",
          line:"“오늘 하루, 달이에게 가장 신나는 시간을 선물해줘. 잘 부탁해!” — 방이" },
  kong: { name:"콩이", img:"assets/kong.png", tag:"느긋하고 온화한 아이",
          intro:"서두르는 법이 없는 아이. 콩이 옆에 있으면 시간이 천천히 흘러. 너랑 있으면 참 편안해할 거야.",
          line:"“오늘 하루, 콩이에게 가장 포근한 시간을 선물해줘. 잘 부탁해!” — 방이" },
  byul: { name:"별이", img:"assets/byul.png", tag:"섬세하고 감수성 높은 아이",
          intro:"말하지 않아도 마음을 알아채는 아이. 누가 슬픈지 제일 먼저 알고, 슬며시 옆에 와서 앉아. 분명 너랑 통할 거야.",
          line:"“오늘 하루, 별이에게 가장 다정한 시간을 선물해줘. 잘 부탁해!” — 방이" }
};
const GREETINGS = [
  "오늘 아이들에게 행복한 하루를<br/>선물해주기로 한 사람이구나!<br/>와줘서 고마워.",
  "우리 베이커리에는 행복한 시간을<br/>기다리는 친구들이 있어.",
  "너에 대해 조금 더 알려주면, 오늘 너와<br/>가장 잘 맞는 친구를 소개시켜줄게!"
];
const QUESTIONS = [
  { q:"오늘 하루는 어땠어?",
    a:[{t:"신나게 뛰어다닌 하루",s:"dal"},{t:"구름처럼 느긋한 하루",s:"kong"},{t:"생각이 많았던 하루",s:"byul"}] },
  { q:"쉬는 날엔 주로 뭐 해?",
    a:[{t:"무조건 밖으로!",s:"dal"},{t:"집에서 뒹굴뒹굴",s:"kong"},{t:"좋아하는 것에 깊이 빠지기",s:"byul"}] },
  { q:"처음 만난 친구 앞에선?",
    a:[{t:"내가 먼저 인사해",s:"dal"},{t:"웃으면서 천천히 다가가",s:"kong"},{t:"조용히 지켜봐",s:"byul"}] },
  { q:"기운 없는 날, 뭐가 제일 필요해?",
    a:[{t:"신나는 기분 전환",s:"dal"},{t:"아무것도 안 하는 시간",s:"kong"},{t:"마음 알아주는 한마디",s:"byul"}] },
  { q:"여행을 간다면 어떤 여행이 좋아?",
    a:[{t:"계획 없이 훌쩍 떠나는 여행",s:"dal"},{t:"숙소에서 푹 쉬는 여행",s:"kong"},{t:"사진과 일기로 남기는 여행",s:"byul"}] },
  { q:"친구들 사이에서 너는 어떤 사람이야?",
    a:[{t:"분위기 메이커!",s:"dal"},{t:"같이 있으면 편한 사람",s:"kong"},{t:"고민을 들어주는 사람",s:"byul"}] },
  { q:"제일 좋아하는 날씨는?",
    a:[{t:"햇살 쨍쨍한 맑은 날",s:"dal"},{t:"포근하게 흐린 날",s:"kong"},{t:"창가에서 듣는 빗소리",s:"byul"}] },
  { q:"마지막! 오늘 그 친구랑 어떤 시간을 보내주고 싶어?",
    a:[{t:"같이 신나게 달리기",s:"dal"},{t:"나란히 낮잠",s:"kong"},{t:"가만히 눈 맞추기",s:"byul"}] }
];
const REACTIONS = ["그렇구나~", "오~ 좋다!", "응응, 알 것 같아", "좋은데?", "오호 그렇단 말이지~", "점점 더 알 것 같아!", "거의 다 왔어!", "마지막까지 고마워!"];
const $=id=>document.getElementById(id), KEY='8akeryy.showcase.2026.v2';
const uuid=()=>typeof crypto.randomUUID==='function'?crypto.randomUUID():'10000000-1000-4000-8000-100000000000'.replace(/[018]/g,c=>(c^crypto.getRandomValues(new Uint8Array(1))[0]&15>>c/4).toString(16));
const fresh=()=>({answers:[],dog:null,step:0,unlocked:0,introduced:false,message:'',letterDone:false,receipt:null,wallReceipt:null,wallMode:null,letterId:uuid()});
let state=fresh(), services={photo:false,letters:false}, stage='intro', sequence=0, sceneTimer, reactionTimer, greetingIndex=0, photoData=null, resultBlob=null, resultUrl=null, photoRequest=null, photoBusy=false, photoVersion=0, letterBusy=false;
try{const saved=JSON.parse(sessionStorage.getItem(KEY));if(saved&&Array.isArray(saved.answers)&&saved.answers.length<=QUESTIONS.length&&saved.answers.every(a=>['dal','kong','byul'].includes(a))){
state.answers=saved.answers;state.introduced=saved.introduced===true;state.dog=state.answers.length===QUESTIONS.length?winner():null;
state.unlocked=state.dog?Math.max(1,Math.min(3,Number(saved.unlocked)||1)):0;state.step=Math.max(0,Math.min(state.unlocked,Number(saved.step)||0));
state.message=typeof saved.message==='string'?saved.message.slice(0,500):'';state.receipt=typeof saved.receipt==='string'?saved.receipt:null;state.wallReceipt=typeof saved.wallReceipt==='string'?saved.wallReceipt:null;state.wallMode=saved.wallMode==='local'?'local':'live';state.letterDone=saved.letterDone===true&&!!state.message.trim();state.letterId=/^[0-9a-f-]{36}$/.test(saved.letterId||'')?saved.letterId:uuid();}}
catch{}
function persist(){try{sessionStorage.setItem(KEY,JSON.stringify(state));return true;}catch{return false;}}
function winner(){const scores={dal:0,kong:0,byul:0};state.answers.forEach(a=>scores[a]++);const max=Math.max(...Object.values(scores));return [...state.answers].reverse().find(a=>scores[a]===max);}
const asset=path=>'../matching/'+path;
const focus=id=>$(id).focus({preventScroll:true});
function resetScene(){sequence++;clearTimeout(sceneTimer);clearTimeout(reactionTimer);$('scene-video').pause();$('scene-video').onended=null;$('scene-video').onerror=null;}
function scene(type,onDone){
 resetScene();const token=sequence,video=$('scene-video');$('scene-poster').src=asset('assets/'+(type==='door'?'attract.jpg':'counter.jpg'));$('scene-poster').alt=type==='door'?'베이커리 문':'카운터에서 기다리는 방이';
 if(matchMedia('(prefers-reduced-motion: reduce)').matches){video.hidden=true;if(onDone)sceneTimer=setTimeout(()=>{if(token===sequence)onDone();},400);return;}
 const files={door:'v2_door.mp4',idle:'v4_idle.mp4',think:'v5_think.mp4'};
 video.src=asset('assets/'+files[type]);video.loop=type==='idle';video.hidden=false;
 let done=false;const finish=()=>{if(done||token!==sequence)return;done=true;clearTimeout(sceneTimer);if(onDone)onDone();};
 video.onended=finish;video.onerror=()=>{video.hidden=true;finish();};video.play().catch(()=>{video.hidden=true;finish();});
 if(onDone)sceneTimer=setTimeout(finish,type==='door'?6500:7000);
}
function updateProgress(){document.querySelectorAll('[data-step]').forEach((b,i)=>{b.disabled=i>state.unlocked||photoBusy||letterBusy;if(i===state.step)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});}
function updateFriend(){document.querySelector('.companion').hidden=!state.dog;if(!state.dog)return;const dog=DOGS[state.dog];$('companion-name').textContent=dog.name;for(const id of ['companion-image','game-friend','ending-image']){$(id).src=asset(dog.img);$(id).alt=dog.name;}}
function surveyPane(name){for(const id of ['greeting','questions','thinking','match-result'])$(id).hidden=id!==name;}
let gameFrame=null,gameTimer=null;
function expandGame(expanded){
 $('game-shell').classList.toggle('expanded',expanded);
 document.body.classList.toggle('game-expanded',expanded);
 $('expand-game').setAttribute('aria-pressed',String(expanded));
 $('expand-game').textContent=expanded?'작게 보기 ↙':'크게 보기 ↗';
}
function stopGame(){
 clearTimeout(gameTimer);gameFrame?.remove();gameFrame=null;expandGame(false);
 $('game-launch').hidden=false;$('game-loading').hidden=true;$('game-error').hidden=true;
 $('sound').disabled=false;
}
function startGame(){
 stopGame();
 $('bgm').pause();$('sound').setAttribute('aria-pressed','false');$('sound').textContent='소리 켜기 ♫';$('sound').disabled=true;
 $('game-launch').hidden=true;$('game-loading').hidden=false;$('game-progress').value=0;
 $('game-load-status').textContent='친구를 만나러 가는 중… 0%';
 gameFrame=document.createElement('iframe');gameFrame.id='game-frame';gameFrame.title='8akeryy · 친구와 함께 보내는 하루';
 gameFrame.allow='autoplay; fullscreen';gameFrame.setAttribute('allowfullscreen','');
 gameFrame.src='game/index.html?v=lite-1080p-20261020';
 $('game-mount').append(gameFrame);
 gameTimer=setTimeout(()=>{
  $('game-error').hidden=false;
  $('game-error-text').textContent='불러오는 데 시간이 걸리고 있어요. 조금 더 기다리거나 다시 불러와주세요.';
 },120000);
}
$('launch-game').addEventListener('click',startGame);
$('retry-game').addEventListener('click',startGame);
$('expand-game').addEventListener('click',()=>expandGame(!$('game-shell').classList.contains('expanded')));
document.addEventListener('keydown',event=>{if(event.key==='Escape')expandGame(false);});
window.addEventListener('message',event=>{
 if(!gameFrame||event.source!==gameFrame.contentWindow||event.origin!==location.origin)return;
 const msg=event.data;if(!msg||msg.source!=='8akeryy-game')return;
 if(msg.type==='progress'&&Number.isFinite(msg.progress)){
  const value=Math.max(0,Math.min(100,Math.round(msg.progress*100)));
  $('game-progress').value=value;$('game-load-status').textContent=`친구를 만나러 가는 중… ${value}%`;
 }else if(msg.type==='ready'){
  clearTimeout(gameTimer);$('game-loading').hidden=true;$('game-error').hidden=true;
 }else if(msg.type==='error'){
  clearTimeout(gameTimer);$('game-loading').hidden=true;$('game-error').hidden=false;
  $('game-error-text').textContent='게임을 불러오지 못했어요. 연결 상태를 확인하고 다시 시도해주세요.';
 }else if(msg.type==='escape'){expandGame(false);}
});
function showStep(step,scroll=true){if(step>state.unlocked||photoBusy||letterBusy)return;if(step!==1)stopGame();resetScene();state.step=step;$('welcome').hidden=true;$('journey').hidden=true;$('experience').hidden=false;for(const [i,id] of ['survey','game','photo','letter'].entries())$(id).hidden=i!==step;$('ending').hidden=true;updateProgress();updateFriend();
 if(step===0){if(state.dog)renderResult();else if(state.introduced||state.answers.length)renderQuestions();else enterBakery();}
 if(step===2){photoControls();focus('photo-title');}if(step===1){$('game-invitation').textContent=`게임에서 ${DOGS[state.dog].name}를 골라 함께해 주세요.`;focus('game-title');}if(step===3){renderLetter();focus('letter-title');}persist();if(scroll)$('experience').scrollIntoView({block:'start'});
}
function next(step){state.unlocked=Math.max(state.unlocked,step);showStep(step);}
function enterBakery(){stage='door';surveyPane('greeting');$('greeting-text').textContent='행복한 시간을 기다리는 아이들이 있어요.';$('greeting-next').hidden=true;scene('door',()=>{greetingIndex=0;greet();});}
function greet(){stage='greeting';scene('idle');surveyPane('greeting');$('greeting-text').textContent=GREETINGS[greetingIndex].replace(/<br\s*\/?>/g,'\n');$('greeting-next').hidden=false;$('greeting-next').textContent=greetingIndex===GREETINGS.length-1?'방이에게 내 이야기 들려주기 →':'이야기 계속 듣기 →';focus('greeting-text');}
$('greeting-next').addEventListener('click',()=>{if(stage!=='greeting')return;if(++greetingIndex<GREETINGS.length)greet();else{state.introduced=true;persist();renderQuestions();}});
function renderQuestions(){stage='questions';scene('idle');surveyPane('questions');$('reaction').textContent='';const n=state.answers.length;if(n===QUESTIONS.length){think();return;}
$('question-count').textContent=`${n+1} / ${QUESTIONS.length}`;$('question-progress').value=n;$('question').textContent=QUESTIONS[n].q;$('previous-question').hidden=n===0;$('previous-question').disabled=false;$('answers').replaceChildren();
QUESTIONS[n].a.forEach(opt=>{const b=document.createElement('button');b.textContent=opt.t;b.addEventListener('click',()=>{if(stage!=='questions'||!b.isConnected)return;stage='reaction';document.querySelectorAll('#answers button').forEach(x=>x.disabled=true);$('previous-question').disabled=true;state.answers.push(opt.s);persist();$('reaction').textContent=REACTIONS[n];reactionTimer=setTimeout(()=>{if(state.answers.length===QUESTIONS.length)think();else renderQuestions();},450);});$('answers').append(b);});focus('question');}
function think(){stage='think';surveyPane('thinking');focus('thinking-title');scene('think',()=>{state.dog=winner();state.unlocked=Math.max(1,state.unlocked);persist();renderResult();updateFriend();updateProgress();});}
function renderResult(){stage='result';scene('idle');surveyPane('match-result');const d=DOGS[state.dog];$('result-image').src=asset(d.img);$('result-image').alt=d.name;$('result-name').textContent=d.name;$('result-tag').textContent=d.tag;$('result-description').textContent=d.intro;$('result-line').textContent=d.line;focus('result-name');}
$('previous-question').addEventListener('click',()=>{if(stage!=='questions')return;state.answers.pop();persist();renderQuestions();});
$('start').addEventListener('click',()=>showStep(state.step));document.querySelectorAll('[data-step]').forEach(b=>b.addEventListener('click',()=>showStep(Number(b.dataset.step))));document.querySelectorAll('[data-next]').forEach(b=>b.addEventListener('click',()=>next(Number(b.dataset.next))));$('skip-game').addEventListener('click',()=>next(2));
$('home').addEventListener('click',()=>{if(photoBusy||letterBusy)return;stopGame();resetScene();$('bgm').pause();$('sound').setAttribute('aria-pressed','false');$('sound').textContent='소리 켜기 ♫';$('experience').hidden=true;$('welcome').hidden=false;$('journey').hidden=false;$('start').textContent=state.introduced||state.answers.length?'우리의 하루 이어가기 →':'베이커리 문 열기 →';window.scrollTo({top:0});});
$('sound').addEventListener('click',async()=>{const audio=$('bgm');if(!audio.paused){audio.pause();$('sound').setAttribute('aria-pressed','false');$('sound').textContent='소리 켜기 ♫';return;}try{audio.volume=.25;await audio.play();$('sound').setAttribute('aria-pressed','true');$('sound').textContent='소리 끄기 ♫';}catch{$('sound').textContent='소리를 재생하지 못했어요';}});
document.querySelector('.nav-toggle').addEventListener('click',function(){const open=document.querySelector('.menu').classList.toggle('open');this.setAttribute('aria-expanded',String(open));this.setAttribute('aria-label',open?'메뉴 닫기':'메뉴 열기');});
async function getServices(){try{const r=await fetch('/api/showcase',{signal:AbortSignal.timeout(8000)});if(r.ok){const d=await r.json();services={photo:d.photo===true,letters:d.letters===true};}}catch{}$('photo-service').textContent=services.photo?'사진을 선택하고 동의하면 AI 기념사진을 만들 수 있어요.':'AI 포토부스를 준비하고 있어요. 기존 변환 예시를 보고 내 사진을 골라볼 수 있어요.';$('letter-consent-wrap').hidden=!services.letters;if(!services.letters){$('letter-consent').checked=false;$('submit-letter').textContent='나만 간직하기 ♡';$('letter-service').textContent='지금은 내 기기에 편지를 간직할 수 있어요. 벽에 붙이기는 준비 중이에요.';}photoControls();}
$('letter-service').textContent=location.hostname==='127.0.0.1'||location.hostname==='localhost'?'벽에 붙인 편지는 이 컴퓨터의 미리보기 아카이브에 저장돼요.':'벽에 붙이면 다른 관람객도 편지를 읽을 수 있어요. 나만 간직할 수도 있어요.';
getServices();
const image=url=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('image'));img.src=url;});
function clearPhotoResult(){if(resultUrl)URL.revokeObjectURL(resultUrl);resultUrl=null;resultBlob=null;$('photo-result').removeAttribute('src');$('photo-result').hidden=true;$('save-photo').hidden=true;$('photo-next').hidden=true;}
function photoControls(){$('generate-photo').disabled=!services.photo||!photoData||!$('photo-consent').checked||photoBusy;$('photo-input').disabled=photoBusy;$('camera-input').disabled=photoBusy;$('photo-consent').disabled=photoBusy;$('skip-photo').disabled=photoBusy;$('photo-processing').hidden=!photoBusy;$('home').disabled=photoBusy||letterBusy;updateProgress();}
async function selectPhoto(event){const file=event.target.files[0];if(!file)return;const version=++photoVersion;photoData=null;clearPhotoResult();$('photo-review').hidden=true;$('photo-selected').removeAttribute('src');photoControls();$('photo-status').textContent='사진을 준비하고 있어요…';
if(file.size>20*1024*1024||!/^image\//.test(file.type)){$('photo-status').textContent='20MB 이하의 이미지 파일을 선택해주세요.';event.target.value='';return;}
const url=URL.createObjectURL(file);try{const img=await image(url);if(version!==photoVersion)return;const canvas=document.createElement('canvas');const ratio=Math.min(1,1200/Math.max(img.width,img.height));canvas.width=Math.round(img.width*ratio);canvas.height=Math.round(img.height*ratio);const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);photoData=canvas.toDataURL('image/jpeg',.88);$('photo-selected').src=photoData;$('photo-review').hidden=false;$('photo-status').textContent=services.photo?'선택한 사진을 확인하고 AI 기념사진을 만들어주세요.':'사진을 선택했어요. AI 변환은 포토부스 연결 후 이용할 수 있어요.';}catch{if(version===photoVersion)$('photo-status').textContent='사진을 열지 못했어요. JPG 또는 PNG로 다시 선택해주세요.';}finally{URL.revokeObjectURL(url);event.target.value='';photoControls();}}
$('photo-input').addEventListener('change',selectPhoto);$('camera-input').addEventListener('change',selectPhoto);$('photo-consent').addEventListener('change',photoControls);
$('generate-photo').addEventListener('click',async()=>{if(photoBusy||!photoData||!$('photo-consent').checked||!services.photo)return;clearPhotoResult();photoBusy=true;photoRequest=new AbortController();const timer=setTimeout(()=>photoRequest?.abort(),245000);photoControls();$('photo-status').textContent='';
try{const r=await fetch('/api/showcase',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'photo',photo:photoData,consent:true}),signal:photoRequest.signal});const d=await r.json();if(!r.ok)throw new Error(d.message||'사진을 만들지 못했어요. 잠시 후 다시 시도해주세요.');if(!/^data:image\/(png|jpeg|webp);base64,/.test(d.imageUrl||''))throw new Error('완성 사진을 받지 못했어요. 다시 시도해주세요.');resultBlob=await(await fetch(d.imageUrl)).blob();resultUrl=URL.createObjectURL(resultBlob);await image(resultUrl);$('photo-result').src=resultUrl;$('photo-result').hidden=false;$('save-photo').hidden=false;$('photo-next').hidden=false;$('photo-status').textContent='강아지 친구들과 함께한 기념사진이 완성됐어요!';}
catch(e){$('photo-status').textContent=e.name==='AbortError'?'사진 기다리기를 중단했어요. 잠시 후 다시 시도하거나 편지로 이동할 수 있어요.':e.message;}
finally{clearTimeout(timer);photoBusy=false;photoRequest=null;photoControls();}});
$('cancel-photo').addEventListener('click',()=>photoRequest?.abort());
function download(blob,name){const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),60000);}
async function saveBlob(blob,name){const file=new File([blob],name,{type:blob.type});if(navigator.canShare?.({files:[file]})){try{await navigator.share({files:[file]});return;}catch(e){if(e.name==='AbortError')return;}}download(blob,name);}
$('save-photo').addEventListener('click',()=>{if(resultBlob)saveBlob(resultBlob,'8akeryy-memory.'+(resultBlob.type==='image/png'?'png':'jpg'));});
function renderLetter(){$('letter-message').value=state.message;$('letter-count').textContent=`${state.message.length} / 500`;$('letter-form').hidden=state.letterDone;$('letter-done').hidden=!state.letterDone;
$('view-posted-letter').hidden=!state.wallReceipt;if(state.letterDone){$('finished-message').textContent=state.message;$('letter-storage-status').textContent=state.wallReceipt?(state.wallMode==='local'?'미리보기 편지 벽에 붙였어요. 벽에서 내 편지를 만나보세요.':'편지 벽에 붙였어요. 다른 관람객도 이 마음을 읽을 수 있어요.'):state.receipt?'전시팀에 편지를 남겼어요. 이 마음을 이미지로도 간직해보세요.':persist()?'편지를 이 탭에 보관했어요. 탭을 닫기 전에 이미지나 텍스트로 저장해주세요.':'임시 보관을 사용할 수 없어요. 편지를 이미지나 텍스트로 저장해주세요.';}}
$('letter-message').addEventListener('input',()=>{state.message=$('letter-message').value;$('letter-count').textContent=`${state.message.length} / 500`;$('letter-message').setCustomValidity('');persist();});
$('letter-consent').addEventListener('change',()=>{$('submit-letter').textContent=$('letter-consent').checked?'벽에 붙이기 ♡':'나만 간직하기 ♡';});
$('letter-form').addEventListener('submit',async event=>{event.preventDefault();if(letterBusy)return;if(!state.message.trim()){$('letter-message').setCustomValidity('남기고 싶은 이야기를 적어주세요.');$('letter-message').reportValidity();return;}
$('letter-error').textContent='';if($('letter-consent').checked){letterBusy=true;$('submit-letter').disabled=true;$('letter-message').disabled=true;$('letter-consent').disabled=true;photoControls();
try{const r=await fetch('/api/letter-wall',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:state.letterId,message:state.message,consent:true}),signal:AbortSignal.timeout(20000)});const d=await r.json();if(!r.ok||!d.receipt)throw new Error(d.message||'편지를 보내지 못했어요.');state.wallReceipt=d.receipt;state.wallMode=d.mode==='local'?'local':'live';}
catch(e){$('letter-error').textContent=(e.message||'편지 벽에 연결하지 못했어요.')+' 글은 유지돼요. 다시 시도하거나 공개 선택을 해제하고 나만 간직할 수 있어요.';return;}
finally{letterBusy=false;$('submit-letter').disabled=false;$('letter-message').disabled=false;$('letter-consent').disabled=false;photoControls();}}
state.letterDone=true;persist();renderLetter();$('save-letter').focus({preventScroll:true});$('letter').scrollIntoView({block:'start'});});
$('edit-letter').addEventListener('click',()=>{if(state.receipt||state.wallReceipt){state.letterId=uuid();state.receipt=null;state.wallReceipt=null;$('letter-error').textContent='이미 남긴 편지는 유지돼요. 수정해서 붙이면 새 편지로 남아요.';}state.letterDone=false;persist();renderLetter();$('letter-message').focus({preventScroll:true});$('letter').scrollIntoView({block:'start'});});
$('save-letter-text').addEventListener('click',()=>download(new Blob([`${state.message}\n\n8akeryy · 기다릴게, 이름을`],{type:'text/plain;charset=utf-8'}),'8akeryy-letter.txt'));
$('save-letter').addEventListener('click',async()=>{
const button=$('save-letter');button.disabled=true;
try {
 await document.fonts.load('40px LetterPen');
 const [paper,clean]=await Promise.all([image('assets/letter-paper.png'),image('assets/letter-paper-clean.png')]), canvas=document.createElement('canvas');
 canvas.width=1000;canvas.height=1250;const ctx=canvas.getContext('2d');
 let size=40,lines=[],lineHeight=52;
 const wrap=()=>{lines=[];ctx.font=`${size}px LetterPen, sans-serif`;for(const paragraph of state.message.split('\n')){let row='';for(const char of paragraph){if(ctx.measureText(row+char).width>730){lines.push(row);row=char;}else row+=char;}lines.push(row);}};
 do {lineHeight=size*1.3;wrap();if(lines.length*lineHeight<=700)break;size-=2;}while(size>=18);
 ctx.drawImage(paper,0,0,1000,1250);ctx.save();ctx.beginPath();ctx.rect(110,375,790,787);ctx.clip();ctx.drawImage(clean,0,0,1000,1250);ctx.restore();ctx.fillStyle='#493c2d';
 ctx.font=`${size}px LetterPen, sans-serif`;lines.forEach((line,i)=>ctx.fillText(line,135,410+i*lineHeight));

 const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw new Error('save');await saveBlob(blob,'8akeryy-letter.png');
} catch {$('letter-storage-status').textContent='이미지를 저장하지 못했어요. 텍스트 저장을 이용하거나 다시 시도해주세요.';}
finally {button.disabled=false;}
});
$('finish').addEventListener('click',()=>{$('letter').hidden=true;$('ending').hidden=false;focus('ending-title');$('experience').scrollIntoView({block:'start'});});$('back-letter').addEventListener('click',()=>showStep(3));
$('restart').addEventListener('click',()=>{resetScene();state=fresh();photoVersion++;photoData=null;clearPhotoResult();$('photo-selected').removeAttribute('src');$('photo-review').hidden=true;$('photo-consent').checked=false;$('letter-consent').checked=false;$('submit-letter').textContent='나만 간직하기 ♡';$('photo-status').textContent='';$('letter-error').textContent='';persist();showStep(0);});
const archiveDialog=$('archive-dialog');let archiveTrigger=null;
function openArchive(kind,button){
 archiveTrigger=button;persist();
 $('archive-title').textContent=kind==='photos'?'그날의 손님들 · 사진 아카이브':'남겨진 마음 · 편지 아카이브';
 const frame=$('archive-frame');frame.title=kind==='photos'?'지난 전시의 AI 기념사진':'함께 남긴 편지 벽';
 frame.src=kind==='photos'?'photos/':`letters/?refresh=${Date.now()}${state.wallReceipt?'#'+state.wallReceipt:''}`;
 archiveDialog.showModal();document.body.classList.add('archive-open');
}
document.querySelectorAll('[data-open-archive]').forEach(button=>button.addEventListener('click',()=>openArchive('letters',button)));
document.querySelectorAll('[data-open-photos]').forEach(button=>button.addEventListener('click',()=>openArchive('photos',button)));
$('close-archive').addEventListener('click',()=>archiveDialog.close());
archiveDialog.addEventListener('close',()=>{document.body.classList.remove('archive-open');archiveTrigger?.focus({preventScroll:true});});
window.addEventListener('message',event=>{
 if(event.origin===location.origin&&event.source===$('archive-frame').contentWindow&&event.data?.source==='8akeryy-archive'&&event.data.type==='close')archiveDialog.close();
});
if(state.answers.length||state.introduced)$('start').textContent='우리의 하루 이어가기 →';
window.addEventListener('pagehide',()=>{$('bgm').pause();$('scene-video').pause();photoRequest?.abort();});
})();
