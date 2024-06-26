import React, { useState, useReducer, useEffect, useCallback, useMemo } from 'react';
import useLocalStorage from './hooks/useLocalStorage';
import './App.css';

interface Book {
  id: number;
  title: string;
  author: string;
  year: number;
}

// Define the action types for the reducer
type ActionType =
  | { type: 'ADD_BOOK'; book: Book }
  | { type: 'UPDATE_BOOK'; book: Book }
  | { type: 'DELETE_BOOK'; id: number }
  | { type: 'SET_BOOKS'; books: Book[] };

// Reducer function to handle book actions
const bookReducer = (state: Book[], action: ActionType): Book[] => {
  switch (action.type) {
    case 'ADD_BOOK':
      return [...state, action.book];
    case 'UPDATE_BOOK':
      return state.map(book => (book.id === action.book.id ? action.book : book));
    case 'DELETE_BOOK':
      return state.filter(book => book.id !== action.id);
    case 'SET_BOOKS':
      return action.books;
    default:
      return state;
  }
};

const App: React.FC = () => {
  // Use reducer to manage the books state
  const [books, dispatch] = useReducer(bookReducer, []);
  
  // Custom hook to persist books to localStorage
  const [storedBooks, setStoredBooks] = useLocalStorage<Book[]>('books', []);
  
  // State for managing the input form
  const [input, setInput] = useState({ title: '', author: '', year: '' });
  
  // State for managing the search input
  const [search, setSearch] = useState('');
  
  // State for managing the current page in pagination
  const [currentPage, setCurrentPage] = useState(1);
  
  const booksPerPage = 5; // Number of books per page

  // Load books from localStorage on component mount
  useEffect(() => {
    if (storedBooks.length > 0) {
      dispatch({ type: 'SET_BOOKS', books: storedBooks });
    }
  }, [storedBooks]);

  // Save books to localStorage whenever books state changes
  useEffect(() => {
    setStoredBooks(books);
  }, [books, setStoredBooks]);

  // Handle input changes for the book form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInput(prev => ({ ...prev, [name]: value }));
  };

  // Handle adding a new book
  const handleAddBook = () => {
    if (!input.title.trim() || !input.author.trim() || !input.year.trim()) return;
    const newBook: Book = {
      id: Date.now(),
      title: input.title,
      author: input.author,
      year: parseInt(input.year),
    };
    dispatch({ type: 'ADD_BOOK', book: newBook });
    setInput({ title: '', author: '', year: '' });
  };

  // Handle deleting a book
  const handleDeleteBook = (id: number) => {
    dispatch({ type: 'DELETE_BOOK', id });
  };

  // Handle updating a book
  const handleUpdateBook = (book: Book) => {
    const updatedTitle = prompt('Update title', book.title);
    const updatedAuthor = prompt('Update author', book.author);
    const updatedYear = prompt('Update year', book.year.toString());
    if (updatedTitle && updatedAuthor && updatedYear) {
      dispatch({
        type: 'UPDATE_BOOK',
        book: { ...book, title: updatedTitle, author: updatedAuthor, year: parseInt(updatedYear) },
      });
    }
  };

  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  // Memoize filtered books to avoid unnecessary recalculations
  const filteredBooks = useMemo(() => {
    return books.filter(book => book.title.toLowerCase().includes(search.toLowerCase()));
  }, [books, search]);

  // Memoize current books to avoid unnecessary recalculations
  const currentBooks = useMemo(() => {
    const indexOfLastBook = currentPage * booksPerPage;
    const indexOfFirstBook = indexOfLastBook - booksPerPage;
    return filteredBooks.slice(indexOfFirstBook, indexOfLastBook);
  }, [filteredBooks, currentPage, booksPerPage]);

  // Calculate total pages for pagination
  const totalPages = useMemo(() => {
    return Math.ceil(filteredBooks.length / booksPerPage);
  }, [filteredBooks.length, booksPerPage]);

  // Handle pagination
  const paginate = useCallback(
    (direction: 'next' | 'prev') => {
      if (direction === 'next' && currentPage < totalPages) {
        setCurrentPage(prevPage => prevPage + 1);
      } else if (direction === 'prev' && currentPage > 1) {
        setCurrentPage(prevPage => prevPage - 1);
      }
    },
    [currentPage, totalPages]
  );

  return (
    <div className="app">
      <h1>Book Repository</h1>
      
      <div className="book-form">
        <input
          type="text"
          name="title"
          value={input.title}
          onChange={handleInputChange}
          placeholder="Title"
        />
        <input
          type="text"
          name="author"
          value={input.author}
          onChange={handleInputChange}
          placeholder="Author"
        />
        <input
          type="number"
          name="year"
          value={input.year}
          onChange={handleInputChange}
          placeholder="Year"
        />
        <button onClick={handleAddBook}>Add Book</button>
      </div>
      
      <div className="book-search">
        <input
          type="text"
          value={search}
          onChange={handleSearchChange}
          placeholder="Search by title"
        />
      </div>
      
      <table className="book-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Book</th>
            <th>Author</th>
            <th>Year</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {currentBooks.map(book => (
            <tr key={book.id}>
              <td>{book.id}</td>
              <td>{book.title}</td>
              <td>{book.author}</td>
              <td>{book.year}</td>
              <td className="actions">
                <button onClick={() => handleUpdateBook(book)}>Edit</button>
                <button onClick={() => handleDeleteBook(book.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <div className="pagination">
        <button onClick={() => paginate('prev')}>Previous</button>
        <button onClick={() => paginate('next')}>Next</button>
      </div>
    </div>
  );
};

export default App;
