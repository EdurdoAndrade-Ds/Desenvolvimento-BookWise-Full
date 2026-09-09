// Tipos alinhados ao contrato em contracts/openapi.yaml.
// Mantidos manualmente (code-first) enquanto o MER nao e finalizado.

export type UserRole = 'ADMIN' | 'LIBRARIAN' | 'READER';
export type BookFormat = 'PHYSICAL' | 'DIGITAL';
export type LoanStatus = 'ACTIVE' | 'RETURNED' | 'LATE';
export type SaleStatus = 'PENDING' | 'PAID' | 'CANCELLED';
export type ReservationStatus = 'ACTIVE' | 'FULFILLED' | 'CANCELLED' | 'EXPIRED';
export type FinePaymentStatus = 'PENDING' | 'PAID';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  createdAt?: string;
}

export interface CategoryRef {
  id: number;
  name: string;
}

export interface Book {
  id: number;
  title: string;
  author: string;
  isbn: string;
  genre?: string;
  publishedYear?: number;
  format: BookFormat;
  price?: number;
  stock?: number;
  categories?: CategoryRef[];
  createdAt?: string;
}

export interface LoanItem {
  bookId: number;
  bookTitle: string;
  quantity: number;
}

export interface Loan {
  id: number;
  userId: number;
  userName: string;
  items: LoanItem[];
  loanDate: string;
  dueDate: string;
  returnDate?: string | null;
  renewalCount: number;
  status: LoanStatus;
}

export interface SaleItem {
  bookId: number;
  bookTitle: string;
  quantity: number;
  unitPrice: number;
}

export interface Sale {
  id: number;
  userId: number;
  userName: string;
  items: SaleItem[];
  paymentMethod?: string;
  saleDate: string;
  totalPrice: number;
  status: SaleStatus;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  parentId?: number | null;
  parentName?: string | null;
  createdAt?: string;
}

export interface Reservation {
  id: number;
  userId: number;
  userName: string;
  bookId: number;
  bookTitle: string;
  reserveDate: string;
  expirationDate?: string | null;
  status: ReservationStatus;
}

export interface Fine {
  id: number;
  loanId: number;
  userName: string;
  value: number;
  daysLate: number;
  paymentStatus: FinePaymentStatus;
  paymentDate?: string | null;
}

export interface PageMeta {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface Page<T> {
  content: T[];
  meta: PageMeta;
}

export interface SchemaDatabase {
  productName: string;
  productVersion: string;
  schemaName: string;
}

export interface SchemaColumn {
  name: string;
  type: string;
  size?: number | null;
  nullable: boolean;
  primaryKey: boolean;
  autoIncrement: boolean;
  unique: boolean;
}

export interface SchemaForeignKey {
  name: string;
  column: string;
  referencedTable: string;
  referencedColumn: string;
}

export interface SchemaTable {
  name: string;
  columns: SchemaColumn[];
  primaryKey: string[];
  foreignKeys: SchemaForeignKey[];
  uniqueConstraints: string[];
}

export interface DatabaseSchema {
  database: SchemaDatabase;
  tables: SchemaTable[];
}
