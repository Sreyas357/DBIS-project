import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ThreadList from '../components/ThreadList';
import ThreadCategoriesList from '../components/ThreadCategoriesList';
import '../css/threads.css';

const ThreadsByCategory = () => {
  const { categoryId } = useParams();
  const [threads, setThreads] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryName, setCategoryName] = useState('');
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchThreadsData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:4000/api/threads/category/${categoryId}`);
        
        if (response.ok) {
          const data = await response.json();
          setThreads(data);
          if (data.length > 0) {
            setCategoryName(data[0].category_name);
          }
        } else {
          console.error('Failed to fetch threads');
        }
      } catch (error) {
        console.error('Error fetching threads:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchThreadsData();
  }, [categoryId]);
  
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const response = await fetch('http://localhost:4000/api/thread-categories');
        
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
          
          // Set category name if not already set from threads
          if (!categoryName && data.length > 0) {
            const category = data.find(cat => cat.category_id.toString() === categoryId);
            if (category) {
              setCategoryName(category.name);
            }
          }
        } else {
          console.error('Failed to fetch thread categories');
        }
      } catch (error) {
        console.error('Error fetching thread categories:', error);
      } finally {
        setCategoriesLoading(false);
      }
    };
    
    fetchCategories();
  }, [categoryId, categoryName]);

  return (
    <div>
      <Navbar />
      <div className="threads-container">
        <div className="threads-sidebar">
          <ThreadCategoriesList 
            categories={categories} 
            loading={categoriesLoading} 
            selectedCategoryId={categoryId}
          />
        </div>
        <div className="threads-main">
          <div className="thread-category-header">
            <h2>{categoryName || 'Category Threads'}</h2>
          </div>
          <div className="thread-actions-bar">
            <button 
              className="create-thread-button"
              onClick={() => navigate(`/threads/create?category=${categoryId}`)}
            >
              Create Thread
            </button>
          </div>
          <ThreadList threads={threads} loading={loading} />
        </div>
      </div>
    </div>
  );
};

export default ThreadsByCategory;
