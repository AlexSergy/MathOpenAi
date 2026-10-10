"""Small finite checks, NOT implementations/proofs of the new manuscript algorithms.
Run: python check_models.py. Requires Python 3.10+ and NumPy.
Writes computed results and demo input next to this file.
"""
from itertools import combinations, permutations
from fractions import Fraction
from pathlib import Path
from collections import deque
import json, math, random
import numpy as np
OUT=Path(__file__).resolve().parent

def switch_data():
    n=6; edges=list(combinations(range(n),2)); ei={e:i for i,e in enumerate(edges)}
    states=[]
    for es in combinations(range(len(edges)),6):
        degree=[0]*n
        for e in es:
            a,b=edges[e];degree[a]+=1;degree[b]+=1
        if degree==[2]*n:states.append(sum(1<<e for e in es))
    states.sort();index={m:i for i,m in enumerate(states)}
    denominator=12*math.comb(n,4)
    counts=np.zeros((len(states),len(states)),dtype=np.int64)
    for i,mask in enumerate(states):
        counts[i,i]+=denominator//2
        for a,b,c,d in combinations(range(n),4):
            ms=[[(a,b),(c,d)],[(a,c),(b,d)],[(a,d),(b,c)]]
            bits=[sum(1<<ei[tuple(sorted(e))] for e in es) for es in ms]
            for j,k in permutations(range(3),2):
                r,s=bits[j],bits[k]
                target=mask^r^s if (mask&r)==r and (mask&s)==0 else mask
                counts[i,index[target]]+=1
    assert np.all(counts.sum(axis=1)==denominator)
    assert np.array_equal(counts,counts.T)
    P=counts/denominator
    law=np.zeros(len(states));law[0]=1;uniform=np.full(len(states),1/len(states));tv=[]
    for t in range(201):
        tv.append(float(np.abs(law-uniform).sum()/2));law=law@P
    eig=np.linalg.eigvalsh(P)
    triangles=[]
    for mask in states:
        triangles.append(sum(all(mask&(1<<ei[tuple(sorted(e))]) for e in combinations(vs,2)) for vs in combinations(range(n),3)))
    return dict(n=n,edges=edges,states=states,denominator=denominator,counts=counts.tolist(),triangles=triangles),dict(states=len(states),row_sum_integer=denominator,symmetric=True,triangles_uniform_mean=sum(triangles)/len(states),spectral_gap=float(1-eig[-2]),tv_start0={str(t):tv[t] for t in [0,1,10,25,50,100,200]},first_step_tv_le_quarter_start0=next(t for t,v in enumerate(tv) if v<=.25),theorem_bound=2*n**8)

def table_data():
    cols=[2,2,2];r=3;out=[]
    for a in range(3):
        for b in range(3):
            c=r-a-b
            if 0<=c<=2:
                table=[a,b,c,2-a,2-b,2-c]
                weight=Fraction(1,math.prod(math.factorial(v) for v in table));out.append((table,weight))
    z=sum(w for _,w in out)
    return [{'cells':t,'uniform':str(Fraction(1,len(out))),'conditional_independence':str(w/z)} for t,w in out]

def schedule(edges,n):
    pred=[0]*n
    for a,b in edges:pred[b]|=1<<a
    prev={0:None};q=deque([0]);goal=(1<<n)-1
    while q:
        m=q.popleft()
        if m==goal:break
        ready=[i for i in range(n) if not m&(1<<i) and pred[i]&m==pred[i]]
        for k in range(1,min(3,len(ready))+1):
            for chosen in combinations(ready,k):
                z=m|sum(1<<i for i in chosen)
                if z not in prev:prev[z]=(m,chosen);q.append(z)
    slots=[];m=goal
    while m:
        old,chosen=prev[m];slots.append(list(chosen));m=old
    exact=slots[::-1];greedy=[];m=0
    while m!=goal:
        ready=[i for i in range(n) if not m&(1<<i) and pred[i]&m==pred[i]][:3]
        assert ready;m|=sum(1<<i for i in ready);greedy.append(ready)
    return exact,greedy

def scs(strings):
    strings=sorted(set(strings));strings=[s for s in strings if not any(s!=t and s in t for t in strings)]
    def overlap(a,b):
        for k in range(min(len(a),len(b)),0,-1):
            if a[-k:]==b[:k]:return k
        return 0
    n=len(strings);dp={}
    for i,s in enumerate(strings):dp[1<<i,i]=s
    for mask in range(1,1<<n):
        for i in range(n):
            if (mask,i) not in dp:continue
            for j in range(n):
                if mask&(1<<j):continue
                key=mask|(1<<j),j;new=dp[mask,i]+strings[j][overlap(strings[i],strings[j]):]
                old=dp.get(key)
                if old is None or (len(new),new)<(len(old),old):dp[key]=new
    exact=min((dp[(1<<n)-1,i] for i in range(n)),key=lambda x:(len(x),x))
    work=strings[:]
    while len(work)>1:
        pairs=[(-overlap(a,b),a+b[overlap(a,b):],i,j) for i,a in enumerate(work) for j,b in enumerate(work) if i!=j]
        _,merged,i,j=min(pairs);work=[s for k,s in enumerate(work) if k not in (i,j)]+[merged];work.sort()
    assert all(s in exact and s in work[0] for s in strings)
    return dict(input=strings,exact=exact,greedy=work[0],ratio=len(work[0])/len(exact))

if __name__=='__main__':
    graph,stats=switch_data();tables=table_data();assert len(tables)==7
    random.seed(417);chosen=None
    for _ in range(500):
        n=10;e=[(a,b) for a in range(n) for b in range(a+1,n) if random.random()<.18]
        exact,greedy=schedule(e,n)
        if len(greedy)>len(exact):chosen=dict(n=n,edges=e,exact=exact,greedy=greedy);break
    assert chosen
    crouzeix=[]
    for a in [0,.2,1,3]:
        for b in [0,.3,2]:
            A=np.array([[b,a],[0,b]],float);norm=float(np.linalg.norm(A,2));analytic=(math.sqrt(a*a+4*b*b)+abs(a))/2
            assert abs(norm-analytic)<1e-12;crouzeix.append(dict(a=a,b=b,norm=norm,bound=2*(abs(b)+abs(a)/2)))
    results=dict(description='Own finite checks, no uploaded scripts executed. No general theorem validated.',switch=stats,tables=tables,schedule=chosen,superstring=scs(['CATGC','CTAAGT','GCTA','TTCA','ATGCATC']),crouzeix=crouzeix,asymptotic_excess_at_n_2power64=math.expm1(2**-182*math.log(64)))
    (OUT/'results.json').write_text(json.dumps(results,indent=2))
    (OUT/'switch_kernel.json').write_text(json.dumps(graph,separators=(',',':')))
    (OUT.parent/'assets'/'experiment-data.js').write_text('window.EXPERIMENTS='+json.dumps({'switch':graph,'schedule':chosen,'results':results},separators=(',',':'))+';\n')
    print(json.dumps({k:v for k,v in results.items() if k in ['switch','superstring','asymptotic_excess_at_n_2power64']},indent=2))
