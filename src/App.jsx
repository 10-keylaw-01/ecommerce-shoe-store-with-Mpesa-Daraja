import { useEffect } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider } from './admin/AuthProvider'
import { CartProvider } from './context/CartContext'
import { SiteProvider } from './context/SiteContext'
import CmsPage from './pages/CmsPage'
import { WishlistProvider } from './context/WishlistContext'
import { ThemeProvider } from './context/ThemeContext'
import Journal from './pages/Journal'
import JournalPost from './pages/JournalPost'
import Faq from './pages/Faq'
import TrackOrder from './pages/TrackOrder'
import Wishlist from './pages/Wishlist'
import NotFound from './pages/NotFound'
import AdminLayout from './admin/AdminLayout'
import Login from './admin/Login'
import Dashboard from './admin/Dashboard'
import ResourceList from './admin/ResourceList'
import ResourceForm from './admin/ResourceForm'
import OrdersList, { OrderDetail } from './admin/Orders'
import ProductEditor from './admin/ProductEditor'
import ContentEditor from './admin/ContentEditor'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Collection from './pages/Collection'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Atelier from './pages/Atelier'
import Performance from './pages/Performance'
import Contact from './pages/Contact'

function ScrollTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo({ top: 0 }) }, [pathname])
  return null
}

function PublicLayout({ children }) {
  return (
    <SiteProvider>
      <div className="bg-bg text-body min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </SiteProvider>
  )
}

function App() {
  return (
    <BrowserRouter>
      <ScrollTop />
      <ThemeProvider>
      <AuthProvider>
        <CartProvider>
        <WishlistProvider>
          <Routes>
            <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
            <Route path="/collection" element={<PublicLayout><Collection /></PublicLayout>} />
            <Route path="/product/:slug" element={<PublicLayout><ProductDetail /></PublicLayout>} />
            <Route path="/cart" element={<PublicLayout><Cart /></PublicLayout>} />
            <Route path="/atelier" element={<PublicLayout><Atelier /></PublicLayout>} />
            <Route path="/performance" element={<PublicLayout><Performance /></PublicLayout>} />
            <Route path="/journal" element={<PublicLayout><Journal /></PublicLayout>} />
            <Route path="/journal/:slug" element={<PublicLayout><JournalPost /></PublicLayout>} />
            <Route path="/faq" element={<PublicLayout><Faq /></PublicLayout>} />
            <Route path="/track-order" element={<PublicLayout><TrackOrder /></PublicLayout>} />
            <Route path="/wishlist" element={<PublicLayout><Wishlist /></PublicLayout>} />
            <Route path="/pages/:slug" element={<PublicLayout><CmsPage /></PublicLayout>} />
            <Route path="/contact" element={<PublicLayout><Contact /></PublicLayout>} />
            <Route path="/admin/login" element={<Login />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="orders" element={<OrdersList />} />
              <Route path="orders/:id" element={<OrderDetail />} />
              <Route path="products/:id" element={<ProductEditor />} />
              <Route path="content" element={<ContentEditor />} />
              <Route path=":table" element={<ResourceList />} />
              <Route path=":table/:id" element={<ResourceForm />} />
            </Route>
            <Route path="*" element={<PublicLayout><NotFound /></PublicLayout>} />
          </Routes>
        </WishlistProvider>
        </CartProvider>
      </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
