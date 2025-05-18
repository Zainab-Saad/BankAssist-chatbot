import re
from llama_index.core import Document

def parse_markdown(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    pattern = re.compile(
        r'---\s*'                                     
        r'sheet_name:\s*"(.*?)"\s*'                   
        r'question:\s*"(.*?)"\s*'                     
        r'source:\s*"(.*?)"\s*---\s*'                 
        r'\*\*Answer:\*\*\s*(.*?)'                    
        r'(?=---|\Z)',                                
        re.DOTALL
    )

    return [
        {
            'sheet_name': match.group(1).strip(),
            'question': match.group(2).strip(),
            'source': match.group(3).strip(),
            'answer': match.group(4).strip()
        }
        for match in pattern.finditer(content)
    ]

def convert_to_documents(qa_list):
    return [
        Document(
            text=f"Q: {qa['question']}\nA: {qa['answer']}",
            metadata={
                'sheet_name': qa['sheet_name'],
                'source': qa['source']
            }
        )
        for qa in qa_list
    ]