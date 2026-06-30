const Store={
  _prefix:'opinia_',
  get(name){
    try{
      const data=localStorage.getItem(this._prefix+name);
      return data?JSON.parse(data):null;
    }catch{return null}
  },
  set(name,value){
    try{localStorage.setItem(this._prefix+name,JSON.stringify(value));return true}
    catch{return false}
  },
  remove(name){
    try{localStorage.removeItem(this._prefix+name);return true}
    catch{return false}
  },
  getCollection(name){
    return this.get(name)||[];
  },
  addToCollection(name,item){
    const col=this.getCollection(name);
    col.push(item);
    this.set(name,col);
    return item;
  },
  updateInCollection(name,id,updates){
    const col=this.getCollection(name);
    const idx=col.findIndex(i=>i.id===id);
    if(idx===-1)return null;
    col[idx]={...col[idx],...updates};
    this.set(name,col);
    return col[idx];
  },
  removeFromCollection(name,id){
    const col=this.getCollection(name);
    const filtered=col.filter(i=>i.id!==id);
    if(filtered.length===col.length)return false;
    this.set(name,filtered);
    return true;
  },
  getById(name,id){
    return this.getCollection(name).find(i=>i.id===id)||null;
  }
};
