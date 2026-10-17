"""Render the project's own ShineAI sunrise mark (Pillow, no remote assets)."""
from pathlib import Path
from PIL import Image, ImageDraw
import math

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'resources'

def mark(size=1024, tile=True, monochrome=False):
    scale = size / 256
    image = Image.new('RGBA', (size, size))
    draw = ImageDraw.Draw(image)
    def box(values): return tuple(round(v * scale) for v in values)
    def line(points, color, width):
        draw.line([(round(x*scale),round(y*scale)) for x,y in points], fill=color, width=max(1,round(width*scale)))
        for x,y in [points[0],points[-1]]:
            r=width/2;draw.ellipse(box((x-r,y-r,x+r,y+r)),fill=color)
    if tile: draw.rounded_rectangle(box((0,0,255,255)),radius=round(56*scale),fill='#142432')
    sun = '#000000' if monochrome else '#FFD080'
    horizon = '#000000' if monochrome else '#72E4DE'
    draw.ellipse(box((96,96,160,160)),fill=sun)
    for angle in [180,225,270,315,360]:
        rad=math.radians(angle)
        line([(128+48*math.cos(rad),128+48*math.sin(rad)),(128+65*math.cos(rad),128+65*math.sin(rad))],sun,10)
    # A clean horizon and reflected light distinguish this mark from a bolt.
    line([(65,173),(191,173)],horizon,12)
    line([(90,196),(166,196)],horizon,10)
    return image

if __name__ == '__main__':
    image=mark()
    image.resize((256,256),Image.Resampling.LANCZOS).save(OUT/'icon.png')
    image.save(OUT/'icon.ico',sizes=[(16,16),(24,24),(32,32),(48,48),(64,64),(128,128),(256,256)])
    # Keep the optional bundled web client's favicon and install icon aligned.
    (OUT/'web-client/favicon.ico').write_bytes((OUT/'icon.ico').read_bytes())
    for size in [192,512]:
        image.resize((size,size),Image.Resampling.LANCZOS).save(OUT/f'web-client/pwa-{size}x{size}.png')
    for name,size,mono in [('trayIcon.png',32,False),('trayIconTemplate.png',22,True),('trayIconTemplate@2x.png',44,True)]:
        mark(tile=False,monochrome=mono).resize((size,size),Image.Resampling.LANCZOS).save(OUT/name)
    print('Generated ShineAI icon and tray assets')
