import React, { useState, useEffect, useContext, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { apiUrl } from '../config/config';
import { ThemeContext } from '../components/ThemeContext';
import "../styles/Threads.css";

// Add CSS for nested replies
const replyStyles = {
    nestedReplies: {
        marginLeft: '20px',
        borderLeft: '2px solid #ddd',
        paddingLeft: '10px'
    },
    replyCard: (depth) => ({
        marginBottom: '10px',
        backgroundColor: depth % 2 === 0 ? '#f9f9f9' : '#f0f0f0',
        padding: '10px',
        borderRadius: '8px'
    })
};

const ThreadDetail = () => {
    const [thread, setThread] = useState(null);
    const [comments, setComments] = useState([]);
    const [commentContent, setCommentContent] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState('');
    const [userId, setUserId] = useState(null);
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyContent, setReplyContent] = useState('');
    const [showReplies, setShowReplies] = useState({});
    const { isDarkMode } = useContext(ThemeContext);
    const { threadId } = useParams();
    const navigate = useNavigate();
    const commentFormRef = useRef(null);
    
    // Check if user is logged in
    useEffect(() => {
        const checkLoginStatus = async () => {
            try {
                console.log('Checking login status for ThreadDetail...');
                const response = await fetch(`${apiUrl}/isLoggedIn`, {
                    credentials: 'include'
                });
                
                console.log('Login status response:', response.status);
                if (response.status === 200) {
                    const data = await response.json();
                    console.log('Login data:', data);
                    
                    if (data && data.username) {
                        setIsLoggedIn(true);
                        setUsername(data.username || '');
                        setUserId(data.user_id || null);
                        console.log(`User logged in as ${data.username} (ID: ${data.user_id})`);
                    } else {
                        console.warn('Received 200 status but invalid user data:', data);
                        setIsLoggedIn(false);
                        setUsername('');
                        setUserId(null);
                    }
                } else {
                    console.log('User not logged in, status:', response.status);
                    setIsLoggedIn(false);
                    setUsername('');
                    setUserId(null);
                }
            } catch (err) {
                console.error('Error checking login status:', err);
                setIsLoggedIn(false);
                setUsername('');
                setUserId(null);
            }
        };

        checkLoginStatus();
    }, []);

    // Fetch thread details
    useEffect(() => {
        const fetchThreadDetails = async () => {
            setIsLoading(true);
            try {
                console.log(`Fetching thread details for ID: ${threadId}`);
                
                // Increment view count
                await fetch(`${apiUrl}/api/threads/${threadId}/view`, {
                    method: 'POST',
                    credentials: 'include'
                });
                
                // Fetch thread details
                const response = await fetch(`${apiUrl}/api/threads/${threadId}`);
                console.log('Thread details response status:', response.status);
                
                if (!response.ok) {
                    throw new Error('Failed to fetch thread details');
                }
                
                const data = await response.json();
                console.log('Thread details data:', data);
                setThread(data);
                
                // Fetch comments
                await fetchComments();
                
                setError(null);
            } catch (err) {
                console.error('Error fetching thread details:', err);
                setError('Failed to load thread details');
            } finally {
                setIsLoading(false);
            }
        };

        if (threadId) {
            fetchThreadDetails();
        }
    }, [threadId]);

    // Fetch comments for this thread
    const fetchComments = async () => {
        try {
            console.log(`Fetching comments for thread ${threadId}...`);
            const response = await fetch(`${apiUrl}/api/threads/${threadId}/comments`);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                console.error('Error fetching comments:', errorData);
                throw new Error(`Failed to fetch comments: ${errorData?.message || response.statusText}`);
            }
            
            const data = await response.json();
            console.log(`Fetched ${data.length} comments for thread ${threadId}`, data);
            setComments(data);
            
            // Initialize showReplies state based on comments
            const repliesState = {};
            data.forEach(comment => {
                repliesState[comment.comment_id] = false;
            });
            setShowReplies(repliesState);
            
        } catch (err) {
            console.error('Error fetching comments:', err);
            // Don't set error state here to avoid overriding thread error
        }
    };

    // Format date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    // Get user initials for avatar
    const getUserInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    };

    // Handle comment submission
    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        
        if (!isLoggedIn) {
            alert('Please log in to post a comment');
            return;
        }
        
        if (!commentContent.trim()) {
            return;
        }
        
        console.log('Submitting comment:', {
            content: commentContent
        });
        
        try {
            // The backend API expects only content for new comments
            // It will extract thread_id from URL params and user_id from session
            const requestBody = {
                content: commentContent
            };
            
            console.log(`Posting comment to ${apiUrl}/api/threads/${threadId}/comments`);
            console.log('Request body:', requestBody);
            
            const response = await fetch(`${apiUrl}/api/threads/${threadId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(requestBody)
            });
            
            console.log('Comment post response status:', response.status);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                console.error('Error response:', errorData);
                throw new Error(`Failed to post comment: ${errorData?.message || response.statusText}`);
            }
            
            const responseData = await response.json().catch(() => ({}));
            console.log('Comment post success:', responseData);
            
            // Clear form and reload comments
            setCommentContent('');
            await fetchComments();
            
            // Update the thread object to reflect the new comment count
            setThread(prev => ({
                ...prev,
                comment_count: (prev.comment_count || 0) + 1
            }));
        } catch (err) {
            console.error('Error posting comment:', err);
            alert('Failed to post comment. Please try again.');
        }
    };

    // Toggle reply form for a specific comment
    const toggleReplyForm = (commentId) => {
        setReplyingTo(replyingTo === commentId ? null : commentId);
        setReplyContent('');
    };

    // Toggle showing replies for a specific comment
    const toggleReplies = async (commentId) => {
        // If we're showing replies for this comment, just toggle the state
        setShowReplies(prev => ({
            ...prev,
            [commentId]: !prev[commentId]
        }));
        
        // If we haven't loaded the replies for this comment yet, fetch them
        if (!comments.find(c => c.comment_id === commentId).replies) {
            try {
                const response = await fetch(`${apiUrl}/api/comments/${commentId}/replies`);
                if (!response.ok) {
                    throw new Error('Failed to fetch replies');
                }
                
                const data = await response.json();
                
                // Update the comments array with the replies
                setComments(prev => 
                    prev.map(comment => 
                        comment.comment_id === commentId 
                            ? { ...comment, replies: data } 
                            : comment
                    )
                );
            } catch (err) {
                console.error('Error fetching replies:', err);
                alert('Failed to load replies. Please try again.');
            }
        }
    };

    // Handle reply submission
    const handleReplySubmit = async (e, commentId) => {
        e.preventDefault();
        
        if (!isLoggedIn) {
            alert('Please log in to post a reply');
            return;
        }
        
        if (!replyContent.trim()) {
            return;
        }
        
        console.log('Submitting reply to comment:', {
            commentId,
            content: replyContent
        });
        
        try {
            // Backend expects only content and optionally parent_reply_id
            const requestBody = {
                content: replyContent
                // reply_parent_id is not needed for direct replies to comments
            };
            
            console.log(`Posting reply to ${apiUrl}/api/comments/${commentId}/replies`);
            console.log('Request body:', requestBody);
            
            const response = await fetch(`${apiUrl}/api/comments/${commentId}/replies`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(requestBody)
            });
            
            console.log('Reply post response status:', response.status);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                console.error('Error response:', errorData);
                throw new Error(`Failed to post reply: ${errorData?.message || response.statusText}`);
            }
            
            const responseData = await response.json().catch(() => ({}));
            console.log('Reply post success:', responseData);
            
            // Clear form and reload replies
            setReplyContent('');
            setReplyingTo(null);
            
            // Fetch updated replies
            try {
                const repliesResponse = await fetch(`${apiUrl}/api/comments/${commentId}/replies`);
                if (repliesResponse.ok) {
                    const repliesData = await repliesResponse.json();
                    
                    // Update the comments array with the new replies
                    setComments(prev => 
                        prev.map(comment => 
                            comment.comment_id === commentId 
                                ? { ...comment, replies: repliesData } 
                                : comment
                        )
                    );
                    
                    // Make sure replies are shown
                    setShowReplies(prev => ({
                        ...prev,
                        [commentId]: true
                    }));
                }
            } catch (err) {
                console.error('Error fetching updated replies:', err);
            }
        } catch (err) {
            console.error('Error posting reply:', err);
            alert(`Failed to post reply: ${err.message}`);
        }
    };

    // Handle reply to reply
    const handleReplyToReply = async (e, commentId, parentReplyId) => {
        e.preventDefault();
        
        if (!isLoggedIn) {
            alert('Please log in to post a reply');
            return;
        }
        
        if (!replyContent.trim()) {
            return;
        }
        
        console.log('Submitting reply to reply:', {
            commentId,
            parentReplyId,
            content: replyContent
        });
        
        try {
            // For replies to replies, we need to include the parent_reply_id
            const requestBody = {
                content: replyContent,
                parent_reply_id: parentReplyId
            };
            
            console.log(`Posting reply to ${apiUrl}/api/comments/${commentId}/replies`);
            console.log('Request body:', requestBody);
            
            const response = await fetch(`${apiUrl}/api/comments/${commentId}/replies`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(requestBody)
            });
            
            console.log('Reply post response status:', response.status);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                console.error('Error response:', errorData);
                throw new Error(`Failed to post reply: ${errorData?.message || response.statusText}`);
            }
            
            const responseData = await response.json().catch(() => ({}));
            console.log('Reply to reply post success:', responseData);
            
            // Clear form and reload replies
            setReplyContent('');
            setReplyingTo(null);
            
            // Fetch updated replies
            try {
                const repliesResponse = await fetch(`${apiUrl}/api/comments/${commentId}/replies`);
                if (repliesResponse.ok) {
                    const repliesData = await repliesResponse.json();
                    
                    // Update the comments array with the new replies
                    setComments(prev => 
                        prev.map(comment => 
                            comment.comment_id === commentId 
                                ? { ...comment, replies: repliesData } 
                                : comment
                        )
                    );
                    
                    // Make sure replies are shown
                    setShowReplies(prev => ({
                        ...prev,
                        [commentId]: true
                    }));
                }
            } catch (err) {
                console.error('Error fetching updated replies:', err);
            }
        } catch (err) {
            console.error('Error posting reply to reply:', err);
            alert(`Failed to post reply: ${err.message}`);
        }
    };

    // Render replies for a comment
    const renderReplies = (comment) => {
        if (!comment.replies || comment.replies.length === 0) {
            return <div className="no-replies">No replies yet</div>;
        }
        
        // Organize replies into a tree structure
        const replyTree = {};
        const topLevelReplies = [];
        
        // First pass: create nodes for all replies
        comment.replies.forEach(reply => {
            reply.children = [];
            replyTree[reply.reply_id] = reply;
        });
        
        // Second pass: organize into parent-child relationships
        comment.replies.forEach(reply => {
            if (reply.reply_parent_id === null || reply.reply_parent_id === -1) {
                // This is a top-level reply (directly to comment)
                topLevelReplies.push(reply);
            } else if (replyTree[reply.reply_parent_id]) {
                // This is a reply to another reply
                replyTree[reply.reply_parent_id].children.push(reply);
            } else {
                // Fallback if parent reply doesn't exist
                topLevelReplies.push(reply);
            }
        });
        
        // Recursive function to render a reply and its children
        const renderReply = (reply, depth = 0) => (
            <div 
                key={reply.reply_id} 
                className={`thread-card reply-card depth-${depth}`} 
                style={replyStyles.replyCard(depth)}
            >
                <div className="thread-meta">
                    <div className="thread-author">
                        <div className="thread-author-avatar">
                            {getUserInitials(reply.username)}
                        </div>
                        <Link to={`/user/${reply.username}`} className="thread-author-name">
                            {reply.username}
                        </Link>
                    </div>
                    <div className="thread-date">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
                            <path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8zm1-8.414V7a1 1 0 1 0-2 0v5c0 .266.105.52.293.707l3 3a1 1 0 1 0 1.414-1.414L13 11.586z"/>
                        </svg>
                        {formatDate(reply.created_at)}
                    </div>
                </div>
                <div className="thread-content-detail">
                    <p>{reply.content}</p>
                </div>
                {isLoggedIn && (
                    <div className="thread-footer">
                        <button 
                            className="reply-btn" 
                            onClick={() => {
                                setReplyingTo(`reply-${comment.comment_id}-${reply.reply_id}`);
                                setReplyContent('');
                            }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
                                <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/>
                            </svg>
                            Reply
                        </button>
                    </div>
                )}
                
                {/* Reply to reply form */}
                {replyingTo === `reply-${comment.comment_id}-${reply.reply_id}` && (
                    <form 
                        className="reply-form" 
                        onSubmit={(e) => handleReplyToReply(e, comment.comment_id, reply.reply_id)}
                    >
                        <textarea
                            placeholder="Write your reply..."
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            required
                        ></textarea>
                        <div className="form-actions">
                            <button 
                                type="button" 
                                className="cancel-btn"
                                onClick={() => setReplyingTo(null)}
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                className="submit-btn"
                                disabled={!replyContent.trim()}
                            >
                                Reply
                            </button>
                        </div>
                    </form>
                )}
                
                {/* Render child replies recursively */}
                {reply.children && reply.children.length > 0 && (
                    <div className="nested-replies" style={replyStyles.nestedReplies}>
                        {reply.children.map(childReply => renderReply(childReply, depth + 1))}
                    </div>
                )}
            </div>
        );
        
        return (
            <div className="replies-list">
                {topLevelReplies.map(reply => renderReply(reply))}
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className={`threads-container ${isDarkMode ? 'dark-mode' : ''}`}>
                <div className="threads-content">
                    <div className="loading-spinner">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                            <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" opacity=".25"/>
                            <path d="M20 12h2A10 10 0 0 0 12 2v2a8 8 0 0 1 8 8z"/>
                        </svg>
                        Loading thread...
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`threads-container ${isDarkMode ? 'dark-mode' : ''}`}>
                <div className="threads-content">
                    <div className="error-message">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                            <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM11 7h2v6h-2V7zm0 8h2v2h-2v-2z"/>
                        </svg>
                        {error}
                    </div>
                </div>
            </div>
        );
    }

    if (!thread) {
        return (
            <div className={`threads-container ${isDarkMode ? 'dark-mode' : ''}`}>
                <div className="threads-content">
                    <div className="no-threads">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48">
                            <path d="M20 2H4c-1.103 0-2 .897-2 2v18l4-4h14c1.103 0 2-.897 2-2V4c0-1.103-.897-2-2-2zm0 14H5.17l-.59.59-.58.58V4h16v12z"/>
                        </svg>
                        <p>Thread not found</p>
                        <Link to="/threads" className="create-thread-btn">
                            Back to Threads
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`threads-container thread-detail-view ${isDarkMode ? 'dark-mode' : ''}`}>
            <div className="threads-content">
                <div className="thread-detail">
                    <button 
                        className="back-btn" 
                        onClick={() => navigate('/threads')}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
                            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                        </svg>
                        Back to Threads
                    </button>
                    
                    <div className="thread-card">
                        <div className="thread-card-header">
                            <h2 className="thread-title">{thread.title}</h2>
                        </div>
                        
                        <div className="thread-meta">
                            <div className="thread-author">
                                <div className="thread-author-avatar">
                                    {getUserInitials(thread.username)}
                                </div>
                                <Link to={`/user/${thread.username}`} className="thread-author-name">
                                    {thread.username}
                                </Link>
                            </div>
                            <div className="thread-date">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
                                    <path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8zm1-8.414V7a1 1 0 1 0-2 0v5c0 .266.105.52.293.707l3 3a1 1 0 1 0 1.414-1.414L13 11.586z"/>
                                </svg>
                                {formatDate(thread.created_at)}
                            </div>
                            {thread.category_name && (
                                <div className="thread-category">
                                    {thread.category_name}
                                </div>
                            )}
                        </div>
                        
                        <div className="thread-content-detail">
                            <p>{thread.content}</p>
                        </div>
                        
                        <div className="thread-footer">
                            <div className="thread-stats">
                                <div className="thread-stat">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
                                        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                                    </svg>
                                    {thread.view_count || 0} views
                                </div>
                                <div className="thread-stat">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
                                        <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/>
                                    </svg>
                                    {comments.length || 0} comments
                                </div>
                            </div>
                            
                            {thread.user_id === userId && (
                                <Link 
                                    to={`/threads/${thread.thread_id}/edit`}
                                    className="reply-btn"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
                                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                                    </svg>
                                    Edit
                                </Link>
                            )}
                        </div>
                    </div>
                    
                    <div className="comments-section">
                        <h2>Comments</h2>
                        
                        {isLoggedIn ? (
                            <form 
                                className="comment-form" 
                                onSubmit={handleCommentSubmit}
                                ref={commentFormRef}
                            >
                                <textarea
                                    placeholder="Write a comment..."
                                    value={commentContent}
                                    onChange={(e) => setCommentContent(e.target.value)}
                                    required
                                ></textarea>
                                <div className="form-actions">
                                    <button 
                                        type="submit" 
                                        className="submit-btn"
                                        disabled={!commentContent.trim()}
                                    >
                                        Post Comment
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="login-prompt">
                                <p>You need to be logged in to post comments.</p>
                                <Link to="/login">Log in</Link>
                            </div>
                        )}
                        
                        <div className="comments-list">
                            {comments.length === 0 ? (
                                <div className="no-comments">
                                    <p>No comments yet. Be the first to comment!</p>
                                </div>
                            ) : (
                                comments.map(comment => (
                                    <div key={comment.comment_id} className="thread-card">
                                        <div className="thread-meta">
                                            <div className="thread-author">
                                                <div className="thread-author-avatar">
                                                    {getUserInitials(comment.username)}
                                                </div>
                                                <Link to={`/user/${comment.username}`} className="thread-author-name">
                                                    {comment.username}
                                                </Link>
                                            </div>
                                            <div className="thread-date">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
                                                    <path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8zm1-8.414V7a1 1 0 1 0-2 0v5c0 .266.105.52.293.707l3 3a1 1 0 1 0 1.414-1.414L13 11.586z"/>
                                                </svg>
                                                {formatDate(comment.created_at)}
                                            </div>
                                        </div>
                                        <div className="thread-content-detail">
                                            <p>{comment.content}</p>
                                        </div>
                                        <div className="thread-footer">
                                            {isLoggedIn && (
                                                <button 
                                                    className="reply-btn" 
                                                    onClick={() => toggleReplyForm(comment.comment_id)}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
                                                        <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/>
                                                    </svg>
                                                    Reply
                                                </button>
                                            )}
                                            
                                            <button 
                                                className="reply-btn" 
                                                onClick={() => toggleReplies(comment.comment_id)}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
                                                    <path d="M7 14l5-5 5 5z"/>
                                                </svg>
                                                {showReplies[comment.comment_id] ? 'Hide Replies' : 'Show Replies'}
                                                {comment.replies && comment.replies.length > 0 && ` (${comment.replies.length})`}
                                            </button>
                                        </div>
                                        
                                        {/* Reply form */}
                                        {replyingTo === comment.comment_id && (
                                            <form 
                                                className="reply-form" 
                                                onSubmit={(e) => handleReplySubmit(e, comment.comment_id)}
                                            >
                                                <textarea
                                                    placeholder="Write your reply..."
                                                    value={replyContent}
                                                    onChange={(e) => setReplyContent(e.target.value)}
                                                    required
                                                ></textarea>
                                                <div className="form-actions">
                                                    <button 
                                                        type="button" 
                                                        className="cancel-btn"
                                                        onClick={() => setReplyingTo(null)}
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button 
                                                        type="submit" 
                                                        className="submit-btn"
                                                        disabled={!replyContent.trim()}
                                                    >
                                                        Reply
                                                    </button>
                                                </div>
                                            </form>
                                        )}
                                        
                                        {/* Display replies if showReplies is true for this comment */}
                                        {showReplies[comment.comment_id] && renderReplies(comment)}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ThreadDetail;
