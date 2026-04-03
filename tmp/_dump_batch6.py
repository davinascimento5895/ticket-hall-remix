import json
with open('tmp/batches/batch-6.json', 'r', encoding='utf-8') as f:
    data = json.load(f)
for i, item in enumerate(data[:50]):
    print(f'{i}: {repr(item["original"])}')
