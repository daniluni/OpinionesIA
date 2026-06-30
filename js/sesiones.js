const Sesiones={
  els:{},selectedId:null,editId:null,
  init(){
    this.els.modal=document.getElementById('sesion-modal');
    this.els.form=document.getElementById('sesion-form');
    this.els.openBtn=document.getElementById('sesion-nuevo-btn');
    this.els.closeBtn=this.els.modal.querySelector('.modal-close');
    this.els.cancelBtn=this.els.modal.querySelector('.btn--ghost');
    this.els.modalTitle=this.els.modal.querySelector('.modal-header h2');
    this.els.tableBody=document.getElementById('sesiones-tbody');
    this.els.detalle=document.getElementById('sesion-detalle');
    this.els.detalleTitle=document.getElementById('sesion-detalle-title');
    this.els.ideaForm=document.getElementById('idea-form');
    this.els.ideaText=document.getElementById('idea-contenido');
    this.els.ideaBtn=document.getElementById('idea-btn');
    this.els.ideasLista=document.getElementById('ideas-lista');
    this.els.ideaCount=document.getElementById('idea-count');
    this.els.analisisBtn=document.getElementById('sesion-analizar-btn');
    this.els.analisisSection=document.getElementById('sesion-analisis');
    this.els.analisisClusters=document.getElementById('analisis-clusters');
    this.els.analisisTop=document.getElementById('analisis-top');
    this.els.analisisMinorias=document.getElementById('analisis-minorias');
    this._bindEvents();
  },
  _bindEvents(){
    this.els.openBtn.addEventListener('click',()=>this._openModal());
    this.els.closeBtn.addEventListener('click',()=>this._closeModal());
    this.els.cancelBtn.addEventListener('click',()=>this._closeModal());
    this.els.modal.addEventListener('click',e=>{if(e.target===this.els.modal)this._closeModal()});
    this.els.form.addEventListener('submit',e=>{e.preventDefault();this._saveSesion()});
    this.els.ideaBtn.addEventListener('click',()=>this._aportarIdea());
    this.els.analisisBtn.addEventListener('click',()=>this._ejecutarAnalisis());
  },
  render(){
    this._renderSesiones();
    if(this.selectedId)this._renderDetalle(this.selectedId);
  },
  _renderSesiones(){
    const sesiones=Store.getCollection('sesiones');
    if(sesiones.length===0){
      this.els.tableBody.innerHTML='<tr><td colspan="5"><div class="empty-state"><p>No hay sesiones creadas</p></div></td></tr>';
      return;
    }
    const ideas=Store.getCollection('ideas');
    this.els.tableBody.innerHTML=sesiones.map(s=>{
      const count=ideas.filter(i=>i.idSesion===s.id).length;
      const tb='tipo-badge--'+s.tipo;
      const eb='estado-badge--'+s.estado;
      const isSel=this.selectedId===s.id;
      return '<tr class="'+(isSel?'selected ':'')+'clickable" data-select="'+s.id+'">'+
        '<td>'+Utils.escapeHtml(s.titulo)+'</td>'+
        '<td><span class="tipo-badge '+tb+'">'+s.tipo+'</span></td>'+
        '<td><span class="estado-badge '+eb+'">'+s.estado+'</span></td>'+
        '<td>'+count+'</td>'+
        '<td><button class="btn btn--ghost btn--sm" data-edit="'+s.id+'">✏️</button><button class="btn btn--ghost btn--sm" data-delete="'+s.id+'">🗑️</button></td>'+
        '</tr>';
    }).join('');
    this.els.tableBody.querySelectorAll('[data-select]').forEach(tr=>{
      tr.addEventListener('click',e=>{
        if(e.target.closest('button'))return;
        this.selectedId=tr.dataset.select;
        this._renderDetalle(this.selectedId);
        this._renderSesiones();
      });
    });
    this.els.tableBody.querySelectorAll('[data-edit]').forEach(btn=>{
      btn.addEventListener('click',e=>{e.stopPropagation();const s=Store.getById('sesiones',btn.dataset.edit);if(s)this._openModal(s)});
    });
    this.els.tableBody.querySelectorAll('[data-delete]').forEach(btn=>{
      btn.addEventListener('click',e=>{
        e.stopPropagation();
        if(confirm('¿Eliminar esta sesión y todas sus ideas?')){
          Store.removeFromCollection('sesiones',btn.dataset.delete);
          const restantes=Store.getCollection('ideas').filter(i=>i.idSesion!==btn.dataset.delete);
          Store.set('ideas',restantes);
          if(this.selectedId===btn.dataset.delete){this.selectedId=null;this.els.detalle.classList.add('hidden')}
          document.dispatchEvent(new CustomEvent('data:change'));
        }
      });
    });
  },
  _renderDetalle(id){
    const sesion=Store.getById('sesiones',id);
    if(!sesion){this.els.detalle.classList.add('hidden');return}
    this.els.detalle.classList.remove('hidden');
    this.els.detalleTitle.innerHTML='<strong>'+Utils.escapeHtml(sesion.titulo)+'</strong> <span class="tipo-badge tipo-badge--'+sesion.tipo+'">'+sesion.tipo+'</span> <span class="estado-badge estado-badge--'+sesion.estado+'">'+sesion.estado+'</span>';
    const meta=document.getElementById('sesion-meta');
    meta.innerHTML='<div class="sesion-meta-item"><strong>Descripción:</strong> '+Utils.escapeHtml(sesion.descripcion||'Sin descripción')+'</div>'+
      '<div class="sesion-meta-item"><strong>Tema:</strong> '+Utils.escapeHtml(sesion.tema||'No especificado')+'</div>'+
      '<div class="sesion-meta-item"><strong>Creada:</strong> '+Utils.formatDateShort(sesion.fechaCreacion)+'</div>';
    if(sesion.estado==='activa'){
      this.els.ideaForm.classList.remove('hidden');
    }else{
      this.els.ideaForm.classList.add('hidden');
    }
    this._renderIdeas(id);
  },
  _renderIdeas(idSesion){
    const ideas=Store.getCollection('ideas').filter(i=>i.idSesion===idSesion);
    this.els.ideaCount.textContent=ideas.length;
    if(ideas.length===0){
      this.els.ideasLista.innerHTML='<div class="empty-state"><p>Aún no hay ideas en esta sesión</p></div>';
      return;
    }
    this.els.ideasLista.innerHTML=ideas.slice().sort((a,b)=>b.fechaCreacion.localeCompare(a.fechaCreacion)).map(id=>{
      let badges='';
      if(id.ai_valor>0){
        const vl=id.ai_valor>=70?'alta':id.ai_valor>=40?'media':'buena';
        badges+='<span class="idea-badge idea-badge--'+vl+'">⭐ '+id.ai_valor+'</span>';
      }
      if(id.ai_esMinoritaria)badges+='<span class="idea-badge idea-badge--minoritaria">🔍 Voz Minoritaria</span>';
      if(id.ai_cluster)badges+='<span class="idea-badge idea-badge--cluster">🏷️ '+Utils.escapeHtml(id.ai_cluster.slice(0,25))+'</span>';
      const sent=id.ai_sentimiento;
      if(sent!==0)badges+='<span class="idea-badge '+(sent>0?'idea-badge--buena':sent<0?'idea-badge--alta':'')+'">'+(sent>0?'😊 Positivo':sent<0?'😟 Crítico':'😐 Neutro')+'</span>';
      return '<div class="idea-card"><div class="contenido">'+Utils.escapeHtml(id.contenido)+'</div><div class="badges">'+badges+'</div></div>';
    }).join('');
  },
  _aportarIdea(){
    if(!this.selectedId)return;
    const contenido=this.els.ideaText.value.trim();
    if(!contenido){alert('Escribe tu idea antes de aportar.');return}
    Store.addToCollection('ideas',Models.crearIdea({idSesion:this.selectedId,contenido}));
    this.els.ideaText.value='';
    this._renderIdeas(this.selectedId);
    document.dispatchEvent(new CustomEvent('data:change'));
  },
  _ejecutarAnalisis(){
    if(!this.selectedId)return;
    const resultado=AIEngine.analizarSesion(this.selectedId);
    this.els.analisisSection.classList.remove('hidden');
    this._renderAnalisis(resultado);
    this._renderIdeas(this.selectedId);
  },
  _renderAnalisis(resultado){
    const{clusters,insights}=resultado;
    this.els.analisisClusters.innerHTML='<div class="section-title" style="font-size:var(--font-size-md);margin-top:0">📊 Clusters Identificados</div>'+
      (clusters.length>0?'<div class="cluster-list">'+clusters.map(c=>
        '<div class="cluster-item" style="border-color:'+c.color+'"><div class="cluster-header"><span style="color:'+c.color+'">■</span> '+Utils.escapeHtml(c.label)+'</div><div class="cluster-count">'+c.count+' idea'+(c.count!==1?'s':'')+'</div></div>'
      ).join('')+'</div>':'<div class="empty-state"><p>No se pudieron identificar clusters</p></div>');
    const ideas=Store.getCollection('ideas').filter(i=>i.idSesion===this.selectedId&&i.ai_valor>0).sort((a,b)=>b.ai_valor-a.ai_valor);
    this.els.analisisTop.innerHTML='<div class="section-title" style="font-size:var(--font-size-md)">🏆 Top Ideas Más Valiosas</div>'+
      (ideas.length>0?'<div class="ranking-list">'+ideas.slice(0,5).map((id,i)=>
        '<div class="ranking-item"><div class="ranking-pos">#'+(i+1)+'</div><div class="ranking-content"><div class="ranking-text">'+Utils.escapeHtml(id.contenido)+'</div></div><div class="ranking-score">'+id.ai_valor+'</div></div>'
      ).join('')+'</div>':'<div class="empty-state"><p>Ejecuta el análisis para ver resultados</p></div>');
    const minoritarias=Store.getCollection('ideas').filter(i=>i.idSesion===this.selectedId&&i.ai_esMinoritaria);
    this.els.analisisMinorias.innerHTML='<div class="section-title" style="font-size:var(--font-size-md)">🔍 Voces Minoritarias Destacadas</div>'+
      (minoritarias.length>0?minoritarias.map(id=>
        '<div class="minoria-card"><div class="minoria-label">🔍 Voz Minoritaria · Valor '+id.ai_valor+'</div><div class="minoria-content">"'+Utils.escapeHtml(id.contenido)+'"</div></div>'
      ).join(''):'<div class="empty-state"><p>No se detectaron voces minoritarias en esta sesión</p></div>');
  },
  _openModal(sesion){
    this.editId=sesion?sesion.id:null;
    this.els.modalTitle.textContent=sesion?'Editar Sesión':'Nueva Sesión';
    document.getElementById('ses-titulo').value=sesion?sesion.titulo:'';
    document.getElementById('ses-descripcion').value=sesion?sesion.descripcion:'';
    document.getElementById('ses-tipo').value=sesion?sesion.tipo:'brainstorming';
    document.getElementById('ses-tema').value=sesion?sesion.tema:'';
    document.getElementById('ses-estado').value=sesion?sesion.estado:'activa';
    this.els.modal.classList.add('active');
  },
  _closeModal(){
    this.els.modal.classList.remove('active');
    this.editId=null;
    this.els.form.reset();
  },
  _saveSesion(){
    const data={
      titulo:document.getElementById('ses-titulo').value,
      descripcion:document.getElementById('ses-descripcion').value,
      tipo:document.getElementById('ses-tipo').value,
      tema:document.getElementById('ses-tema').value,
      estado:document.getElementById('ses-estado').value,
    };
    if(!data.titulo||!data.tipo){alert('Completa los campos obligatorios.');return}
    if(this.editId){
      Store.updateInCollection('sesiones',this.editId,data);
    }else{
      Store.addToCollection('sesiones',Models.crearSesion(data));
    }
    this._closeModal();
    document.dispatchEvent(new CustomEvent('data:change'));
  }
};
