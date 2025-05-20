import re
from llama_index.core import Document

def parse_markdown(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    pattern = re.compile(
        r'---\s*'                                     
        r'(?:sheet_name:\s*"(.*?)"\s*)?'              
        r'question:\s*"(.*?)"\s*'                     
        r'source:\s*"(.*?)"\s*---\s*'                 
        r'\*\*Answer:\*\*\s*(.*?)'                   
        r'(?=---|\Z)',                               
        re.DOTALL
    )

    qa_list = []
    for match in pattern.finditer(content):
        sheet_name, question, source, answer = match.groups()
        qa_list.append({
            'sheet_name': (sheet_name.strip() if sheet_name else None),
            'question': question.strip(),
            'source': source.strip(),
            'answer': answer.strip()
        })
    return qa_list

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