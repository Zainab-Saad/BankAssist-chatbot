from flask import Flask, request, jsonify
from flask_cors import CORS  # Add this import
import time  # For simulating processing delay

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        if not data or 'message' not in data:
            return jsonify({'error': 'Invalid request'}), 400
        
        user_message = data['message']
        
        # Simulate processing delay (remove in production)
        time.sleep(1)
        
        # Mock response - replace with your actual LLM integration
        response = {
            'response': f"Received your message: '{user_message}'. This is a simulated response.",
            'timestamp': time.time()
        }
        
        return jsonify(response)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)