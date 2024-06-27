import React, { useState, useReducer, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import './App.css';

// Adjusted Book Interface
interface Book {
  book_id: string; // Adjust type according to your backend response (string or number)
  title: string;
  author: string;
  year: number;
}

// Define the types of actions for the reducer
type ActionType =
  | { type: 'ADD_BOOK'; book: Book }
  | { type: 'UPDATE_BOOK'; book: Book }
  | { type: 'DELETE_BOOK'; id: string }
  | { type: 'SET_BOOKS'; books: Book[] };

// Reducer function to manage book state
const bookReducer = (state: Book[], action: ActionType): Book[] => {
  switch (action.type) {
    case 'ADD_BOOK':
      return [...state, action.book];
    case 'UPDATE_BOOK':
      return state.map(book => (book.book_id === action.book.book_id ? action.book : book));
    case 'DELETE_BOOK':
      return state.filter(book => book.book_id !== action.id);
    case 'SET_BOOKS':
      return action.books;
    default:
      return state;
  }
};

const App: React.FC = () => {
  const [books, dispatch] = useReducer(bookReducer, []);
  const [input, setInput] = useState({ title: '', author: '', year: '' });
  const [editBook, setEditBook] = useState<Book | null>(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const booksPerPage = 5;

  useEffect(() => {
    axios.get('http://localhost:5000/books')
      .then(response => {
        dispatch({ type: 'SET_BOOKS', books: response.data });
      })
      .catch(error => {
        console.error("There was an error fetching the books!", error);
      });
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInput(prev => ({ ...prev, [name]: value }));
  };

  const handleAddBook = () => {
    if (!input.title.trim() || !input.author.trim() || !input.year.trim()) return;
    const newBook = {
      title: input.title,
      author: input.author,
      year: parseInt(input.year),
    };
    axios.post('http://localhost:5000/books', newBook)
      .then(response => {
        dispatch({ type: 'ADD_BOOK', book: response.data });
      })
      .catch(error => {
        console.error("There was an error adding the book!", error);
      });
    setInput({ title: '', author: '', year: '' });
  };

  const handleDeleteBook = (id: string) => {
    axios.delete(`http://localhost:5000/books/${id}`)
      .then(() => {
        dispatch({ type: 'DELETE_BOOK', id });
      })
      .catch(error => {
        console.error("There was an error deleting the book!", error);
      });
  };

  const handleEditBookChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (editBook) {
      setEditBook({ ...editBook, [name]: value });
    }
  };

  const handleUpdateBook = () => {
    if (editBook) {
      axios.put(`http://localhost:5000/books/${editBook.book_id}`, editBook)
        .then(response => {
          dispatch({ type: 'UPDATE_BOOK', book: response.data });
          setEditBook(null);
        })
        .catch(error => {
          console.error("There was an error updating the book!", error);
        });
    }
  };

  const handleEditButtonClick = (book: Book) => {
    setEditBook(book);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const filteredBooks = useMemo(() => {
    return books.filter(book =>
      book.title.toLowerCase().includes(search.toLowerCase()) ||
      book.author.toLowerCase().includes(search.toLowerCase()) ||
      book.year.toString().includes(search)
    );
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
            <tr key={book.book_id}>
              <td>{book.book_id}</td>
              <td>{book.title}</td>
              <td>{book.author}</td>
              <td>{book.year}</td>
              <td className="actions">
                <button onClick={() => handleEditButtonClick(book)}>Edit</button>
                <button onClick={() => handleDeleteBook(book.book_id)}>Delete</button>
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
