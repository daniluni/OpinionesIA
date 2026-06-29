const Utils={
  uuid(){
    if(crypto.randomUUID)return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{
      const r=Math.random()*16|0;
      return(c==='x'?r:(r&0x3|0x8)).toString(16);
    });
  },
  escapeHtml(str){
    const div=document.createElement('div');
    div.textContent=str;
    return div.innerHTML;
  },
  formatDateShort(dateStr){
    const d=new Date(dateStr);
    return d.toLocaleDateString('es-CL',{day:'2-digit',month:'2-digit',year:'numeric'});
  },
  getTodayISO(){
    return new Date().toISOString().slice(0,10);
  },
  getCurrentMonth(){
    return new Date().toISOString().slice(0,7);
  },
  getMonthName(monthStr){
    const d=new Date(monthStr+'-01T12:00:00');
    return d.toLocaleDateString('es-CL',{month:'short',year:'2-digit'});
  }
};
