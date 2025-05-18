from flask import Flask, request, jsonify
from flask_cors import CORS
from llm_service import LLMService
from document_parser import parse_markdown, convert_to_documents  # Your existing functions
import os

app = Flask(__name__)
CORS(app)

# Initialize LLM service
llm_service = LLMService()

# Load documents at startup
def initialize_app():
    qa_list = parse_markdown("/home/zainab/Documents/NUST/Semester 8/Large Language Models sem 8/Project/bank_qna_md.md")
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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)