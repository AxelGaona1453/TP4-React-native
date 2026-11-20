import type { Libro } from '../types';

// ISBN y años verificados contra openlibrary.org (edición de cada ISBN).
export const LIBROS: Libro[] = [
  { isbn: '9788499089508', titulo: 'Ficciones', autor: 'Jorge Luis Borges', anio: 2011, ejemplares: 2 },
  { isbn: '9788499089515', titulo: 'El Aleph', autor: 'Jorge Luis Borges', anio: 2012, ejemplares: 0 },
  { isbn: '9788437604572', titulo: 'Rayuela', autor: 'Julio Cortázar', anio: 1984, ejemplares: 1 },
  { isbn: '9780307474728', titulo: 'Cien años de soledad', autor: 'Gabriel García Márquez', anio: 2009, ejemplares: 0 },
  { isbn: '9780132350884', titulo: 'Clean Code', autor: 'Robert C. Martin', anio: 2008, ejemplares: 3 },
  { isbn: '9781593279509', titulo: 'Eloquent JavaScript', autor: 'Marijn Haverbeke', anio: 2018, ejemplares: 2 },
  { isbn: '9780201633610', titulo: 'Design Patterns', autor: 'Erich Gamma y otros', anio: 1995, ejemplares: 1 },
  { isbn: '9780134757599', titulo: 'Refactoring', autor: 'Martin Fowler', anio: 2018, ejemplares: 0 },
  { isbn: '9780735619678', titulo: 'Code Complete', autor: 'Steve McConnell', anio: 2004, ejemplares: 1 },
  { isbn: '9780201835953', titulo: 'The Mythical Man-Month', autor: 'Frederick P. Brooks', anio: 1995, ejemplares: 1 },
  { isbn: '9780262033848', titulo: 'Introduction to Algorithms', autor: 'Thomas H. Cormen y otros', anio: 2009, ejemplares: 2 },
  { isbn: '9788420412146', titulo: 'Don Quijote de la Mancha', autor: 'Miguel de Cervantes', anio: 2015, ejemplares: 2 },
  { isbn: '9788499890944', titulo: '1984', autor: 'George Orwell', anio: 2015, ejemplares: 0 },
  { isbn: '9788498381498', titulo: 'El Principito', autor: 'Antoine de Saint-Exupéry', anio: 2010, ejemplares: 3 },
  { isbn: '9788478884452', titulo: 'Harry Potter y la piedra filosofal', autor: 'J. K. Rowling', anio: 2008, ejemplares: 1 },
  { isbn: '9789875666733', titulo: 'Trilogía de la Fundación', autor: 'Isaac Asimov', anio: 2011, ejemplares: 1 },
];
