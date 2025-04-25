import React, { useState, useEffect } from 'react';
import { apiUrl } from '../config/config';
import Navbar from '../components/Navbar';
import '../css/messages.css';

const Messages = () => {
    const [conversations, setConversations] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [newConversationUser, setNewConversationUser] = useState('');
    const [error, setError] = useState(null);

    // Fetch list of users you've messaged
    useEffect(() => {
        const fetchConversations = async () => {
            try {
                const response = await fetch(`${apiUrl}/messages/conversations`, {
                    credentials: 'include'
                });
                const data = await response.json();
                setConversations(data);
            } catch (err) {
                console.error('Failed to fetch conversations', err);
            }
        };

        fetchConversations();
    }, []);

    // Load messages with the selected user
    useEffect(() => {
        if (!selectedUser) return;

        const fetchMessages = async () => {
            try {
                const response = await fetch(`${apiUrl}/messages/${selectedUser.user_id}`, {
                    credentials: 'include'
                });
                const data = await response.json();
                setMessages(data);
            } catch (err) {
                console.error('Failed to load messages', err);
            }
        };

        fetchMessages();
    }, [selectedUser]);

    const handleSendMessage = async () => {
        if (!newMessage.trim()) return;

        try {
            const response = await fetch(`${apiUrl}/messages/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    recipient_id: selectedUser.user_id,
                    message: newMessage
                })
            });

            if (response.ok) {
                const newMsg = await response.json();
                setMessages(prev => [...prev, newMsg]); // Add new message to the conversation
                setNewMessage('');

                // If the selected user wasn't already in conversations, add them
                if (!conversations.find(u => u.user_id === selectedUser.user_id)) {
                    setConversations(prev => [...prev, selectedUser]);
                }
            }
        } catch (err) {
            console.error('Failed to send message', err);
        }
    };

    const handleNewConversation = async () => {
        if (!newConversationUser.trim()) return;
        console.log('Starting new conversation with:', newConversationUser);

        try {
            const response = await fetch(`${apiUrl}/user/messages/${newConversationUser}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });
            if (response.ok) {
                const userData = await response.json();

                console.log('Fetched userData:', userData);


                const conversationResponse = await fetch(`${apiUrl}/messages/${userData.user_id}`, {
                    // method: 'GET',
                    // headers: {
                    //     'Content-Type': 'application/json'
                    // },
                    credentials: 'include'
                });

                const conversationData = await conversationResponse.json();

                if (conversationData.length > 0) {
                    setSelectedUser(userData);
                    setMessages(conversationData);
                } else {
                    setSelectedUser(userData);
                    setMessages([]);
                }

                setNewConversationUser('');
                setError(null);
            } else {
                const data = await response.json();
                setError(`User with username "${newConversationUser}" not found.`);
            }
        } catch (err) {
            console.error('Failed to start new conversation', err);
            setError('Something went wrong.');
        }
    };

    return (
        <>
            <Navbar />
            <div className="messages-container">
                <div className="conversations-list">
                    <h2>Conversations</h2>

                    <div className="new-conversation">
                        <input
                            type="text"
                            value={newConversationUser}
                            onChange={(e) => setNewConversationUser(e.target.value)}
                            placeholder="Start conversation with username..."
                        />
                        <button onClick={handleNewConversation}>Start</button>
                        {error && <div className="error">{error}</div>}
                    </div>

                    {conversations.length === 0 ? (
                        <div>No conversations yet. Start one with a user!</div>
                    ) : (
                        conversations.map((user) => (
                            <div
                                key={user.user_id}
                                className={`conversation-item ${selectedUser?.user_id === user.user_id ? 'active' : ''}`}
                                onClick={() => setSelectedUser(user)}
                            >
                                {user.username}
                            </div>
                        ))
                    )}
                </div>

                <div className="message-thread">
                    {selectedUser ? (
                        <>
                            <div className="messages-header">
                                <h2>Chat with {selectedUser.username}</h2>
                            </div>

                            <div className="messages-body">
                                {messages.length > 0 ? (
                                    messages.map((msg, index) => (
                                        <div
                                            key={index}
                                            className={`message-item ${msg.sender_id === selectedUser?.user_id ? 'received' : 'sent'}`}
                                        >
                                            {msg.message}
                                        </div>
                                    ))
                                ) : (
                                    <div className="no-messages">
                                        <p>No messages yet. Start the conversation!</p>
                                    </div>
                                )}
                            </div>


                            <div className="message-input">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault(); // prevent form submission if wrapped in a form
                                            handleSendMessage();
                                        }
                                    }}
                                    placeholder="Type a message..."
                                />
                                <button onClick={handleSendMessage}>Send</button>
                            </div>

                        </>
                    ) : (
                        <div className="no-user-selected">Select a conversation to view messages</div>
                    )}
                </div>
            </div>
        </>
    );
};

export default Messages;
