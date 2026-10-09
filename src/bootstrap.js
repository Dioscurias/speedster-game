const params=new URLSearchParams(location.search);
if(params.get('embed')==='1'){
 if(params.get('map')==='parkour')await import('./parkour.js');
 else await import('./main.js');
 const {mountGameLayout}=await import('./game-layout.js');
 mountGameLayout(params.get('map')==='parkour',params.get('autoplay')==='1');
}else await import('./player-page.js');
