document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const userInput = document.getElementById('userInput');
    const sendButton = document.getElementById('sendButton');
    const chatHistory = document.getElementById('chatHistory');
    const documentUpload = document.getElementById('documentUpload');
    const uploadButton = document.getElementById('uploadButton');
    const uploadStatus = document.getElementById('uploadStatus');

    function displayFormattedResponse(response) {
    // Convert bullet points to HTML
    const formattedText = response
        .replace(/\n/g, '<br>')
        .replace(/\•/g, '•')
        .replace(/\: /g, ':<br> - ');
    
    return `
        <div class="bank-response">
            <div class="response-header">Bank Policy Information</div>
            <div class="response-content">${formattedText}</div>
        </div>
    `;
}
    
    // Event listeners
    sendButton.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    uploadButton.addEventListener('click', function() {
        documentUpload.click();
    });
    
    documentUpload.addEventListener('change', handleFileUpload);
    
    // Function to send message
    function sendMessage() {
        console.log("1. sendMessage() triggered"); // Debug log
        const message = userInput.value.trim();
        if (message === '') return;

        console.log("2. Message to send:", message); // Debug log
        
        // Add user message to chat
        addMessageToChat(message, 'user');
        
        // Show typing indicator
        showTypingIndicator();
        
        // Clear input
        userInput.value = '';
                
        // Send to backend
        console.log("3. Before fetch"); // Debug log

        fetch('http://127.0.0.1:5000/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: message }),
        })
        .then(response => {
            console.log("4. Got response:", response); // Debug log

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();  // This was missing the return statement
        })
        .then(data => {
            // Remove typing indicator
            console.log("5. Response data:", data); // Debug log
            removeTypingIndicator();

            
            if (data.error) {
                const errorMsg = "Sorry, I'm having trouble answering that right now. Please try again later.";
                addMessageToChat(errorMsg, 'bot');
            } else {
                addMessageToChat(data.response, 'bot');
            }

        })
        .catch(error => {
            console.error("6. Fetch error:", error); // Debug log

            removeTypingIndicator();
            addMessageToChat("Sorry, there was an error processing your request. Please try again.", 'bot');
            console.error('Error:', error);
        });
    }
    
    // Function to add message to chat
    function addMessageToChat(message, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message');
        messageDiv.classList.add(sender + '-message');
        messageDiv.textContent = message;
        chatHistory.appendChild(messageDiv);
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }
    
    // Function to show typing indicator
    function showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.classList.add('typing-indicator');
        typingDiv.id = 'typingIndicator';
        typingDiv.innerHTML = '<span></span><span></span><span></span>';
        chatHistory.appendChild(typingDiv);
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }
    
    // Function to remove typing indicator
    function removeTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
            
    // Function to handle file upload
    function handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Validate file type
        const allowedTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel'
        ];
        const fileExtension = file.name.split('.').pop().toLowerCase();
        
        if (!allowedTypes.includes(file.type) && !['xlsx', 'xls'].includes(fileExtension)) {
            uploadStatus.textContent = 'Error: Only Excel files (.xlsx, .xls) are allowed';
            uploadStatus.style.color = 'var(--error-color)';
            event.target.value = ''; // Clear the invalid file
            return;
        }
        
        uploadStatus.textContent = 'Uploading...';
        
        const formData = new FormData();
        formData.append('file', file);  // Changed from 'document' to 'file' to match backend
        
        fetch('http://127.0.0.1:5000/api/upload', {
            method: 'POST',
            body: formData,
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Upload failed');
            }
            return response.json();
        })
        .then(data => {
            if (data.status == "success") {
                uploadStatus.textContent = 'Excel file uploaded successfully!';
                uploadStatus.style.color = 'var(--success-color)';
                
                // Clear status after 3 seconds
                setTimeout(() => {
                    uploadStatus.textContent = '';
                }, 3000);
            } else {
                uploadStatus.textContent = 'Error: ' + (data.message || 'Upload failed');
                uploadStatus.style.color = 'var(--error-color)';
            }
        })
        .catch(error => {
            uploadStatus.textContent = 'Error uploading Excel file';
            uploadStatus.style.color = 'var(--error-color)';
            console.error('Upload error:', error);
        });
        
        // Reset file input
        event.target.value = '';
    }
    
    // Auto-resize textarea
    userInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });
});