const AIEngine={
  _stopwords:['a','al','algo','algunas','algunos','ante','antes','aquel','aquellos','aqui','asi','aunque','bien','cada','casi','como','con','cual','cuando','que','de','del','desde','donde','dos','el','ella','ellas','ellos','en','entre','era','eran','eso','esos','esta','estaba','estado','estan','estar','este','esto','estos','etc','fue','fuera','haber','habia','hacen','hacer','hacia','hasta','hoy','la','las','le','les','lo','los','mas','me','mejor','menos','mi','mis','mucho','muchos','muy','nada','ni','no','nos','nosotros','nuevamente','nuevo','o','otro','para','pero','poco','por','porque','que','quien','quizas','se','sea','sean','ser','si','siempre','siendo','sin','sino','so','sobre','son','soy','su','sus','tal','tambien','tanto','te','tenia','tener','tiene','tienen','todo','todos','tras','tu','tus','un','una','uno','unos','usted','va','van','vamos','varios','vaya','ver','vez','y','ya','yo','x','ejemplo'],
  _positivas:['bueno','buena','excelente','genial','positivo','positiva','mejora','mejorar','mejor','bien','gran','util','eficiente','rapido','facil','innovador','creativo','valioso','agradable','motivador','colaboracion','colaborar','productivo','beneficioso','increible','fantastico','perfecto','recomendable','practico','flexible','transparente','compartir','celebrar','logros','calidad','crecimiento','oportunidad','agradece','excelente','optimo','efectivo','satisfecho','buen','grandes','positivas','proactivo'],
  _negativas:['malo','mala','pesimo','negativo','negativa','problema','problemas','dificil','lento','complejo','complicado','frustrante','tedioso','aburrido','inutil','deficiente','ineficiente','mal','falta','faltan','carencia','ausencia','peor','horrible','terrible','confuso','desordenado','ruidoso','retrabajos','extensas','extensa','largo','largas','interrupciones','errores','malos','malas','deberiamos','necesitamos','mejorar','cambiar','insuficiente','critica','criticas'],

  tokenize(texto){
    return texto.toLowerCase().replace(/[^a-záéíóúñü\s]/g,'').split(/\s+/).filter(t=>t.length>2);
  },
  quitarStopwords(tokens){
    return tokens.filter(t=>!this._stopwords.includes(t));
  },
  stem(palabra){
    if(palabra.length<5)return palabra;
    return palabra.replace(/[aios]s?$/,'').replace(/ado$/, 'ad').replace(/ido$/, 'id')
      .replace(/ción$/, 'cion').replace(/mientos?$/, 'miento').replace(/ndo$/, 'nd');
  },

  analizarSesion(idSesion){
    const ideas=Store.getCollection('ideas').filter(i=>i.idSesion===idSesion);
    if(ideas.length<2)return{ideas,clusters:[],insights:['Se necesitan al menos 2 ideas para analizar.']};
    this._procesar(ideas);
    Store.set('ideas',Store.getCollection('ideas'));
    const clusters=this._obtenerClusters(ideas);
    const insights=this._generarInsights(ideas,clusters);
    return{ideas,clusters,insights};
  },

  analizarGlobal(){
    const ideas=Store.getCollection('ideas');
    if(ideas.length<2)return{ideas,clusters:[],insights:['Se necesitan al menos 2 ideas para analizar.']};
    this._procesar(ideas);
    Store.set('ideas',Store.getCollection('ideas'));
    const clusters=this._obtenerClusters(ideas);
    const insights=this._generarInsights(ideas,clusters);
    return{ideas,clusters,insights};
  },

  _procesar(ideas){
    const tokenizados=ideas.map(id=>({id:id.id,tokens:this.quitarStopwords(this.tokenize(id.contenido)).map(t=>this.stem(t))}));
    const todosTokens=[...new Set(tokenizados.flatMap(t=>t.tokens))];
    const tfidf=this._calcularTFIDF(tokenizados,todosTokens);
    const clusters=this._clusterizar(tfidf,ideas,tokenizados);
    this._calcularNovedad(ideas,clusters);
    ideas.forEach(id=>{id.ai_sentimiento=this._analizarSentimiento(id.contenido)});
    this._calcularValorCompuesto(ideas,clusters);
    ideas.forEach(id=>{
      id.ai_esMinoritaria=id.ai_novedad>70||(clusters.find(c=>c.label===id.ai_cluster)?.count||0)<Math.ceil(ideas.length*0.2)
    });
    ideas.sort((a,b)=>b.ai_valor-a.ai_valor);
  },

  _calcularTFIDF(tokenizados,todosTokens){
    const n=tokenizados.length;
    const df={};todosTokens.forEach(t=>df[t]=0);
    tokenizados.forEach(d=>{const u=[...new Set(d.tokens)];u.forEach(t=>df[t]++)});
    return tokenizados.map(d=>{
      const vector={};
      todosTokens.forEach(t=>{
        const tf=d.tokens.filter(tk=>tk===t).length/Math.max(d.tokens.length,1);
        const idf=Math.log((n+1)/(df[t]+1))+1;
        vector[t]=tf*idf;
      });
      return{docId:d.id,vector,tokens:d.tokens};
    });
  },

  _cosSim(v1,v2){
    const keys=new Set([...Object.keys(v1),...Object.keys(v2)]);
    let dot=0,m1=0,m2=0;
    keys.forEach(k=>{
      const a=v1[k]||0,b=v2[k]||0;
      dot+=a*b;m1+=a*a;m2+=b*b;
    });
    const mag=Math.sqrt(m1)*Math.sqrt(m2);
    return mag===0?0:dot/mag;
  },

  _clusterizar(tfidf,ideas,tokenizados){
    const clusters=[];const asignaciones={};
    for(let i=0;i<tfidf.length;i++){
      const vector=tfidf[i].vector;
      let mejorCluster=-1,mejorSim=0.12;
      for(let c=0;c<clusters.length;c++){
        const centro=clusters[c].centroid;
        const sim=this._cosSim(vector,centro);
        if(sim>mejorSim){mejorSim=sim;mejorCluster=c}
      }
      const tokensFrec={};
      tfidf[i].tokens.forEach(t=>{tokensFrec[t]=(tokensFrec[t]||0)+1});
      const palabraClave=Object.entries(tokensFrec).sort((a,b)=>b[1]-a[1]).slice(0,3).map(e=>e[0]).join(' ');
      if(mejorCluster===-1){
        asignaciones[tfidf[i].docId]=clusters.length;
        clusters.push({id:clusters.length,label:'Cluster '+clusters.length,centroid:{...vector},words:palabraClave,count:1,ids:[tfidf[i].docId]});
      }else{
        asignaciones[tfidf[i].docId]=mejorCluster;
        clusters[mejorCluster].count++;
        clusters[mejorCluster].ids.push(tfidf[i].docId);
        clusters[mejorCluster].words=palabraClave;
        Object.keys(vector).forEach(k=>{clusters[mejorCluster].centroid[k]=(clusters[mejorCluster].centroid[k]||0)+vector[k]});
      }
    }
    clusters.forEach(c=>{
      const n=c.count;
      if(n>0)Object.keys(c.centroid).forEach(k=>c.centroid[k]/=n);
    });
    const colores=['#7c3aed','#e74c3c','#10b981','#f59e0b','#3b82f6','#ec4899','#14b8a6','#8b5cf6','#f97316','#06b6d4'];
    const temas=['Automatización y Optimización','Comunicación y Colaboración','Bienestar y Cultura','Procesos y Metodologías','Crecimiento y Capacitación','Infraestructura y Herramientas','Liderazgo y Reconocimiento','Innovación y Creatividad','Calidad y Estándares','Otros'];
    clusters.forEach(c=>{
      c.id!==undefined&&(c.label=c.count>=3?temas[c.id%temas.length]:'Voz Singular: '+c.words.slice(0,25));
      c.color=colores[c.id%colores.length];
    });
    ideas.forEach(id=>{id.ai_cluster=clusters[asignaciones[id.id]]?.label||'Indefinido'});
    return clusters;
  },

  _obtenerClusters(ideas){
    const grupos={};
    ideas.forEach(id=>{
      if(!grupos[id.ai_cluster])grupos[id.ai_cluster]={label:id.ai_cluster,count:0,ids:[]};
      grupos[id.ai_cluster].count++;
      grupos[id.ai_cluster].ids.push(id.id);
    });
    const colores=['#7c3aed','#e74c3c','#10b981','#f59e0b','#3b82f6','#ec4899','#14b8a6','#8b5cf6','#f97316','#06b6d4'];
    let ci=0;
    return Object.values(grupos).map(g=>{g.color=colores[ci++%colores.length];return g});
  },

  _calcularNovedad(ideas,clusters){
    const total=ideas.length;
    const menores=clusters.filter(c=>c.count<3);
    ideas.forEach(id=>{
      const cluster=clusters.find(c=>c.label===id.ai_cluster);
      const tam=cluster?.count||1;
      const rareza=1-(tam/total);
      const singulares=menores.some(c=>c.label===id.ai_cluster);
      id.ai_novedad=Math.round(Math.min(100,Math.max(0,(rareza*60+(singulares?40:0))*100)));
    });
  },

  _analizarSentimiento(texto){
    const tokens=this.tokenize(texto);
    let pos=0,neg=0;
    tokens.forEach(t=>{
      if(this._positivas.includes(t))pos++;
      else if(this._negativas.includes(t))neg++;
    });
    const total=pos+neg;
    if(total===0)return 0;
    return Number(((pos-neg)/total).toFixed(2));
  },

  _calcularValorCompuesto(ideas,clusters){
    const total=ideas.length;
    ideas.forEach(id=>{
      const cluster=clusters.find(c=>c.label===id.ai_cluster);
      const tam=cluster?.count||1;
      const nov=id.ai_novedad/100;
      const sent=Math.abs(id.ai_sentimiento);
      const esMin=tam<Math.ceil(total*0.2);
      const boomMin=esMin?0.3:0;
      const relevancia=1-(tam/total);
      const valor=(nov*0.35+sent*0.15+relevancia*0.2+boomMin*0.3)*100;
      id.ai_valor=Math.round(Math.min(100,Math.max(0,valor)));
    });
  },

  _generarInsights(ideas,clusters){
    const insights=[];
    const top=ideas.filter(i=>i.ai_valor>0).sort((a,b)=>b.ai_valor-a.ai_valor).slice(0,3);
    if(top.length>0)insights.push('Top ideas valiosas: '+top.map(i=>'"'+i.contenido.slice(0,50)+'..."').join(', '));
    const minoritarias=ideas.filter(i=>i.ai_esMinoritaria);
    if(minoritarias.length>0)insights.push('Se detectaron '+minoritarias.length+' voces minoritarias con perspectivas únicas que enriquecen el debate.');
    const grandes=clusters.filter(c=>c.count>=Math.ceil(ideas.length*0.3));
    if(grandes.length>0)insights.push('Tema predominante: "'+grandes[0].label+'" con '+grandes[0].count+' aportes, considerar explorar sub-temas dentro de esta línea.');
    const positivas=ideas.filter(i=>i.ai_sentimiento>0.3).length;
    const negativas=ideas.filter(i=>i.ai_sentimiento<-0.3).length;
    if(positivas>negativas*1.5)insights.push('El sentimiento general es positivo ('+positivas+' positivas vs '+negativas+' críticas), buen indicador de clima organizacional.');
    else if(negativas>positivas*1.5)insights.push('Predominan las opiniones críticas. Se recomienda sesión focalizada para abordar las preocupaciones detectadas.');
    else insights.push('Balance de sentimiento equilibrado entre visiones positivas y críticas constructivas.');
    const singulares=clusters.filter(c=>c.count===1);
    if(singulares.length>0)insights.push(singulares.length+' ideas singulares no agrupadas — cada una representa una perspectiva única que merece atención.');
    insights.push('Se recomienda compartir estos resultados con el equipo para fomentar transparencia y enriquecer la discusión.');
    return insights;
  }
};
