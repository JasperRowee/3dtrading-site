# builds site/index.html from src.html: inlines the coin logos from ./logos
import glob,os,re,json
d=os.path.dirname(os.path.abspath(__file__))
logos={}
for f in sorted(glob.glob(os.path.join(d,'logos','*.svg'))):
    v=open(f).read().strip()
    v=re.sub(r'\s*class="web3icons"','',v); v=re.sub(r'\s(width|height)="24"','',v,count=2)
    v=re.sub(r'>\s+<','><',v); logos[os.path.basename(f)[:-4].upper()]=v
s=open(os.path.join(d,'src.html')).read().replace('/*LOGOS*/{}',json.dumps(logos,separators=(',',':')))
open(os.path.join(d,'index.html'),'w').write(s); print('ok',len(s))
