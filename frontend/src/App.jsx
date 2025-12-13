import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./redux/store";
import HomePage from "./components/HomePage.jsx";
import WingPage from "./pages/WingPage.jsx"; // ⭐ Import WingPage
import ClassPage from "./pages/ClassPage.jsx";
import ExcelUploadPage from "./pages/ExcelUploadPage.jsx";
import Signup from "./pages/SignUpTeacher.jsx";
import VerifyOTP from "./pages/VerifyOtp.jsx";
import Login from "./pages/loginPage.jsx";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import PublicRoute from "./components/PublicRoute.jsx";

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          {/* Protected Routes - require authentication */}
          <Route path="/" element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          } />

          {/* ⭐ Single dynamic wing route */}
          <Route path="/:wingName" element={
            <ProtectedRoute>
              <WingPage />
            </ProtectedRoute>
          } />

          <Route path="/class/:classId" element={
            <ProtectedRoute>
              <ClassPage />
            </ProtectedRoute>
          } />

          <Route path="/class/:classId/excel" element={
            <ProtectedRoute>
              <ExcelUploadPage />
            </ProtectedRoute>
          } />

          {/* Public Routes - redirect to home if authenticated */}
          <Route path="/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />

          <Route path="/signup" element={
            <PublicRoute>
              <Signup />
            </PublicRoute>
          } />

          {/* OTP verification - special case */}
          <Route path="/verify-otp" element={<VerifyOTP />} />
        </Routes>
      </BrowserRouter>
      <ToastContainer position="top-center" />
    </Provider>
  );
}

export default App;