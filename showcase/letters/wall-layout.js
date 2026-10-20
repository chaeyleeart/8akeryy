(function(root){
  function seedFor(id){let h=2166136261;for(const ch of id){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
  function random(seed){return function(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
  function layout(ids,width){
    const columns=width>=1250?5:width>=920?4:width>=600?3:2;
    const padding=width<600?19:38,step=(width-padding*2)/columns;
    const heights=Array.from({length:columns},(_,i)=>padding+((i*71)%113)*step/270);
    const cards=ids.map((id,i)=>{
      const rand=random(seedFor(id)),col=i%columns,w=step*(.97+rand()*.14),h=w*1326/1033;
      const angle=(rand()-.5)*26;
      const x=Math.max(padding*.72,Math.min(width-w-padding*.72,padding+col*step+(rand()-.5)*step*.17));
      const y=heights[col]+rand()*step*.06;
      heights[col]=y+h*(.84+rand()*.12);
      return {id,x,y,width:w,height:h,angle,z:2+Math.floor(rand()*12)};
    });
    return {columns,cards,height:Math.max(0,...cards.map(c=>c.y+c.height))+step*.27+padding};
  }
  const api={seedFor,random,layout};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.LetterWallLayout=api;
})(typeof globalThis!=='undefined'?globalThis:this);
