import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiUrl } from '../config/config';
import Navbar from '../components/Navbar';
import { ThemeContext } from '../components/ThemeContext';
import '../css/threads.css';

const ThreadDetail = () => {
  const { threadId } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useContext(ThemeContext);
  const [thread, setThread] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [commentLoading, setCommentLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [replyToComment, setReplyToComment] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);

  // Check login status
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const response = await fetch(`${apiUrl}/isLoggedIn`, {
          credentials: 'include'
        });
        
        if (response.status === 200) {
          const data = await response.json();
          setIsLoggedIn(true);
          setUsername(data.username || '');
        } else {
          setIsLoggedIn(false);
          setUsername('');
        }
      } catch (err) {
        console.error('Error checking login status:', err);
        setIsLoggedIn(false);
        setUsername('');
      }
    };

    checkLoginStatus();
  }, []);

  // Fetch thread details
  useEffect(() => {
    const fetchThread = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${apiUrl}/api/threads/${threadId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch thread');
        }
        const data = await response.json();
        setThread(data);
        document.title = `${data.title} | Thread Discussion`;
      } catch (err) {
        console.error('Error fetching thread:', err);
        setError('Failed to load thread. It may have been deleted or does not exist.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchThread();
  }, [threadId]);

  // Fetch comments
  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/threads/${threadId}/comments`);
        if (!response.ok) {
          throw new Error('Failed to fetch comments');
        }
        const data = await response.json();
        
        // Organize comments into a parent-child structure
        const parentComments = data.filter(comment => comment.comment_type === 'comment');
        const replies = data.filter(comment => comment.comment_type === 'reply');
        
        // Add replies to their parent comments
        const commentsWithReplies = parentComments.map(parent => {
          const commentReplies = replies.filter(reply => reply.parent_id === parent.comment_id);
          return {
            ...parent,
            replies: commentReplies
          };
        });
        
        setComments(commentsWithReplies);
      } catch (err) {
        console.error('Error fetching comments:', err);
        setError('Failed to load comments');
      }
    };

    if (threadId) {
      fetchComments();
    }
  }, [threadId]);

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) {
      return;
    }

    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    setCommentLoading(true);
    
    try {
      const response = await fetch(`${apiUrl}/api/threads/${threadId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ content: newComment.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to post comment');
      }

      const data = await response.json();
      
      // Add the new comment to the comments array with comment_type
      setComments(prevComments => [
        ...prevComments, 
        { 
          ...data, 
          comment_type: 'comment',
          replies: [] 
        }
      ]);
      setNewComment('');
    } catch (err) {
      console.error('Error posting comment:', err);
      setError(`Failed to post comment: ${err.message}`);
    } finally {
      setCommentLoading(false);
    }
  };
  
  const handleSubmitReply = async (e) => {
    e.preventDefault();
    
    if (!replyContent.trim() || !replyToComment) {
      return;
    }
    
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    
    setReplyLoading(true);
    
    try {
      const response = await fetch(`${apiUrl}/api/threads/${threadId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          content: replyContent.trim(),
          parentId: replyToComment.comment_id
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to post reply');
      }
      
      const data = await response.json();
      
      // Add the new reply with comment_type
      const replyWithType = {
        ...data,
        comment_type: 'reply'
      };
      
      // Add the new reply to the comments structure
      setComments(prevComments => {
        return prevComments.map(comment => {
          if (comment.comment_id === replyToComment.comment_id) {
            return {
              ...comment,
              replies: [...(comment.replies || []), replyWithType]
            };
          }
          return comment;
        });
      });
      
      // Reset reply form
      setReplyContent('');
      setReplyToComment(null);
    } catch (err) {
      console.error('Error posting reply:', err);
      setError(`Failed to post reply: ${err.message}`);
    } finally {
      setReplyLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Handle thread deletion
  const handleDeleteThread = async () => {
    if (!window.confirm('Delete this thread?')) {
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/api/threads/${threadId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete thread');
      }

      navigate('/threads');
    } catch (err) {
      console.error('Error deleting thread:', err);
      setError(`Failed to delete thread: ${err.message}`);
    }
  };

  if (isLoading) {
    return (
      <div className={isDarkMode ? 'dark-mode' : ''}>
        <Navbar />
        <div className="simple-container">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error && !thread) {
    return (
      <div className={isDarkMode ? 'dark-mode' : ''}>
        <Navbar />
        <div className="simple-container">
          <p>{error}</p>
          <Link to="/threads">Back to Threads</Link>
        </div>
      </div>
    );
  }

  // Calculate total comment count including replies
  const getTotalCommentCount = () => {
    return comments.reduce((count, comment) => {
      return count + 1 + (comment.replies?.length || 0);
    }, 0);
  };

  return (
    <div className={isDarkMode ? 'dark-mode' : ''}>
      <Navbar />
      <div className="simple-container">
        {thread && (
          <div className="simple-thread">
            <div className="simple-nav">
              <Link to="/threads">Back to Threads</Link>
            </div>
            
            <h1>{thread.title}</h1>
            <div className="simple-meta">
              <span>Posted by: {thread.username}</span>
              <span>{formatDate(thread.created_at)}</span>
              {thread.category_name && <span>Category: {thread.category_name}</span>}
            </div>
            
            <div className="simple-content">
              {thread.content.split('\n').map((paragraph, index) => (
                paragraph ? <p key={index}>{paragraph}</p> : <br key={index} />
              ))}
            </div>
            
            <div className="simple-actions">
              {isLoggedIn && thread.username === username && (
                <>
                  <Link to={`/threads/${threadId}/edit`}>Edit</Link>
                  <button onClick={handleDeleteThread}>Delete</button>
                </>
              )}
              <Link to={`/threads/${threadId}/reply`}>Reply</Link>
            </div>
            
            <div className="simple-comments">
              <h2>Comments ({getTotalCommentCount()})</h2>
              
              {isLoggedIn ? (
                <form onSubmit={handleSubmitComment} className="simple-form">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment"
                    required
                    disabled={commentLoading}
                  />
                  <button 
                    type="submit" 
                    disabled={commentLoading || !newComment.trim()}
                  >
                    {commentLoading ? 'Posting...' : 'Post'}
                  </button>
                </form>
              ) : (
                <p className="simple-login">
                  <Link to="/login">Log in</Link> to comment
                </p>
              )}
              
              {error && <p className="simple-error">{error}</p>}
              
              <div className="simple-comments-list">
                {comments.length === 0 ? (
                  <p>No comments yet</p>
                ) : (
                  comments.map(comment => (
                    <div key={comment.comment_id} className="simple-comment">
                      <div className="simple-comment-header">
                        <span className="comment-username">{comment.username}</span>
                        <span>{formatDate(comment.created_at)}</span>
                      </div>
                      <div className="simple-comment-content">
                        {comment.content.split('\n').map((paragraph, index) => (
                          paragraph ? <p key={index}>{paragraph}</p> : <br key={index} />
                        ))}
                      </div>
                      
                      {isLoggedIn && (
                        <div className="comment-actions">
                          <button 
                            className="reply-btn"
                            onClick={() => setReplyToComment(comment)}
                          >
                            Reply
                          </button>
                        </div>
                      )}
                      
                      {replyToComment && replyToComment.comment_id === comment.comment_id && (
                        <div className="reply-form">
                          <form onSubmit={handleSubmitReply} className="simple-form">
                            <textarea
                              value={replyContent}
                              onChange={(e) => setReplyContent(e.target.value)}
                              placeholder={`Reply to ${replyToComment.username}`}
                              required
                              disabled={replyLoading}
                            />
                            <div className="reply-form-actions">
                              <button
                                type="button"
                                className="cancel-reply-btn"
                                onClick={() => {
                                  setReplyToComment(null);
                                  setReplyContent('');
                                }}
                              >
                                Cancel
                              </button>
                              <button 
                                type="submit" 
                                disabled={replyLoading || !replyContent.trim()}
                              >
                                {replyLoading ? 'Posting...' : 'Post Reply'}
                              </button>
                            </div>
                          </form>
                        </div>
                      )}
                      
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="comment-replies">
                          <div style={{ 
                            fontSize: '0.8rem', 
                            color: 'var(--primary)', 
                            marginBottom: '0.5rem',
                            fontWeight: 'bold'
                          }}>
                            Replies ({comment.replies.length})
                          </div>
                          {comment.replies.map(reply => (
                            <div key={reply.comment_id} className="simple-reply">
                              <div className="simple-reply-header">
                                <span className="reply-username" style={{ display: 'flex', alignItems: 'center' }}>
                                  <span style={{ marginRight: '0.25rem', color: 'var(--primary)' }}>↪</span>
                                  {reply.username}
                                </span>
                                <span>{formatDate(reply.created_at)}</span>
                              </div>
                              <div className="simple-reply-content">
                                {reply.content.split('\n').map((paragraph, index) => (
                                  paragraph ? <p key={index}>{paragraph}</p> : <br key={index} />
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ThreadDetail;
