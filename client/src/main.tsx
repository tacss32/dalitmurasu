import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./index.css";
import { ThemeProvider } from "./components/theme-context";

// Client Views
import ClientLogin from "./pages/auth/ClientLogin";
import ClientSignup from "./pages/auth/ClientSignup";
import ForgotPassword from "./pages/auth/ForgotPassword";
import PostDetail from "./components/PostDetail";
import Layout from "./pages/Layout";
import About from "./pages/about/About";
import GalleryPage from "./pages/gallery/GalleryPage";
// import Bookmark from "./pages/bookmarks/Bookmarks";
import Contact from "./pages/contact/Contact";
import NewsHud from "./pages/home/NewsHud";

import RecentPosts from "./pages/recent_posts/RecentPosts";
import BabasahebSpeaks from "./pages/speakers/BabasahebSpeaks";
import PeriyarSpeaks from "./pages/speakers/PeriyarSpeaks";
import CartPage from "./pages/cart/CartPages";
import BooksList from "./pages/books/BooksList";
import UserSubscriptionPlans from "./pages/subscribe/UserSubscriptionPlan";
import CreateSubscribe from "./pages/subscribe/CreateSubscription";
import ViewSubscriptionPlans from "./pages/subscribe/ViewSubscriptionPlans";
import PdfManager from "./pages/pdf_upload/PdfManager";
import CreateOrderPage from "./pages/orders/CreateOrderPage";

import SearchResultsPage from './pages/search/SearchResultPage';

import PremiumArticleList from './pages/premium_articles/PremiumArticleList';
import PremiumArticleForm from './pages/premium_articles/PremiumArticleForm';

import Bookmark from "./components/bookmarks";
import FeedbackForm from "./pages/about/FeedBackForm";

// New ProfilePage (direct route)
import ProfilePage from "./pages/ProfilePage";

// Admin
import Login from "./pages/auth/Login";
import LayoutAdmin from "./pages/LayoutAdmin";
import Dashboard from "./pages/auth/Dashboard";
import AdminBannerUploadPage from "./pages/banners/AdminBanner";
import Categories from "./pages/categories/AdminCategories";
import AddRecentPosts from "./pages/recent_posts/AddRecentPosts";
import AdminRecentPosts from "./pages/recent_posts/AdminRecentPosts";
import AddUniversalPosts from "./pages/universal_posts/AddUniversalPost";
import UniversalPosts from "./pages/universal_posts/UniversalPosts";

import AddNewsTitle from "./pages/recent_posts/AddNewsTitle";
import AddPhotoForm from "./pages/gallery/AddPhotoForm";
import CategoryPosts from "./pages/categories/CategoryPosts";
import AddHeaderImage from "./pages/recent_posts/AddHeaderImage";
import Archive from "./pages/archive/Archive";
import Posts from "./pages/archive/Posts";
import GalleryDetail from "./pages/gallery/GalleryDetail";
import Editorial from "./pages/editorial/Editorial";
import Posts1 from "./pages/editorial/Posts1";
import CreateBook from "./pages/books/CreateBooks";
import SendNotification from "./pages/notification/SendNotification";
import ViewNotifications from "./pages/notification/ViewNotification";
import PdfViewerPage from "./pages/pdf_upload/PdfviewerPage";
import AdminOrdersPage from "./pages/orders/AdminOrderPage";
import NewsletterImageManager from './pages/NewsletterImage/NewsletterImageManager';
import AdminSearchPage from './pages/search/AdminSearchPage';
import AdminNewOrders from './pages/orders/AdminNewOrders';

import SubscribedUsersPage from "./pages/subscribe/SubscribedUsersPage";
import ManualAddSubscriptionPage from "./pages/subscribe/ManualAddSubscriptionPage";
import SubscriptionDashboard from "./pages/subscribe/SubscriptionDashboard";
import PremiumArticleDashboard from "./pages/premium_articles/PremiumArticleDashboard";

import GetAllPosts from './pages/pinned_posts/GetAllPosts';
import GetPinnedPosts from './pages/pinned_posts/GetPinnedPosts';
import OrderDashboard from './pages/orders/OrderDashboard';


import AdminPremiumUsers from "./pages/premium_articles/AdminPremiumUsers"  ;
import PremiumArticlePage from './pages/premium_articles/PremiumArticlePage';
import PremiumArticleDetail from './pages/premium_articles/PremiumArticleDetail';
import MyOrders from "./pages/myorders";
import AdminDonation from "./pages/donation/AdminDonation";


createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <Routes>
          

          {/* Auth */}
          <Route path="/login" element={<ClientLogin />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/login-client" element={<ClientLogin />} />
          <Route path="/signup" element={<ClientSignup />} />

          {/* Client Layout */}
          <Route element={<Layout />}>
            <Route path="/" element={<NewsHud />} />

  {/* Redirect old /home to / */}
          <Route path="/home" element={<Navigate to="/" replace />} />
            <Route path="/subscriptions" element={<UserSubscriptionPlans />} />
            <Route path="/recentposts" element={<RecentPosts />} />
            <Route path="/bluethoughts" element={<GalleryPage />} />
            <Route path="/bluethoughts/:id" element={<GalleryDetail />} />
            <Route path="/archive" element={<Archive />} />
            <Route path="/archive/:year/:month" element={<Posts />} />
            <Route path="/editorial" element={<Editorial />} />
            <Route path="/editorial/:year/:month" element={<Posts1 />} />
            
      

          <Route path="/premiumarticles" element={<PremiumArticlePage />} />
          <Route path="/premium-articles/:id" element={<PremiumArticleDetail />} />


            {/* PDF Viewer Routes */}
            <Route path="/pdf-viewer/:id" element={<PdfViewerPage />} />
            <Route path="/editorial-pdfs" element={<PdfViewerPage initialCategory="Editorial" />} />
            <Route path="/archive-pdfs" element={<PdfViewerPage initialCategory="Archive" />} />

            <Route path="/babasahebspeaks" element={<BabasahebSpeaks />} />
            <Route path="/periyarspeaks" element={<PeriyarSpeaks />} />
            <Route path="/cart" element={<CartPage />} />
             <Route path="/search" element={<SearchResultsPage />} />
            <Route path="/checkout" element={<CreateOrderPage />} />
            <Route path="/order-confirmation" element={<div>Order Confirmed!</div>} />
            <Route path="/shop" element={<BooksList />} />
            <Route path="/shop/:id" element={<BooksList />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/posts/:id" element={<PostDetail />} />
  
            <Route path="/orders" element={<MyOrders />} />
            <Route path ="/feedback" element={<FeedbackForm/>}/>
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/bookmarks" element={<Bookmark/>} />
            {/* Catch-all Category Route (keep LAST) */}
            <Route path="/:categorySlug" element={<CategoryPosts />} />
          
          </Route>

          {/* Admin */}
          <Route path="/auth/login" element={<Login />} />
          <Route path="/admin" element={<LayoutAdmin />}>
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="recent-posts" element={<AdminRecentPosts />} />
            <Route path="recent-posts/create" element={<AddRecentPosts />} />
            <Route path="news-title" element={<AddNewsTitle />} />
            <Route path="header-image" element={<AddHeaderImage />} />
            <Route path="categories" element={<Categories />} />
            <Route path="banners" element={<AdminBannerUploadPage />} />
            <Route path="universal" element={<UniversalPosts />} />
            <Route path="universal/create" element={<AddUniversalPosts />} />
        
            <Route path="addphotos/upload" element={<AddPhotoForm />} />
            <Route path="books" element={<CreateBook />} />
            <Route path="books/create" element={<CreateBook />} />
            <Route path="pdf-uploads" element={<PdfManager />} />
            <Route path="pdf-uploads/create" element={<PdfManager />} />
            <Route path="pdf-uploads/edit/:id" element={<PdfManager />} />
            <Route path="notifications/send" element={<SendNotification />} />
            <Route path="notifications/view" element={<ViewNotifications />} />
            <Route path="subscription-plans/create" element={<CreateSubscribe />} />
            <Route path="subscription-plans" element={<ViewSubscriptionPlans />} />
            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="newsletter-image" element={<NewsletterImageManager />} />
            <Route path="/admin/search" element={<AdminSearchPage />} />
            <Route path="new-orders" element={<AdminNewOrders />} /> 
            <Route path="subscription-plans/subscribed-users" element={<SubscribedUsersPage />} />
            <Route path="subscription-plans/manual-add" element={<ManualAddSubscriptionPage />} />   
             <Route path="/admin/pinned-posts" element={<GetPinnedPosts />} />
             <Route path="/admin/GetAll-posts" element={<GetAllPosts />} />

              <Route path="/admin/orders-dashboard" element={<OrderDashboard />} />
              <Route path="/admin/subscription-dashboard" element={<SubscriptionDashboard />} />
              <Route path="/admin/premiumArticles-dashboard" element={<PremiumArticleDashboard />} />
             

            <Route path="subscription-plans/Premium-users" element={<AdminPremiumUsers />} />
            <Route path="premium-articles" element={<PremiumArticleList />} />
            <Route path="premium-articles/create" element={<PremiumArticleForm />} />
            <Route path="/admin/premium-articles/edit/:id" element={<PremiumArticleForm />} />
            <Route path="/admin/donation" element={<AdminDonation />} />
          </Route>
        </Routes>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);
