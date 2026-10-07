export function lightingEffect(page,phase,ended=false){
  if(ended)return 'blue';
  if(page==='intro')return 'red';
  if(page==='home')return phase==='cleared'?'green':'red';
  if(page==='outro')return 'green';
  return 'blue';
}
