import React, { useState, useReducer, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios'; // Import axios for making HTTP requests
import './App.css';

// Define the structure of a Book
interface Book {
  id: number;
  title: string;
  author: string;
  year: number;
}

// Define the types of actions for the reducer
type ActionType =
  | { type: 'ADD_BOOK'; book: Book }
  | { type: 'UPDATE_BOOK'; book: Book }
  | { type: 'DELETE_BOOK'; id: number }
  | { type: 'SET_BOOKS'; books: Book[] };

// Reducer function to manage book state
const bookReducer = (state: Book[], action: ActionType): Book[] => {
  switch (action.type) {
    case 'ADD_BOOK':
      return [...state, action.book]; // Add a new book
    case 'UPDATE_BOOK':
      return state.map(book => (book.id === action.book.id ? action.book : book)); // Update an existing book
    case 'DELETE_BOOK':
      return state.filter(book => book.id !== action.id); // Delete a book
    case 'SET_BOOKS':
      return action.books; // Set books from API response
    default:
      return state;
  }
};

const App: React.FC = () => {
  // useReducer for managing books state
  const [books, dispatch] = useReducer(bookReducer, []);
  // State for managing input fields for adding a new book
  const [input, setInput] = useState({ title: '', author: '', year: '' });
  // State for managing the book being edited
  const [editBook, setEditBook] = useState<Book | null>(null);
  // State for search query
  const [search, setSearch] = useState('');
  // State for current page in pagination
  const [currentPage, setCurrentPage] = useState(1);
  const booksPerPage = 5; // Number of books per page

  // Load books from API when component mounts
  useEffect(() => {
    axios.get('http://localhost:3000/books')
      .then(response => {
        dispatch({ type: 'SET_BOOKS', books: response.data });
      })
      .catch(error => {
        console.error("There was an error fetching the books!", error);
      });
  }, []);

  // Handle input changes for adding a new book
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInput(prev => ({ ...prev, [name]: value }));
  };

  // Add a new book to the list
  const handleAddBook = () => {
    if (!input.title.trim() || !input.author.trim() || !input.year.trim()) return;
    const newBook: Partial<Book> = {
      title: input.title,
      author: input.author,
      year: parseInt(input.year),
    };
    axios.post('http://localhost:3000/books', newBook)
      .then(response => {
        dispatch({ type: 'ADD_BOOK', book: response.data });
      })
      .catch(error => {
        console.error("There was an error adding the book!", error);
      });
    setInput({ title: '', author: '', year: '' });
  };

  // Delete a book from the list
  const handleDeleteBook = (id: number) => {
    axios.delete(`http://localhost:3000/books/${id}`)
      .then(() => {
        dispatch({ type: 'DELETE_BOOK', id });
      })
      .catch(error => {
        console.error("There was an error deleting the book!", error);
      });
  };

  // Handle input changes for editing a book
  const handleEditBookChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (editBook) {
      setEditBook({ ...editBook, [name]: value });
    }
  };

  // Update a book in the list
  const handleUpdateBook = () => {
    if (editBook) {
      axios.put(`http://localhost:3000/books/${editBook.id}`, editBook) 
        .then(response => {
          dispatch({ type: 'UPDATE_BOOK', book: response.data });
          setEditBook(null); // Clear the edit form after updating
        })
        .catch(error => {
          console.error("There was an error updating the book!", error);
        });
    }
  };

  // Set the book to be edited
  const handleEditButtonClick = (book: Book) => {
    setEditBook(book);
  };

  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  // Filter books based on search query (title, author, or year)
  const filteredBooks = useMemo(() => {
    return books.filter(book => 
      book.title.toLowerCase().includes(search.toLowerCase()) ||
      book.author.toLowerCase().includes(search.toLowerCase()) ||
      book.year.toString().includes(search)
    );
  }, [books, search]);

  // Get the current books for the current page
  const currentBooks = useMemo(() => {
    const indexOfLastBook = currentPage * booksPerPage;
    const indexOfFirstBook = indexOfLastBook - booksPerPage;
    return filteredBooks.slice(indexOfFirstBook, indexOfLastBook);
  }, [filteredBooks, currentPage, booksPerPage]);

  // Calculate the total number of pages for pagination
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
          placeholder="Search by title, author, or year"
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
