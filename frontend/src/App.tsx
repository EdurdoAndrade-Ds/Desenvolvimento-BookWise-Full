import { Routes, Route } from 'react-router-dom';
import AppLayout from './layout/AppLayout';
import DashboardPage from './pages/DashboardPage';
import BooksPage from './pages/BooksPage';
import CategoriesPage from './pages/CategoriesPage';
import LoansPage from './pages/LoansPage';
import ReservationsPage from './pages/ReservationsPage';
import SalesPage from './pages/SalesPage';
import FinesPage from './pages/FinesPage';
import UsersPage from './pages/UsersPage';
import SettingsPage from './pages/SettingsPage';
import CustomerLayout from './layout/CustomerLayout';
import CatalogPage from './pages/customer/CatalogPage';
import BookDetailPage from './pages/customer/BookDetailPage';
import MyLoansPage from './pages/customer/MyLoansPage';
import MyReservationsPage from './pages/customer/MyReservationsPage';
import MyFinesPage from './pages/customer/MyFinesPage';
import MyPurchasesPage from './pages/customer/MyPurchasesPage';
import MyAccountPage from './pages/customer/MyAccountPage';
import Shelf3DPage from './pages/customer/Shelf3DPage';
import CoverStudioPage from './pages/customer/CoverStudioPage';

export default function App() {
  return (
    <Routes>
      <Route element={<CustomerLayout />}>
        <Route index element={<CatalogPage />} />
        <Route path="books/:id" element={<BookDetailPage />} />
        <Route path="my-loans" element={<MyLoansPage />} />
        <Route path="my-reservations" element={<MyReservationsPage />} />
        <Route path="my-fines" element={<MyFinesPage />} />
        <Route path="my-purchases" element={<MyPurchasesPage />} />
        <Route path="my-account" element={<MyAccountPage />} />
        <Route path="shelf-3d" element={<Shelf3DPage />} />
        <Route path="cover-studio" element={<CoverStudioPage />} />
      </Route>
      <Route path="/adm" element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="books" element={<BooksPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="loans" element={<LoansPage />} />
        <Route path="reservations" element={<ReservationsPage />} />
        <Route path="sales" element={<SalesPage />} />
        <Route path="fines" element={<FinesPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}
