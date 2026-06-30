const Dashboard={
  els:{},
  init(){
    this.els.totalCard=document.getElementById('dash-total');
    this.els.ideasCard=document.getElementById('dash-ideas');
    this.els.activasCard=document.getElementById('dash-activas');
    this.els.participacionCard=document.getElementById('dash-participacion');
    this.els.insightsDiv=document.getElementById('dash-insights');
  },
  render(){
    const sesiones=Store.getCollection('sesiones');
    const ideas=Store.getCollection('ideas');
    const totalSesiones=sesiones.length;
    const totalIdeas=ideas.length;
    const activas=sesiones.filter(s=>s.estado==='activa').length;
    const participacion=activas>0?Math.round(totalIdeas/activas):0;
    this.els.totalCard.innerHTML='<div class="card-label">Sesiones Creadas</div><div class="card-value">'+totalSesiones+'</div>';
    this.els.ideasCard.innerHTML='<div class="card-label">Ideas Registradas</div><div class="card-value">'+totalIdeas+'</div>';
    this.els.activasCard.innerHTML='<div class="card-label">Sesiones Activas</div><div class="card-value">'+activas+'</div>';
    this.els.participacionCard.innerHTML='<div class="card-label">Índice Participación</div><div class="card-value">'+participacion+'</div>';
    this._renderCharts(sesiones,ideas);
    this._renderInsights(sesiones,ideas);
  },
  _renderCharts(sesiones,ideas){
    const colores={'brainstorming':'#7c3aed','retrospectiva':'#3b82f6','evaluacion':'#ec4899'};
    const porTipo=Object.values(sesiones.reduce((acc,s)=>{
      if(!acc[s.tipo])acc[s.tipo]={label:s.tipo,valor:0,color:colores[s.tipo]||'#94a3b8'};
      acc[s.tipo].valor++;
      return acc;
    },{}));
    Charts.renderDona('chart-dona-tipo',porTipo);
    const porSesion=sesiones.map(s=>({
      label:s.titulo.slice(0,20)+'...',
      valor:ideas.filter(i=>i.idSesion===s.id).length,
      color:colores[s.tipo]||'#94a3b8'
    }));
    Charts.renderBarras('chart-barras-ses',porSesion);
  },
  _renderInsights(sesiones,ideas){
    if(ideas.length<2){
      this.els.insightsDiv.innerHTML='<div class="empty-state"><p>Agrega más ideas para generar insights IA</p></div>';
      return;
    }
    const resultado=AIEngine.analizarGlobal();
    let html='<div class="insight-card"><p><strong>🧠 Resumen IA Global</strong></p><ul style="list-style:disc;padding-left:18px;margin-top:8px">';
    resultado.insights.forEach(ins=>{html+='<li style="margin-bottom:4px;font-size:var(--font-size-sm)">'+Utils.escapeHtml(ins)+'</li>'});
    html+='</ul></div>';
    if(resultado.clusters.length>0){
      html+='<div style="margin-top:var(--space-md)"><p><strong>Clusters detectados:</strong></p><div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px">';
      resultado.clusters.forEach(c=>{
        html+='<span style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:999px;font-size:.75rem;font-weight:600;background:'+c.color+'20;color:'+c.color+'">'
          +'<span style="width:8px;height:8px;border-radius:2px;background:'+c.color+'"></span>'
          +Utils.escapeHtml(c.label)+' ('+c.count+')</span>';
      });
      html+='</div></div>';
    }
    this.els.insightsDiv.innerHTML=html;
  }
};
