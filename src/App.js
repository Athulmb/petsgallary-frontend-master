import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import './App.css';
import GroomingService from './Components/GroomingService';
import Header from './Components/Header';
import Hero from './Components/Hero';
import Navbar from './Components/Navbar';
import ProductCarousel from './Components/Ourbestseller';
import CategorySection from './Components/OurCategory';
import StorePage from './Components/StorePage'; 
import { ContactPage } from "./Components/ContactPage";
import ProductDetails from "./Components/ProductDetails";
import GroomingPage from "./Components/GroomingPage";
import ShoppingCart from "./Components/cart";
import CheckoutPage from "./Components/CheckoutPage";
import { Provider } from "react-redux";
import store from "./utils/store";
import Footer from "./Components/footer"
import AnimatedStackCards from "./Components/Cardstack";
import ScrollToTop from "./Components/ScrollToTop";
import LoginForm from "./Components/login";
import RegisterForm from "./Components/register";
import ProfilePage from "./Components/ProfilePage";
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import PaymentSuccess from "./Components/PaymentSuccess";
import PaymentFailed from "./Components/PaymentFail"; 

const stripePromise = loadStripe('pk_live_51Ml76JBXMMX4ZG36EY7bQJ20P6HTWAsRC9s72Bo71i1BauD0kk2GUHgL8cu4ZLvmmWNrETBihxMmQ2xFjdEOvc1C00TBkALAoI');

function App() {
  return (
    <Provider store={store}>
    <Router>
      <ScrollToTop/>
      <Header />
      <Navbar />
      <Routes>
        <Route path="/" element={
          <>
            <Hero />
            <ProductCarousel />
            <CategorySection />
            <GroomingService />
            <AnimatedStackCards/>
          </>
        } />
        <Route path="/store" element={<StorePage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/productdetails" element={<ProductDetails />} />
        <Route path="/grooming" element={<GroomingPage />} />
        <Route path="/cart" element={<ShoppingCart />} />
        <Route path="/user" element={<LoginForm />} />
        <Route path="/user/register" element={<RegisterForm/>} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/product/:id" element={<ProductDetails />} />
        
        {/* FIXED: Updated route paths to match CheckoutPage navigation */}
        <Route path="/payment-success" element={<PaymentSuccess/>} />
        <Route path="/payment-failed" element={<PaymentFailed/>} />
        
        <Route path="/checkout" element={
          <Elements stripe={stripePromise}>
            <CheckoutPage />
          </Elements>
        } />
        
      </Routes>
      <Footer/>
    </Router>
    </Provider>
  );
}

export default App;