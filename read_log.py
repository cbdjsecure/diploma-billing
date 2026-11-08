import json

with open(r'C:\Users\SASWATA\.gemini\antigravity\brain\feb72794-f641-45b4-8b93-81b9308c82a3\.system_generated\logs\transcript.jsonl', 'r', encoding='utf-8') as f:
    for line in f:
        obj = json.loads(line)
        if obj.get('type') == 'USER_INPUT':
            content = obj.get('content', '')
            print('STEP:', obj.get('step_index'), content.replace('\n', ' ')[:140])

