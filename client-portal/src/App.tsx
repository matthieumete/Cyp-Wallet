import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './lib/auth';
import { CartProvider } from './lib/cart';
import { ProtectedRoute } from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import Merchants from './pages/Merchants';
import MerchantDetail from './pages/MerchantDetail';
import Cart from './pages/Cart';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/connexion" element={<Login />} />
            <Route path="/inscription" element={<SignUp />} />
            <Route
              path="/mon-compte"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/commercants"
              element={
                <ProtectedRoute>
                  <Merchants />
                </ProtectedRoute>
              }
            />
            <Route
              path="/commercants/:id"
              element={
                <ProtectedRoute>
                  <MerchantDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/panier"
              element={
                <ProtectedRoute>
                  <Cart />
                </ProtectedRoute>
              }
            />
            <Route
              path="/commandes"
              element={
                <ProtectedRoute>
                  <Orders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/commandes/:id"
              element={
                <ProtectedRoute>
                  <OrderDetail />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}
