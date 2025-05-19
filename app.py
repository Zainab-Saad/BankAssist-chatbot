from flask import Flask, request, jsonify
from flask_cors import CORS
from llm_service import LLMService
from document_parser import parse_markdown, convert_to_documents
from excel_to_md import process_sheet, append_excel_to_markdown
import os
import pandas as pd
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)

llm_service = LLMService()

def initialize_app():
    excel_file = "/home/zainab/Documents/NUST/Semester 8/Large Language Models sem 8/Project/Code/BankAssist-LLM/data/NUST Bank-Product-Knowledge.xlsx"
    output_file = "bank_qna_md.md"

    all_sheets = pd.read_excel(excel_file, sheet_name=None, header=None)

    with open(output_file, "w", encoding="utf-8") as f:
        for sheet_name, df in all_sheets.items():
            if sheet_name in ["Sheet3", "Sheet1", "Main"]:
                continue
            
            content = process_sheet(sheet_name, df, excel_file)
            if content:
                f.write(content + "\n")

    print(f"Markdown output saved to {output_file}")
    qa_list = parse_markdown(output_file)
    documents = convert_to_documents(qa_list)
    llm_service.initialize_index(documents)

initialize_app()

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        if not data or 'message' not in data:
            return jsonify({'error': 'Invalid request'}), 400
        
        question = data['message']
        response = llm_service.query(question)
        
        return jsonify({
            'response': response,
            'status': 'success'
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/upload', methods=['POST'])
def upload_file():
    """Handle file uploads and update RAG pipeline"""
    print('======================================request files', request.files)
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    print('=====================================file', file, type(file))
    if file.filename == '':
        print('======================================file name', file.filename)
    if 'file' not in request.files:
        return jsonify({'error': 'No selected file'}), 400
    
    if file and allowed_file(file.filename):
        try:
            filename = secure_filename(file.filename)
            filepath = os.path.join("uploads", filename)
            file.save(filepath)
            
            append_excel_to_markdown(filepath, "bank_qna_md.md")

            qa_list = parse_markdown("bank_qna_md.md")
            print('==============================qa_list', qa_list)
            documents = convert_to_documents(qa_list)
            print('==============================documents', documents)
            
            llm_service.initialize_index(documents)
            
            return jsonify({
                'status': 'success',
                'message': 'File uploaded and RAG pipeline updated',
                'filename': filename
            })
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    else:
        return jsonify({'error': 'File type not allowed'}), 400

def allowed_file(filename):
    """Check if the file has an allowed extension"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ['xlsx', 'xls']

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)