import React from 'react';
import { Link } from 'react-router-dom';
import '../css/thread-categories.css';

const ThreadCategoriesList = ({ categories, loading, selectedCategoryId }) => {
  if (loading) {
    return <div className="categories-loading">Loading categories...</div>;
  }
  
  if (!categories || categories.length === 0) {
    return <div className="categories-empty">No categories found</div>;
  }
  
  return (
    <div className="thread-categories-list">
      <h3>Categories</h3>
      <ul>
        <li className={selectedCategoryId === 'all' ? 'active' : ''}>
          <Link to="/threads">All Threads</Link>
        </li>
        <li className={selectedCategoryId === 'subscribed' ? 'active' : ''}>
          <Link to="/threads/subscribed">My Subscriptions</Link>
        </li>
        {categories.map(category => (
          <li 
            key={category.category_id} 
            className={selectedCategoryId === category.category_id.toString() ? 'active' : ''}
          >
            <Link to={`/threads/category/${category.category_id}`}>
              <span 
                className="category-color-dot" 
                style={{ backgroundColor: category.color || '#6c757d' }}
              ></span>
              {category.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ThreadCategoriesList;
