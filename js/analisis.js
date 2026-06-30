const Analisis={
  els:{},
  init(){
    this.els.filterSelect=document.getElementById('analisis-filtro-sesion');
    this.els.analizarBtn=document.getElementById('analisis-ejecutar-btn');
    this.els.clustersDiv=document.getElementById('analisis-clusters-global');
    this.els.rankingDiv=document.getElementById('analisis-ranking-global');
    this.els.minoriasDiv=document.getElementById('analisis-minorias-global');
    this.els.sentimientoDiv=document.getElementById('analisis-sentimiento-global');
    this.els.recomendacionesDiv=document.getElementById('analisis-recomendaciones');
    this._bindEvents();
  },
  _bindEvents(){
    this.els.analizarBtn.addEventListener('click',()=>this._ejecutar());
  },
  render(){
    this._populateFilter();
  },
  _populateFilter(){
    const sesiones=Store.getCollection('sesiones');
    const current=this.els.filterSelect.value;
    this.els.filterSelect.innerHTML='<option value="">Todas las sesiones</option>'+
      sesiones.map(s=>'<option value="'+s.id+'"'+(s.id===current?' selected':'')+'>'+Utils.escapeHtml(s.titulo)+'</option>').join('');
  },
  _ejecutar(){
    const sesionId=this.els.filterSelect.value;
    const ideas=sesionId?Store.getCollection('ideas').filter(i=>i.idSesion===sesionId):Store.getCollection('ideas');
    if(ideas.length<2){alert('Se necesitan al menos 2 ideas para analizar.');return}
    AIEngine._procesar(ideas);
    if(sesionId){
      const todas=Store.getCollection('ideas');
      todas.forEach(t=>{
        const act=ideas.find(i=>i.id===t.id);
        if(act)Object.assign(t,act);
      });
      Store.set('ideas',todas);
    }else{
      Store.set('ideas',ideas);
    }
    this._renderResultados(ideas);
  },
  _renderResultados(ideas){
    const clusters=AIEngine._obtenerClusters(ideas);
    const insights=AIEngine._generarInsights(ideas,clusters);
    this._renderClusters(clusters);
    this._renderRanking(ideas);
    this._renderMinorias(ideas);
    this._renderSentimiento(ideas);
    this._renderRecomendaciones(insights);
  },
  _renderClusters(clusters){
    this.els.clustersDiv.innerHTML='<div class="section-title" style="margin-top:0">📊 Clústeres Globales</div>'+
      (clusters.length>0?'<div class="cluster-list">'+clusters.map(c=>
        '<div class="cluster-item" style="border-color:'+c.color+'"><div class="cluster-header"><span style="color:'+c.color+'">■</span> '+Utils.escapeHtml(c.label)+'</div><div class="cluster-count">'+c.count+' idea'+(c.count!==1?'s':'')+'</div></div>'
      ).join('')+'</div>':'<div class="empty-state"><p>No se detectaron clusters</p></div>');
  },
  _renderRanking(ideas){
    const ranked=ideas.filter(i=>i.ai_valor>0).sort((a,b)=>b.ai_valor-a.ai_valor);
    this.els.rankingDiv.innerHTML='<div class="section-title">🏆 Ranking Unificado de Ideas</div>'+
      (ranked.length>0?'<div class="ranking-list">'+ranked.map((id,i)=>
        '<div class="ranking-item"><div class="ranking-pos">#'+(i+1)+'</div><div class="ranking-content"><div class="ranking-text">'+Utils.escapeHtml(id.contenido)+'</div></div><div class="ranking-score">'+id.ai_valor+'</div></div>'
      ).join('')+'</div>':'<div class="empty-state"><p>Ejecuta el análisis para ver el ranking</p></div>');
  },
  _renderMinorias(ideas){
    const mins=ideas.filter(i=>i.ai_esMinoritaria);
    this.els.minoriasDiv.innerHTML='<div class="section-title">🔍 Spotlight — Voces Minoritarias</div>'+
      '<p style="font-size:var(--font-size-sm);color:var(--color-text-secondary);margin-bottom:var(--space-md)">'+
      'Las voces minoritarias representan perspectivas únicas que se desvían de la opinión predominante. '+
      'Incorporarlas enriquece el debate y evita el sesgo de mayoría.</p>'+
      (mins.length>0?mins.map(id=>
        '<div class="minoria-card"><div class="minoria-label">🔍 Voz Minoritaria · Valor '+id.ai_valor+' · Novedad '+id.ai_novedad+'%</div><div class="minoria-content">"'+Utils.escapeHtml(id.contenido)+'"</div></div>'
      ).join(''):'<div class="empty-state"><p>No se detectaron voces minoritarias en los datos actuales</p></div>');
  },
  _renderSentimiento(ideas){
    const canvas=document.getElementById('chart-sentimiento');
    if(!canvas)return;
    const ctx=canvas.getContext('2d');
    const parent=canvas.parentElement;
    const W=Math.min(parent?parent.clientWidth-40:300,300);
    const H=180;
    canvas.width=W;canvas.height=H;
    ctx.clearRect(0,0,W,H);
    const pos=ideas.filter(i=>i.ai_sentimiento>0).length;
    const neg=ideas.filter(i=>i.ai_sentimiento<0).length;
    const neu=ideas.filter(i=>i.ai_sentimiento===0).length;
    const total=pos+neg+neu;
    if(total===0){
      ctx.fillStyle='#94a3b8';ctx.textAlign='center';ctx.font='14px sans-serif';ctx.fillText('Sin datos',W/2,H/2);
      return;
    }
    const barH=24,gap=12,startY=30;
    const maxVal=Math.max(pos,neg,neu,1);
    const colores=[{label:'Positivo',val:pos,color:'#16a34a'},{label:'Negativo',val:neg,color:'#dc2626'},{label:'Neutral',val:neu,color:'#94a3b8'}];
    colores.forEach((d,i)=>{
      const y=startY+i*(barH+gap);
      const bw=(d.val/maxVal)*(W-120);
      ctx.fillStyle='var(--color-text,#1e293b)';ctx.textAlign='right';ctx.font='12px sans-serif';
      ctx.fillText(d.label+' ('+d.val+')',110,y+barH/2+4);
      ctx.fillStyle=d.color;
      ctx.beginPath();ctx.roundRect(116,y,Math.max(bw,2),barH,4);ctx.fill();
      ctx.fillStyle='var(--color-text-secondary,#64748b)';ctx.textAlign='left';ctx.font='11px sans-serif';
      ctx.fillText(Math.round(d.val/total*100)+'%',116+bw+6,y+barH/2+4);
    });
  },
  _renderRecomendaciones(insights){
    this.els.recomendacionesDiv.innerHTML='<div class="section-title">💡 Recomendaciones IA</div>'+
      (insights.length>0?'<div class="insight-card"><ul style="list-style:disc;padding-left:18px">'+insights.map(i=>
        '<li style="margin-bottom:6px;font-size:var(--font-size-sm)">'+Utils.escapeHtml(i)+'</li>'
      ).join('')+'</ul></div>':'<div class="empty-state"><p>Ejecuta el análisis para generar recomendaciones</p></div>');
  }
};
