import json
with open('tmp/batches/batch-3.json', 'r', encoding='utf-8') as f:
    data = json.load(f)
with open('tmp/batch-3-strings.txt', 'w', encoding='utf-8') as out:
    for i, item in enumerate(data):
        out.write(f'{i}: {repr(item["original"])}\n')
