import {execFileSync} from 'node:child_process';

// Electron screenshots on Windows can differ from CSS viewport dimensions.
// Map CSS coordinates into the actual PNG, rather than sampling a nearby pane.
export function screenshotDifference(first,second,rect,viewport) {
  return JSON.parse(execFileSync('python',['-c',
    'from PIL import Image;import sys,json;spec=json.loads(sys.argv[3]);a=Image.open(sys.argv[1]).convert("RGB");b=Image.open(sys.argv[2]).convert("RGB");assert a.size==b.size;box=spec["rect"];v=spec["viewport"];scale=[a.width/v["width"],a.height/v["height"]] if v else [1,1];box=[round(x*scale[i%2]) for i,x in enumerate(box)] if box else [0,0,a.width,a.height];assert 0<=box[0]<box[2]<=a.width and 0<=box[1]<box[3]<=a.height,(box,a.size);a=a.crop(box);b=b.crop(box);d=[max(abs(x-y) for x,y in zip(p,q)) for p,q in zip(a.getdata(),b.getdata())];print(json.dumps({"changedFraction":sum(x>12 for x in d)/len(d),"meanDelta":sum(d)/len(d),"sampleBox":box,"cssToImageScale":scale}))',
    first,second,JSON.stringify({rect,viewport})],{encoding:'utf8',windowsHide:true}));
}
