import React, { useState, useEffect } from 'react';
import '../css/star-rating.css';



// In your StarRating.jsx
const StarRating = ({ rating, interactive = false, onRate }) => {
  const [hoverRating, setHoverRating] = useState(0);
  const [currentRating, setCurrentRating] = useState(rating);

  useEffect(() => {
      setCurrentRating(rating); // Sync with parent when rating changes
  }, [rating]);

  const handleClick = (starValue) => {
      if (interactive && onRate) {
          // if(currentRating === starValue) {
          //     setCurrentRating(0); // Reset rating if the same star is clicked
          //     onRate(0); // Trigger API call with 0 rating
          // }else {
          //     setCurrentRating(starValue); // Immediate local update
          //     onRate(starValue); // Trigger API call
          // }
          if (currentRating === starValue) {
            setCurrentRating(0); // Reset rating if the same star is clicked
          }else {
            setCurrentRating(starValue); // Immediate local update
          }
          // setCurrentRating(starValue); // Immediate local update
          onRate(starValue); // Trigger API call
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