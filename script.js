document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const userInput = document.getElementById('userInput');
    const sendButton = document.getElementById('sendButton');
    const chatHistory = document.getElementById('chatHistory');
    const historyList = document.getElementById('historyList');
    const documentUpload = document.getElementById('documentUpload');
    const uploadButton = document.getElementById('uploadButton');
    const uploadStatus = document.getElementById('uploadStatus');
    
    // Initialize query history from localStorage or create empty array
    let queryHistory = JSON.parse(localStorage.getItem('bankQueryHistory')) || [];

    // For backward compatibility with old history items that might not have responses
    queryHistory = queryHistory.map(item => {
        if (!item.hasOwnProperty('response')) {
            return {
                query: item.query,
                response: "Response not stored in history",
                timestamp: item.timestamp || new Date().toISOString()
            };
        }
        return item;
    });

    
    // Display query history
    renderQueryHistory();
    
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
        
        // Save to history
        addToQueryHistory(message, "Waiting for response...");
        
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
                addToQueryHistory(message, errorMsg);
            } else {
                addMessageToChat(data.response, 'bot');
                addToQueryHistory(message, data.response);
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
    
    // Function to add query to history
    function addToQueryHistory(query, response) {
        // Add to beginning of array
        queryHistory.unshift({
            query: query,
            response: response,
            timestamp: new Date().toISOString()
        });
        
        // Keep only last 20 items
        if (queryHistory.length > 20) {
            queryHistory.pop();
        }
        
        // Save to localStorage
        localStorage.setItem('bankQueryHistory', JSON.stringify(queryHistory));
        
        // Update display
        renderQueryHistory();
    }
        
    // Function to render query history
    // Function to render query history
    function renderQueryHistory() {
        historyList.innerHTML = '';
        
        if (queryHistory.length === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.classList.add('history-item');
            emptyMsg.textContent = 'No recent queries';
            historyList.appendChild(emptyMsg);
            return;
        }
        
        queryHistory.forEach((item, index) => {
            const historyItem = document.createElement('div');
            historyItem.classList.add('history-item');
            
            // Create elements for query and response
            const queryElement = document.createElement('div');
            queryElement.classList.add('history-query');
            queryElement.textContent = item.query.length > 50 
                ? item.query.substring(0, 47) + '...' 
                : item.query;
            
            const responseElement = document.createElement('div');
            responseElement.classList.add('history-response');
            responseElement.textContent = item.response.length > 50
                ? item.response.substring(0, 47) + '...'
                : item.response;
            responseElement.style.display = 'none'; // Initially hidden
            
            historyItem.appendChild(queryElement);
            historyItem.appendChild(responseElement);
            
            // Click to toggle response visibility
            historyItem.addEventListener('click', function(e) {
                // Don't toggle if clicking on a child element that has its own handler
                if (e.target !== historyItem) return;
                
                // Toggle response visibility
                if (responseElement.style.display === 'none') {
                    responseElement.style.display = 'block';
                    historyItem.classList.add('expanded');
                } else {
                    responseElement.style.display = 'none';
                    historyItem.classList.remove('expanded');
                }
            });
            
            historyList.appendChild(historyItem);
        });
    }
        
    // Function to handle file upload
    function handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        uploadStatus.textContent = 'Uploading...';
        
        const formData = new FormData();
        formData.append('document', file);
        
        fetch('/api/upload', {
            method: 'POST',
            body: formData,
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                uploadStatus.textContent = 'Document uploaded successfully!';
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
            uploadStatus.textContent = 'Error uploading document';
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