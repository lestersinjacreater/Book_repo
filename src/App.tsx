import React, { useState, useReducer, useEffect, useCallback, useMemo } from 'react';
import useLocalStorage from './hooks/useLocalStorage';
import './App.css';

interface Book {
  id: number;
  title: string;
  author: string;
  year: number;
}

type ActionType =
  | { type: 'ADD_BOOK'; book: Book }
  | { type: 'UPDATE_BOOK'; book: Book }
  | { type: 'DELETE_BOOK'; id: number }
  | { type: 'SET_BOOKS'; books: Book[] };

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
  const [books, dispatch] = useReducer(bookReducer, []);
  const [storedBooks, setStoredBooks] = useLocalStorage<Book[]>('books', []);
  const [input, setInput] = useState({ title: '', author: '', year: '' });
  const [editBook, setEditBook] = useState<Book | null>(null); // State for managing the book being edited
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const booksPerPage = 5;

  useEffect(() => {
    if (storedBooks.length > 0) {
      dispatch({ type: 'SET_BOOKS', books: storedBooks });
    }
  }, [storedBooks]);

  useEffect(() => {
    setStoredBooks(books);
  }, [books, setStoredBooks]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInput(prev => ({ ...prev, [name]: value }));
  };

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

  const handleDeleteBook = (id: number) => {
    dispatch({ type: 'DELETE_BOOK', id });
  };

  const handleEditBookChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (editBook) {
      setEditBook({ ...editBook, [name]: value });
    }
  };

  const handleUpdateBook = () => {
    if (editBook) {
      dispatch({ type: 'UPDATE_BOOK', book: editBook });
      setEditBook(null); // Clear the edit form after updating
    }
  };

  const handleEditButtonClick = (book: Book) => {
    setEditBook(book); // Set the book to be edited
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const filteredBooks = useMemo(() => {
    return books.filter(book => book.title.toLowerCase().includes(search.toLowerCase()));
  }, [books, search]);

  const currentBooks = useMemo(() => {
    const indexOfLastBook = currentPage * booksPerPage;
    const indexOfFirstBook = indexOfLastBook - booksPerPage;
    return filteredBooks.slice(indexOfFirstBook, indexOfLastBook);
  }, [filteredBooks, currentPage, booksPerPage]);

  const totalPages = useMemo(() => {
    return Math.ceil(filteredBooks.length / booksPerPage);
  }, [filteredBooks.length, booksPerPage]);

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
      {editBook && (
        <div className="edit-form">
          <h2>Edit Book</h2>
          <input
            type="text"
            name="title"
            value={editBook.title}
            onChange={handleEditBookChange}
            placeholder="Title"
          />
          <input
            type="text"
            name="author"
            value={editBook.author}
            onChange={handleEditBookChange}
            placeholder="Author"
          />
          <input
            type="number"
            name="year"
            value={editBook.year}
            onChange={handleEditBookChange}
            placeholder="Year"
          />
          <button onClick={handleUpdateBook}>Update Book</button>
          <button onClick={() => setEditBook(null)}>Cancel</button>
        </div>
      )}
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
                <button onClick={() => handleEditButtonClick(book)}>Edit</button>
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
