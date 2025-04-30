import React from 'react';
import { Link } from 'react-router-dom';
import '../css/threads.css';

const ThreadList = ({ threads, loading }) => {
  if (loading) {
    return (
      <div className="thread-list-loading">
        <p>Loading threads...</p>
      </div>
    );
  }

  if (!threads || threads.length === 0) {
    return (
      <div className="thread-list-empty">
        <p>No threads found. Be the first to create a discussion!</p>
      </div>
    );
  }

  return (
    <div className="thread-list">
      {threads.map(thread => (
        <div key={thread.thread_id} className="thread-list-item">
          <div className="thread-vote-area">
            <div className="vote-count">{thread.upvotes - thread.downvotes}</div>
          </div>
          <div className="thread-content">
            <div className="thread-header">
              <Link to={`/threads/${thread.thread_id}`} className="thread-title">
                {thread.is_pinned && <span className="pinned-indicator">📌 </span>}
                {thread.title}
              </Link>
              {thread.category_name && (
                <span 
                  className="thread-category" 
                  style={{ backgroundColor: thread.category_color || '#6c757d' }}
                >
                  {thread.category_name}
                </span>
              )}
              {thread.book_title && (
                <Link to={`/books/${thread.book_id}`} className="thread-book">
                  📚 {thread.book_title}
                </Link>
              )}
            </div>
            <div className="thread-meta">
              Posted by <Link to={`/user/${thread.username}`}>{thread.username}</Link> 
              {' '}&bull;{' '}
              {new Date(thread.created_at).toLocaleDateString()}
              {' '}&bull;{' '}
              <span className="comment-count">
                {thread.comment_count} comment{thread.comment_count !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ThreadList;
