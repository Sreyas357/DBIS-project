import React, { useState, useEffect, useRef } from 'react';
import { apiUrl } from '../config/config';
import Navbar from '../components/Navbar';
import '../css/messages.css';
import { useLocation } from 'react-router-dom';

const Messages = () => {
    const [conversations, setConversations] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [newConversationUser, setNewConversationUser] = useState('');
    const [error, setError] = useState(null);
    const [isSending, setIsSending] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    
    const messagesEndRef = useRef(null);
    const searchInputRef = useRef(null);
    const dropdownRef = useRef(null);
    const location = useLocation();

    // Auto-scroll to bottom when messages change
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target) && 
                searchInputRef.current && !searchInputRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Fetch list of users you've messaged
    useEffect(() => {
        const fetchConversations = async () => {
            try {
                setIsLoading(true);
                const response = await fetch(`${apiUrl}/messages/conversations`, {
                    credentials: 'include'
                });
                const data = await response.json();
                setConversations(data);
            } catch (err) {
                console.error('Failed to fetch conversations', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchConversations();
    }, []);

    // Load messages with the selected user
    useEffect(() => {
        if (!selectedUser) return;

        const fetchMessages = async () => {
            try {
                setIsLoading(true);
                const response = await fetch(`${apiUrl}/messages/${selectedUser.user_id}`, {
                    credentials: 'include'
                });
                const data = await response.json();
                setMessages(data);
            } catch (err) {
                console.error('Failed to load messages', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMessages();
    }, [selectedUser]);

    // Search for users as user types
    useEffect(() => {
        const searchUsers = async () => {
            if (!newConversationUser.trim() || newConversationUser.length < 2) {
                setSearchResults([]);
                return;
            }
            
            try {
                setIsSearching(true);
                const response = await fetch(`${apiUrl}/user/search?q=${encodeURIComponent(newConversationUser)}`, {
                    credentials: 'include'
                });
                
                if (response.ok) {
                    const data = await response.json();
                    setSearchResults(data);
                    setShowDropdown(true);
                }
            } catch (err) {
                console.error('Failed to search users', err);
            } finally {
                setIsSearching(false);
            }
        };

        // Debounce search to avoid too many requests
        const timeoutId = setTimeout(searchUsers, 300);
        return () => clearTimeout(timeoutId);
    }, [newConversationUser]);

    // Auto-select user if passed via navigation state
    useEffect(() => {
        if (location.state && location.state.selectedUser) {
            setSelectedUser(location.state.selectedUser);
        }
    }, [location.state]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || isSending) return;

        try {
            setIsSending(true);
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
                const data = await response.json();
                
                // Add the new message to the messages list immediately
                const newMessageObj = {
                    message_id: data.message_id || Date.now(),
                    sender_id: data.sender_id || null,
                    recipient_id: selectedUser.user_id,
                    message: newMessage,
                    timestamp: new Date().toISOString()
                };
                
                setMessages(prevMessages => [...prevMessages, newMessageObj]);
                setNewMessage('');

                // If the selected user wasn't already in conversations, add them
                if (!conversations.find(u => u.user_id === selectedUser.user_id)) {
                    setConversations(prev => [...prev, selectedUser]);
                }
            }
        } catch (err) {
            console.error('Failed to send message', err);
        } finally {
            setIsSending(false);
        }
    };

    const handleUserSelect = async (user) => {
        setSelectedUser(user);
        setNewConversationUser('');
        setShowDropdown(false);
        setError(null);

        try {
            setIsLoading(true);
            const conversationResponse = await fetch(`${apiUrl}/messages/${user.user_id}`, {
                credentials: 'include'
            });

            const conversationData = await conversationResponse.json();
            setMessages(conversationData || []);
            
            // Add to conversations if not already there
            if (!conversations.find(u => u.user_id === user.user_id)) {
                setConversations(prev => [...prev, user]);
            }
        } catch (err) {
            console.error('Failed to load conversation', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleNewConversation = async () => {
        if (!newConversationUser.trim()) return;
        
        try {
            setIsLoading(true);
            const response = await fetch(`${apiUrl}/user/messages/${newConversationUser}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });
            
            if (response.ok) {
                const userData = await response.json();
                handleUserSelect(userData);
            } else {
                setError(`User "${newConversationUser}" not found.`);
            }
        } catch (err) {
            console.error('Failed to start new conversation', err);
            setError('Something went wrong.');
        } finally {
            setIsLoading(false);
        }
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <>
            <Navbar />
            <div className="messages-container">
                <div className="conversations-list">
                    <h2>Messages</h2>

                    <div className="new-conversation">
                        <div className="search-container">
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={newConversationUser}
                                onChange={(e) => setNewConversationUser(e.target.value)}
                                onFocus={() => newConversationUser.length >= 2 && setShowDropdown(true)}
                                placeholder="Search for users to message..."
                                disabled={isLoading}
                                className="search-input"
                            />
                            {isSearching && (
                                <div className="search-indicator">
                                    <div className="spinner"></div>
                                </div>
                            )}
                            
                            {showDropdown && searchResults.length > 0 && (
                                <div className="search-dropdown" ref={dropdownRef}>
                                    {searchResults.map(user => (
                                        <div 
                                            key={user.user_id}
                                            className="dropdown-item"
                                            onClick={() => handleUserSelect(user)}
                                        >
                                            <div className="dropdown-avatar">
                                                {user.username.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="dropdown-user-info">
                                                <span className="dropdown-username">{user.username}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        <button 
                            onClick={handleNewConversation}
                            disabled={isLoading || !newConversationUser.trim()}
                            className={isLoading ? 'loading' : ''}
                        >
                            {isLoading ? 'Searching...' : 'New Message'}
                        </button>
                        {error && <div className="error">{error}</div>}
                    </div>

                    {isLoading && conversations.length === 0 ? (
                        <div className="loading-indicator">Loading conversations...</div>
                    ) : conversations.length === 0 ? (
                        <div className="empty-state">No conversations yet. Start one with a user!</div>
                    ) : (
                        conversations.map((user) => (
                            <div
                                key={user.user_id}
                                className={`conversation-item ${selectedUser?.user_id === user.user_id ? 'active' : ''}`}
                                onClick={() => setSelectedUser(user)}
                            >
                                <div className="avatar">{user.username.charAt(0).toUpperCase()}</div>
                                <div className="user-info">
                                    <span className="username">{user.username}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="message-thread">
                    {selectedUser ? (
                        <>
                            <div className="messages-header">
                                <div className="selected-user-avatar">
                                    {selectedUser.username.charAt(0).toUpperCase()}
                                </div>
                                <h2>Chat with {selectedUser.username}</h2>
                            </div>

                            <div className="messages-body">
                                {isLoading ? (
                                    <div className="loading-messages">Loading messages...</div>
                                ) : messages.length > 0 ? (
                                    messages.map((msg, index) => (
                                        <div
                                            key={index}
                                            className={`message-item ${msg.sender_id === selectedUser?.user_id ? 'received' : 'sent'}`}
                                        >
                                            <div className="message-content">{msg.message}</div>
                                            <div className="message-time">{formatTime(msg.timestamp)}</div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="no-messages">
                                        <p>No messages yet. Start the conversation!</p>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            <div className="message-input">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    disabled={isSending}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage();
                                        }
                                    }}
                                />
                                <button 
                                    onClick={handleSendMessage}
                                    disabled={isSending || !newMessage.trim()}
                                    className={isSending ? 'loading' : ''}
                                >
                                    {isSending ? 'Sending...' : 'Send'}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="no-user-selected">
                            <div className="empty-state-icon">💬</div>
                            <h3>Select a conversation or start a new one</h3>
                            <p>Choose a user from the sidebar to see your messages</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default Messages;
