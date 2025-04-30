import React, { useState, useEffect } from 'react';
import '../css/star-rating.css';

const StarRating = ({ rating, interactive = false, onRate }) => {
  const [hoverRating, setHoverRating] = useState(0);
  const [currentRating, setCurrentRating] = useState(rating);

  useEffect(() => {
      setCurrentRating(rating); // Sync with parent when rating changes
  }, [rating]);

  const handleClick = (starValue) => {
      if (interactive && onRate) {
          if(currentRating === starValue) {
              // If clicking the same star, reset the rating
              setCurrentRating(0);
              onRate(0);
          } else {
              // New rating or changing rating
              setCurrentRating(starValue);
              onRate(starValue);
          }
      }
  };

  return (
      <div className="star-rating">
          {[...Array(5)].map((_, index) => {
              const starValue = index + 1;
              return (
                  <span
                      key={index}
                      className={`star ${
                          starValue <= (hoverRating || currentRating) ? 'filled' : ''
                      } ${interactive ? 'interactive' : ''}`}
                      onClick={() => handleClick(starValue)}
                      onMouseEnter={() => interactive && setHoverRating(starValue)}
                      onMouseLeave={() => interactive && setHoverRating(0)}
                  >
                      ★
                  </span>
              );
          })}
      </div>
  );
};

export default StarRating;