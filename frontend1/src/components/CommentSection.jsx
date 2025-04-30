import React, { useState, useEffect } from 'react';
import VoteButtons from './VoteButtons';
import '../css/comment-section.css';

// Component for replies (both direct replies to comments and nested replies)
const Reply = ({ reply, threadId, depth, onAddReply }) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [showReplies, setShowReplies] = useState(true);
  
  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    
    try {
      console.log("Submitting reply to a reply:", {
        content: replyContent,
        comment_id: reply.comment_id,
        parent_reply_id: reply.reply_id
      });
      
      // When replying to a reply, we pass the comment_id and the parent_reply_id
      await onAddReply(replyContent, reply.comment_id, reply.reply_id);
      setReplyContent('');
      setIsReplying(false);
    } catch (error) {
      console.error('Error adding reply:', error);
    }
  };
  
  return (
    <div className={`reply depth-${depth}`}>
      <div className="reply-vote-container">
        <VoteButtons 
          entityType="reply" 
          entityId={reply.reply_id}
          initialUpvotes={reply.upvotes || 0}
          initialDownvotes={reply.downvotes || 0}
          initialUserVote={reply.user_vote || 0}
        />
      </div>
      
      <div className="reply-content">
        <div className="reply-header">
          <span className="reply-author">{reply.username}</span>
          <span className="reply-date">{new Date(reply.created_at).toLocaleString()}</span>
        </div>
        
        <div className="reply-body">
          {reply.content.split('\n').map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
        
        <div className="reply-actions">
          <button 
            className="reply-button" 
            onClick={() => setIsReplying(!isReplying)}
          >
            {isReplying ? 'Cancel' : 'Reply'}
          </button>
        </div>
        
        {isReplying && (
          <form className="reply-form" onSubmit={handleReplySubmit}>
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write your reply..."
              rows={3}
              required
            />
            <div className="reply-form-actions">
              <button type="submit">Submit Reply</button>
              <button type="button" onClick={() => setIsReplying(false)}>Cancel</button>
            </div>
          </form>
        )}
        
        {/* Render child replies with increased depth */}
        {reply.childReplies && reply.childReplies.length > 0 && showReplies && (
          <div className="nested-replies">
            {reply.childReplies.map((childReply) => (
              <Reply
                key={childReply.reply_id}
                reply={childReply}
                threadId={threadId}
                depth={depth + 1}
                onAddReply={onAddReply}
              />
            ))}
          </div>
        )}
        
        {/* Toggle for showing/hiding child replies if there are many */}
        {reply.childReplies && reply.childReplies.length > 3 && (
          <button 
            className="toggle-replies-small" 
            onClick={() => setShowReplies(!showReplies)}
          >
            {showReplies ? `Hide ${reply.childReplies.length} replies` : `Show ${reply.childReplies.length} replies`}
          </button>
        )}
      </div>
    </div>
  );
};

const Comment = ({ comment, threadId, onAddReply }) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [showReplies, setShowReplies] = useState(true);
  
  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    
    try {
      console.log("Comment submitting reply:", {
        content: replyContent,
        commentId: comment.comment_id,
        parentReplyId: null // null indicates it's a direct reply to comment
      });
      
      // When replying to a comment, we pass the comment_id and null as parent_reply_id
      await onAddReply(replyContent, comment.comment_id, null);
      setReplyContent('');
      setIsReplying(false);
    } catch (error) {
      console.error('Error adding reply:', error);
    }
  };
  
  return (
    <div className="comment">
      <div className="comment-vote-container">
        <VoteButtons 
          entityType="comment" 
          entityId={comment.comment_id}
          initialUpvotes={comment.upvotes || 0}
          initialDownvotes={comment.downvotes || 0}
          initialUserVote={comment.user_vote || 0}
        />
      </div>
      
      <div className="comment-content">
        <div className="comment-header">
          <span className="comment-author">{comment.username}</span>
          <span className="comment-date">{new Date(comment.created_at).toLocaleString()}</span>
        </div>
        
        <div className="comment-body">
          {comment.content.split('\n').map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
        
        <div className="comment-actions">
          <button 
            className="reply-button" 
            onClick={() => setIsReplying(!isReplying)}
          >
            {isReplying ? 'Cancel' : 'Reply'}
          </button>
        </div>
        
        {isReplying && (
          <form className="reply-form" onSubmit={handleReplySubmit}>
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write your reply..."
              rows={3}
              required
            />
            <div className="reply-form-actions">
              <button type="submit">Submit Reply</button>
              <button type="button" onClick={() => setIsReplying(false)}>Cancel</button>
            </div>
          </form>
        )}
        
        {comment.replies && comment.replies.length > 0 && (
          <div className="comment-replies">
            {showReplies ? (
              <>
                <button 
                  className="toggle-replies-button" 
                  onClick={() => setShowReplies(false)}
                >
                  Hide Replies ({comment.replies.length})
                </button>
                <div className="replies-list">
                  {comment.replies.map((reply) => (
                    <Reply
                      key={reply.reply_id}
                      reply={reply}
                      threadId={threadId}
                      depth={1} // Start at depth 1 for direct replies to comments
                      onAddReply={onAddReply}
                    />
                  ))}
                </div>
              </>
            ) : (
              <button 
                className="toggle-replies-button" 
                onClick={() => setShowReplies(true)}
              >
                Show Replies ({comment.replies.length})
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const CommentSection = ({ comments, threadId, onAddComment }) => {
  const [commentContent, setCommentContent] = useState('');
  const [processedComments, setProcessedComments] = useState([]);
  
  // Process comments and replies to create a hierarchical tree structure
  useEffect(() => {
    if (!comments || !comments.length) {
      setProcessedComments([]);
      return;
    }
    
    // Separate comments and replies
    const commentsArray = [];
    const repliesMap = {};
    
    comments.forEach(item => {
      if (item.hasOwnProperty('comment_id') && !item.hasOwnProperty('reply_id')) {
        // This is a comment
        commentsArray.push({
          ...item,
          replies: []
        });
      } else if (item.hasOwnProperty('reply_id')) {
        // This is a reply
        repliesMap[item.reply_id] = {
          ...item,
          childReplies: []
        };
      }
    });
    
    console.log('Replies map before processing:', repliesMap);
    
    // Step 1: Identify direct replies to comments (parent_reply_id is null)
    const commentToRepliesMap = {};
    
    Object.values(repliesMap).forEach(reply => {
      if (reply.parent_reply_id === null) {
        // This is a direct reply to a comment
        if (!commentToRepliesMap[reply.comment_id]) {
          commentToRepliesMap[reply.comment_id] = [];
        }
        commentToRepliesMap[reply.comment_id].push(reply);
      }
    });
    
    // Step 2: Build reply trees - connect replies to their parent replies
    Object.values(repliesMap).forEach(reply => {
      if (reply.parent_reply_id !== null && repliesMap[reply.parent_reply_id]) {
        // This is a reply to another reply
        if (!repliesMap[reply.parent_reply_id].childReplies) {
          repliesMap[reply.parent_reply_id].childReplies = [];
        }
        repliesMap[reply.parent_reply_id].childReplies.push(reply);
      }
    });
    
    // Step 3: Attach root replies to their comments
    commentsArray.forEach(comment => {
      const repliesForComment = commentToRepliesMap[comment.comment_id] || [];
      comment.replies = repliesForComment;
    });
    
    console.log('Processed comments structure:', commentsArray);
    setProcessedComments(commentsArray);
  }, [comments]);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentContent.trim()) return;
    
    try {
      await onAddComment(commentContent);
      setCommentContent('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };
  
  const handleAddReply = async (content, commentId, parentReplyId) => {
    try {
      console.log("Submitting reply with payload:", {
        content,
        comment_id: commentId,
        parent_reply_id: parentReplyId
      });
      
      const payload = { 
        content,
        comment_id: commentId
      };
      
      // Only include parent_reply_id if it's not null
      if (parentReplyId !== null && parentReplyId !== undefined) {
        payload.parent_reply_id = parentReplyId;
      }
      
      const response = await fetch(`http://localhost:4000/api/threads/${threadId}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error("Reply submission error:", errorData);
        throw new Error(`Failed to post reply: ${response.status}`);
      }
      
      const result = await response.json();
      console.log("Reply posted successfully:", result);
      
      // Refresh the page to show the new reply
      window.location.reload();
      
      return true;
    } catch (error) {
      console.error('Error posting reply:', error);
      alert(`Failed to submit reply: ${error.message}`);
      throw error;
    }
  };
  
  return (
    <div className="comment-section">
      <h2 className="comment-section-title">
        Comments ({processedComments ? processedComments.length : 0})
      </h2>
      
      <form className="comment-form" onSubmit={handleCommentSubmit}>
        <textarea
          value={commentContent}
          onChange={(e) => setCommentContent(e.target.value)}
          placeholder="Add a comment..."
          rows={4}
          required
        />
        <button type="submit" className="submit-comment-button">Post Comment</button>
      </form>
      
      <div className="comments-list">
        {processedComments.length > 0 ? (
          processedComments.map((comment) => (
            <Comment 
              key={comment.comment_id} 
              comment={comment} 
              threadId={threadId}
              onAddReply={handleAddReply} 
            />
          ))
        ) : (
          <p className="no-comments">No comments yet. Be the first to comment!</p>
        )}
      </div>
    </div>
  );
};

export default CommentSection;
