import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import CommentSection from '../components/CommentSection';
import VoteButtons from '../components/VoteButtons';
import SubscribeButton from '../components/SubscribeButton';
import '../css/thread-detail.css';

const ThreadDetail = () => {
  const { threadId } = useParams();
  const [thread, setThread] = useState(null);
  const [comments, setComments] = useState([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [userVote, setUserVote] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchThreadData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:4000/api/threads/${threadId}`, {
          credentials: 'include'
        });
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Thread not found');
          } else {
            setError('Failed to fetch thread');
          }
          return;
        }
        
        const data = await response.json();
        setThread(data.thread);
        setComments(data.comments);
        setIsSubscribed(data.isSubscribed);
        setUserVote(data.userVote);
      } catch (error) {
        console.error('Error fetching thread:', error);
        setError('Error loading thread');
      } finally {
        setLoading(false);
      }
    };
    
    fetchThreadData();
  }, [threadId]);

  const handleAddComment = async (content) => {
    try {
      const response = await fetch(`http://localhost:4000/api/threads/${threadId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to post comment');
      }
      
      const newComment = await response.json();
      setComments([...comments, newComment]);
      
      // Update thread comment count
      if (thread) {
        setThread({
          ...thread,
          comment_count: thread.comment_count + 1,
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error posting comment:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="thread-detail-container">
          <div className="loading-spinner">Loading thread...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Navbar />
        <div className="thread-detail-container">
          <div className="error-message">
            <h3>{error}</h3>
            <button onClick={() => navigate('/threads')}>Back to Threads</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="thread-detail-container">
        {thread && (
          <>
            <div className="thread-navigation">
              <Link to="/threads">Threads</Link>
              {thread.category_name && (
                <>
                  <span className="nav-separator">/</span>
                  <Link to={`/threads/category/${thread.category_id}`}>{thread.category_name}</Link>
                </>
              )}
            </div>
            
            <div className="thread-header">
              <div className="thread-vote-container">
                <VoteButtons 
                  entityType="thread" 
                  entityId={thread.thread_id} 
                  initialUpvotes={thread.upvotes}
                  initialDownvotes={thread.downvotes}
                  initialUserVote={userVote}
                />
              </div>
              
              <div className="thread-title-area">
                <h1 className="thread-title">
                  {thread.is_pinned && <span className="pinned-indicator">📌 </span>}
                  {thread.title}
                </h1>
                
                <div className="thread-meta">
                  Posted by <Link to={`/user/${thread.username}`}>{thread.username}</Link> 
                  {' '}&bull;{' '}
                  {new Date(thread.created_at).toLocaleString()}
                  {' '}&bull;{' '}
                  {thread.view_count} views
                  {thread.category_name && (
                    <>
                      {' '}&bull;{' '}
                      <span 
                        className="thread-category" 
                        style={{ backgroundColor: thread.category_color || '#6c757d' }}
                      >
                        {thread.category_name}
                      </span>
                    </>
                  )}
                </div>
              </div>
              
              <div className="thread-actions">
                <SubscribeButton 
                  threadId={thread.thread_id} 
                  initialIsSubscribed={isSubscribed} 
                />
              </div>
            </div>
            
            {thread.book_title && (
              <div className="thread-book-info">
                <div className="book-cover">
                  {thread.book_coverurl && (
                    <img src={thread.book_coverurl} alt={thread.book_title} />
                  )}
                </div>
                <div className="book-details">
                  <h3>Related Book</h3>
                  <Link to={`/books/${thread.book_id}`} className="book-title">
                    {thread.book_title}
                  </Link>
                  {thread.book_author && (
                    <div className="book-author">by {thread.book_author}</div>
                  )}
                </div>
              </div>
            )}
            
            <div className="thread-content">
              {thread.content.split('\n').map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
            
            <CommentSection 
              comments={comments} 
              threadId={thread.thread_id} 
              onAddComment={handleAddComment} 
            />
          </>
        )}
      </div>
    </div>
  );
};

export default ThreadDetail;
