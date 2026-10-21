import json, sys, statistics as st
rows = json.load(open(sys.argv[1]))
def med(xs):
    xs = [x for x in xs if x is not None]
    return round(st.median(xs)) if xs else None
groups = {}
for r in rows:
    groups.setdefault((r['layer'], r['view'], r['method']), []).append(r)
print('| data | view | method | ready ms | long tasks (n / total / max ms) | heap MB | tiles (n / KB) | hover ms/move (median / max) | z restyle ms | restyle long tasks total / max | react ms | runs |')
print('|---|---|---|---|---|---|---|---|---|---|---|---|')
for (layer, view, method), rs in groups.items():
    g = lambda f: med([f(r) for r in rs])
    hov = f"{st.median([r['hover']['medianMs'] for r in rs]):.1f} / {st.median([r['hover']['maxMs'] for r in rs]):.1f}" if rs[0]['hover'] else 'n/a'
    rest = g(lambda r: r['restyle'] and r['restyle']['idleMs'])
    rlt = f"{g(lambda r: r['restyle'] and r['restyle']['longTasks']['sum'])} / {g(lambda r: r['restyle'] and r['restyle']['longTasks']['max'])}" if rs[0]['restyle'] else 'n/a'
    print(f"| {layer} | {view} | {method} | {g(lambda r: r['readyMs'])} | {g(lambda r: r['longTasks']['n'])} / {g(lambda r: r['longTasks']['sum'])} / {g(lambda r: r['longTasks']['max'])} | {g(lambda r: r['heapMB'])} | {g(lambda r: r['tileRequests'])} / {g(lambda r: r['tileKB'])} | {hov} | {rest if rest is not None else 'n/a'} | {rlt} | {g(lambda r: r['react'] and r['react']['idleMs']) or 'n/a'} | {len(rs)} |")
fs = [r['restyle'].get('featureStateMs') for r in rows if r['restyle'] and r['restyle'].get('featureStateMs') is not None]
for layer in ['counties','tracts']:
    xs=[r['restyle']['featureStateMs'] for r in rows if r['layer']==layer and r['restyle'] and r['restyle'].get('featureStateMs') is not None]
    if xs: print(f"\nupdateFeatureState during z restyle, {layer}: median {st.median(xs)} ms (n={len(xs)})")
errs=[(r['method'],r['layer'],r['view'],r['errors']) for r in rows if r['errors']]
print('\nerrors:', errs)
