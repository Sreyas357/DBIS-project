import React, { useState, useEffect } from 'react';
import '../css/vote-buttons.css';

const VoteButtons = ({ entityType, entityId, initialUpvotes = 0, initialDownvotes = 0, initialUserVote = 0 }) => {
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [downvotes, setDownvotes] = useState(initialDownvotes);
  const [userVote, setUserVote] = useState(initialUserVote);
  const [isLoading, setIsLoading] = useState(false);
  
  // Update state if props change (e.g., when new data is loaded)
  useEffect(() => {
    setUpvotes(initialUpvotes);
    setDownvotes(initialDownvotes);
    setUserVote(initialUserVote);
  }, [initialUpvotes, initialDownvotes, initialUserVote]);
  
  const handleVote = async (voteType) => {
    if (isLoading) return;
    
    // Optimistic UI update
    const previousUserVote = userVote;
    const newVoteValue = userVote === voteType ? 0 : voteType;
    
    // Update local state immediately
    setUserVote(newVoteValue);
    
    // Calculate new vote counts
    if (previousUserVote === 1 && newVoteValue === 0) {
      setUpvotes(upvotes - 1);
    } else if (previousUserVote === -1 && newVoteValue === 0) {
      setDownvotes(downvotes - 1);
    } else if (newVoteValue === 1) {
      setUpvotes(upvotes + 1);
      if (previousUserVote === -1) {
        setDownvotes(downvotes - 1);
      }
    } else if (newVoteValue === -1) {
      setDownvotes(downvotes + 1);
      if (previousUserVote === 1) {
        setUpvotes(upvotes - 1);
      }
    }
    
    try {
      setIsLoading(true);
      console.log(`Submitting vote for ${entityType} ${entityId}: ${newVoteValue}`);
      
      const response = await fetch(`http://localhost:4000/api/${entityType}/${entityId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ voteValue: newVoteValue }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        // Revert local changes if the request failed
        setUserVote(previousUserVote);
        setUpvotes(initialUpvotes);
        setDownvotes(initialDownvotes);
        
        const errorData = await response.text();
        console.error(`Vote error (${response.status}):`, errorData);
        throw new Error(`Failed to register vote for ${entityType}`);
      }
      
      const data = await response.json();
      console.log(`Vote response for ${entityType} ${entityId}:`, data);
      
      // Update with server values in case they differ
      setUpvotes(data.upvotes);
      setDownvotes(data.downvotes);
      setUserVote(data.userVote);
    } catch (error) {
      console.error('Error voting:', error);
      // Alert user about the error
      alert(`Voting failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="vote-buttons">
      <button 
        className={`vote-button upvote ${userVote === 1 ? 'active' : ''}`}
        onClick={() => handleVote(1)}
        disabled={isLoading}
        aria-label="Upvote"
      >
        <i className="fas fa-arrow-up"></i>
      </button>
      
      <span className="vote-count">{upvotes - downvotes}</span>
      
      <button 
        className={`vote-button downvote ${userVote === -1 ? 'active' : ''}`}
        onClick={() => handleVote(-1)}
        disabled={isLoading}
        aria-label="Downvote"
      >
        <i className="fas fa-arrow-down"></i>
      </button>
    </div>
  );
};

export default VoteButtons;
