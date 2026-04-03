import json
with open('tmp/batches/batch-6.json', 'r', encoding='utf-8') as f:
    data = json.load(f)
with open('tmp/_batch6_all.txt', 'w', encoding='utf-8') as out:
    for i in range(0, len(data), 50):
        out.write(f'--- {i}-{min(i+49, len(data)-1)} ---\n')
        for j in range(i, min(i+50, len(data))):
            out.write(repr(data[j]['original']) + '\n')
        out.write('\n')
print('done', len(data))
