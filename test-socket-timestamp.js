const socketService = require('./services/socketService');
const messageService = require('./services/messageService');

// Mock data for testing
const testMsg = {
    message: "Test message",
    sender_decrypt_key: "key1",
    receiver_decrypt_key: "key2",
    iv: "test-iv",
    conversationId: "test-conv-123",
    auth_tag: "test-tag",
    sender_id: "1",
    recipientId: "2",
    // Note: No created_at field
};

// Mock io object with emit functions for testing
const mockIo = {
    to: (room) => ({
        emit: (event, data) => {
            console.log(`[Test] Room ${room} emitting ${event}:`, data);
            
            // Check if timestamp was added
            if (event === "RceiveMessage") {
                if (data.created_at) {
                    console.log('✅ Timestamp successfully added:', data.created_at);
                } else {
                    console.error('❌ No timestamp added to the message');
                }
            }
        }
    }),
    emit: (event, data) => {
        console.log(`[Test] Global emit ${event}:`, data);
    }
};

// Mock socket with join function
const mockSocket = {
    id: 'test-socket-id',
    userId: '1',
    join: (room) => console.log(`[Test] Joined room: ${room}`),
    on: () => {},
};

// Create a test function to invoke the socket message handler
function testSocketTimestamp() {
    console.log('=== Testing Socket Timestamp Handling ===');
    
    // Get the socket handler
    const socketHandler = socketService(mockIo);
    
    // Manually call the handler with our mock socket
    socketHandler.on('connection', mockSocket);
    
    // Manually trigger the SendMessage event handler
    const sendMessageHandler = mockSocket.on.mock.calls.find(call => call[0] === 'SendMessage')[1];
    
    if (sendMessageHandler) {
        sendMessageHandler(testMsg);
    } else {
        console.error('Could not find SendMessage handler');
    }
}

// Test timestamp handling
testSocketTimestamp();
