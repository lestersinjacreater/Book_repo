
export interface Book {
    id: number;
    title: string;
    author: string;
    year: number;
  }
  
  export type Action =
    | { type: 'ADD_BOOK'; payload: Book }
    | { type: 'UPDATE_BOOK'; payload: Book }
    | { type: 'DELETE_BOOK'; payload: number }
    | { type: 'LOAD_BOOKS'; payload: Book[] };
  