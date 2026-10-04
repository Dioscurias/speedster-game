export function minimapMetrics(cssSize,pixelRatio=1){
 const size=Math.max(1,Math.round(cssSize));
 const ratio=Math.min(2,Math.max(1,pixelRatio||1));
 return {cssSize:size,pixelRatio:ratio,backingSize:Math.round(size*ratio),worldScale:size>=150?.19:.14,playerSize:size>=150?12:10};
}
