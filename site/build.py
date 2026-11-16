# r49 · builds index.html from src.html: inlines the coin logos from ./logos and syncs the reviewed English dictionary
import glob,os,re,json
d=os.path.dirname(os.path.abspath(__file__))
logos={}
for f in sorted(glob.glob(os.path.join(d,'logos','*.svg'))):
    v=open(f).read().strip()
    v=re.sub(r'\s*class="web3icons"','',v); v=re.sub(r'\s(width|height)="24"','',v,count=2)
    v=re.sub(r'>\s+<','><',v); logos[os.path.basename(f)[:-4].upper()]=v
s=open(os.path.join(d,'src.html')).read().replace('/*LOGOS*/{}',json.dumps(logos,separators=(',',':')))
open(os.path.join(d,'index.html'),'w').write(s); print('ok',len(s))
p=os.path.join(d,'i18n','r48.js')
r=open(p).read()
r=re.sub(r'  const dictionary = .*?;\n',lambda m: '  const dictionary = '+json.dumps(json.load(open(os.path.join(d,'i18n','r48.json'))),ensure_ascii=False)+';\n',r,count=1)
open(p,'w').write(r)
