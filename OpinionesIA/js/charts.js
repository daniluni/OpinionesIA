const Charts={
  _legends:[],
  renderDona(canvasId,data){
    const canvas=document.getElementById(canvasId);
    if(!canvas)return;
    const ctx=canvas.getContext('2d');
    const rect=canvas.parentElement.getBoundingClientRect();
    const W=Math.min(rect.width-40,320);
    const H=W;
    canvas.width=W;canvas.height=H;
    const cx=W/2,cy=H/2,R=W/2-20,innerR=R*0.55;
    this._destroyLegend(canvasId);
    ctx.clearRect(0,0,W,H);
    if(!data||data.length===0||data.every(d=>d.valor===0)){
      ctx.fillStyle='#94a3b8';ctx.textAlign='center';
      ctx.font='14px sans-serif';ctx.fillText('Sin datos',cx,cy);
      return;
    }
    const total=data.reduce((s,d)=>s+d.valor,0);
    let startAngle=-Math.PI/2;
    data.forEach(d=>{
      if(d.valor===0)return;
      const sliceAngle=(d.valor/total)*Math.PI*2;
      ctx.beginPath();
      ctx.arc(cx,cy,R,startAngle,startAngle+sliceAngle);
      ctx.arc(cx,cy,innerR,startAngle+sliceAngle,startAngle,true);
      ctx.closePath();
      ctx.fillStyle=d.color;
      ctx.fill();
      startAngle+=sliceAngle;
    });
    ctx.beginPath();ctx.arc(cx,cy,innerR,0,Math.PI*2);
    ctx.fillStyle='var(--color-surface,#fff)';ctx.fill();
    ctx.fillStyle='var(--color-text,#1e293b)';ctx.textAlign='center';
    ctx.font='bold 18px sans-serif';ctx.fillText(total,cx,cy-4);
    ctx.font='12px sans-serif';ctx.fillStyle='var(--color-text-secondary,#64748b)';
    ctx.fillText('Total',cx,cy+14);
    const legend=document.createElement('div');
    legend.className='chart-legend';legend.id='legend-'+canvasId;
    legend.style.cssText='display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;justify-content:center';
    data.forEach(d=>{
      if(d.valor===0)return;
      const item=document.createElement('span');
      item.style.cssText='display:flex;align-items:center;gap:4px;font-size:11px';
      item.innerHTML='<span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:'+d.color+'"></span> '
        +Utils.escapeHtml(d.label)+' ('+d.valor+')';
      legend.appendChild(item);
    });
    canvas.parentElement.appendChild(legend);
    this._legends.push(canvasId);
  },
  renderBarras(canvasId,data){
    const canvas=document.getElementById(canvasId);
    if(!canvas)return;
    const ctx=canvas.getContext('2d');
    const rect=canvas.parentElement.getBoundingClientRect();
    const W=Math.min(rect.width-40,500);
    const H=200;
    canvas.width=W;canvas.height=H;
    ctx.clearRect(0,0,W,H);
    if(!data||data.length===0||data.every(d=>d.valor===0)){
      ctx.fillStyle='#94a3b8';ctx.textAlign='center';
      ctx.font='14px sans-serif';ctx.fillText('Sin datos',W/2,H/2);
      return;
    }
    const maxVal=Math.max(...data.map(d=>d.valor),1);
    const pad={t:20,r:10,b:30,l:10};
    const chartW=W-pad.l-pad.r;
    const chartH=H-pad.t-pad.b;
    const barW=Math.min(chartW/data.length*0.6,40);
    const gap=chartW/data.length;
    data.forEach((d,i)=>{
      const barH=(d.valor/maxVal)*(chartH-10);
      const x=pad.l+i*gap+(gap-barW)/2;
      const y=pad.t+chartH-barH;
      ctx.fillStyle='#7c3aed';
      ctx.beginPath();
      ctx.roundRect(x,y,barW,barH,4);
      ctx.fill();
      ctx.fillStyle='var(--color-text-secondary,#64748b)';
      ctx.textAlign='center';ctx.font='10px sans-serif';
      ctx.fillText(d.label||'',x+barW/2,pad.t+chartH+12);
      ctx.fillStyle='var(--color-text,#1e293b)';
      ctx.textAlign='center';ctx.font='10px sans-serif';
      ctx.fillText(d.valor,x+barW/2,y-4);
    });
  },
  _destroyLegend(id){
    const el=document.getElementById('legend-'+id);
    if(el)el.remove();
    this._legends=this._legends.filter(l=>l!==id);
  },
  destroy(){
    this._legends.forEach(id=>this._destroyLegend(id));
  }
};
