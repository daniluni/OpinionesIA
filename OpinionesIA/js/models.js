const Models={
  PRESET_SESIONES:[
    {id:'ses-1',titulo:'Lluvia de Ideas — Mejora de Procesos',descripcion:'Propuestas para optimizar procesos operativos y administrativos usando tecnología',tipo:'brainstorming',tema:'mejora procesos automatizacion',estado:'activa',fechaCreacion:'2026-06-01T10:00:00'},
    {id:'ses-2',titulo:'Retrospectiva Sprint Q2',descripcion:'Análisis del desempeño del equipo en el segundo trimestre y mejoras para Q3',tipo:'retrospectiva',tema:'retrospectiva sprint agile',estado:'activa',fechaCreacion:'2026-06-10T14:00:00'},
    {id:'ses-3',titulo:'Evaluación Clima Laboral 2026',descripcion:'Encuesta anónima para evaluar el ambiente laboral y detectar áreas de mejora',tipo:'evaluacion',tema:'clima laboral ambiente bienestar',estado:'cerrada',fechaCreacion:'2026-05-15T09:00:00'},
  ],
  PRESET_IDEAS:[
    {idSesion:'ses-1',contenido:'Implementar automatización de tareas repetitivas usando RPA para liberar tiempo del equipo'},
    {idSesion:'ses-1',contenido:'Automatizar la generación de reportes semanales con Power BI conectado a las fuentes de datos'},
    {idSesion:'ses-1',contenido:'Reducir el tiempo de aprobación de solicitudes implementando flujos digitales con firma electrónica'},
    {idSesion:'ses-1',contenido:'Implementar un bot de Slack que responda preguntas frecuentes de TI y reduzca interrupciones'},
    {idSesion:'ses-1',contenido:'Crear un sistema de reconocimiento entre pares para motivar al equipo y mejorar el clima'},
    {idSesion:'ses-1',contenido:'Usar gamificación para incentivar el cumplimiento de metas del área con premios simbólicos'},
    {idSesion:'ses-1',contenido:'Estandarizar los formatos de entrega para evitar errores de interpretación entre áreas'},
    {idSesion:'ses-2',contenido:'Mejorar la comunicación entre desarrollo y QA para evitar retrabajos por malos entendidos'},
    {idSesion:'ses-2',contenido:'Las daily meetings son muy extensas, deberían tener un límite de 10 minutos'},
    {idSesion:'ses-2',contenido:'Falta claridad en los criterios de aceptación de las historias de usuario'},
    {idSesion:'ses-2',contenido:'Necesitamos más pairing programming para compartir conocimiento entre seniors y juniors'},
    {idSesion:'ses-2',contenido:'El ambiente del equipo es muy positivo, se nota la colaboración y el compañerismo'},
    {idSesion:'ses-2',contenido:'Deberíamos celebrar más los logros del sprint y no solo enfocarnos en las mejoras'},
    {idSesion:'ses-3',contenido:'El ambiente laboral es en general bueno pero falta comunicación entre departamentos'},
    {idSesion:'ses-3',contenido:'La carga de trabajo está bien distribuida en mi equipo y eso se agradece'},
    {idSesion:'ses-3',contenido:'Me gustaría tener más oportunidades de crecimiento profesional y capacitación'},
    {idSesion:'ses-3',contenido:'El teletrabajo ha mejorado mi calidad de vida y productividad significativamente'},
    {idSesion:'ses-3',contenido:'Siento que algunas decisiones importantes se toman sin consultar al equipo'},
  ],
  initDefaults(){
    if(!Store.get('sesiones'))Store.set('sesiones',this.PRESET_SESIONES);
    if(!Store.get('ideas')){
      const ideas=this.PRESET_IDEAS.map((d,i)=>({
        id:'idea-'+(i+1),
        ...d,
        fechaCreacion:new Date(Date.now()-(17-i)*86400000).toISOString(),
        ai_valor:0,ai_novedad:0,ai_sentimiento:0,ai_cluster:'',ai_esMinoritaria:false
      }));
      Store.set('ideas',ideas);
    }
  },
  crearSesion(data){
    return{
      id:Utils.uuid(),
      titulo:data.titulo.trim(),
      descripcion:data.descripcion.trim(),
      tipo:data.tipo,
      tema:data.tema.trim(),
      estado:'activa',
      fechaCreacion:new Date().toISOString()
    };
  },
  crearIdea(data){
    return{
      id:Utils.uuid(),
      idSesion:data.idSesion,
      contenido:data.contenido.trim(),
      fechaCreacion:new Date().toISOString(),
      ai_valor:0,ai_novedad:0,ai_sentimiento:0,ai_cluster:'',ai_esMinoritaria:false
    };
  }
};
