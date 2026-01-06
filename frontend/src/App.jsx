import React, { useState, useEffect } from "react";

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastProvider } from "./common/ToastContainer";

/* Common */
import Header from "./common/Header";
import ProtectedRoute from "./common/ProtectedRoute";

/* Home */
import Home from "./home/Home";
import WhyRideShare from "./home/WhyRideShare";

/* Auth */
import Login from "./auth/Login";
import Register from "./auth/Register";

/* Admin */
import Dashboard from "./admin/Dashboard";
import AdminUsers from "./admin/AdminUsers";
import AddVehicle from "./admin/AddVehicle";
import VehiclesList from "./admin/VehiclesList";
import AdminBookings from "./admin/AdminBookings";
import AdminReports from "./admin/AdminReports";
import AnalyticsPage from "./admin/AnalyticsPage";
import DriverDashboard from "./driver/DriverDashboard";
import DriverReserve from "./driver/DriverReserve";
import DriverHistory from "./driver/DriverHistory";

import DriverAllBookings from "./driver/DriverAllBookings";

/* User */
import UserBus from "./user/UserBus";

/* Bookings */
import BookingForm from "./bookings/BookingForm";
import ConfirmBooking from "./bookings/ConfirmBooking";
import UserBookings from "./bookings/UserBookings";
import BookingHistory from "./bookings/BookingHistory";
import PaymentSuccess from "./bookings/PaymentSuccess";
import PaymentPage from "./bookings/PaymentPage";
import MyReviews from "./reviews/MyReviews";

export default function App() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (saved === "dark" || (!saved && prefersDark)) {
      document.body.classList.add("dark-mode");
      setIsDark(true);
    } else {
      document.body.classList.add("light-mode");
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.body.classList.remove("dark-mode");
      document.body.classList.add("light-mode");
      localStorage.setItem("theme", "light");
      setIsDark(false);
    } else {
      document.body.classList.remove("light-mode");
      document.body.classList.add("dark-mode");
      localStorage.setItem("theme", "dark");
      setIsDark(true);
    }
  };

  return (
    <ToastProvider>
      <Router>

        <Header isDark={isDark} toggleTheme={toggleTheme} />
        <Routes>
          {/* Root Redirect */}{/* Replaced by Home */}
          <Route path="/" element={<Home />} />
          <Route path="/why-rideshare" element={<WhyRideShare />} />

          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Admin */}
          <Route path="/dashboard" element={<ProtectedRoute allowedRoles={["ROLE_ADMIN"]}><Dashboard /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute allowedRoles={["ROLE_ADMIN"]}><AdminUsers /></ProtectedRoute>} />
          <Route path="/admin/add-vehicle" element={<ProtectedRoute allowedRoles={["ROLE_ADMIN"]}><AddVehicle /></ProtectedRoute>} />
          <Route path="/admin/edit-vehicle/:id" element={<ProtectedRoute allowedRoles={["ROLE_ADMIN"]}><AddVehicle /></ProtectedRoute>} />
          <Route path="/admin/vehicles" element={<ProtectedRoute allowedRoles={["ROLE_ADMIN"]}><VehiclesList /></ProtectedRoute>} />
          <Route path="/admin/bookings" element={<ProtectedRoute allowedRoles={["ROLE_ADMIN"]}><AdminBookings /></ProtectedRoute>} />
          <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={["ROLE_ADMIN"]}><AdminReports /></ProtectedRoute>} />
          <Route path="/admin/analytics" element={<ProtectedRoute allowedRoles={["ROLE_ADMIN"]}><AnalyticsPage /></ProtectedRoute>} />
          {/* Driver Routes */}
          <Route path="/driver-dashboard" element={<ProtectedRoute allowedRoles={["ROLE_DRIVER"]}><DriverDashboard /></ProtectedRoute>} />
          <Route path="/driver/reserve/:id" element={<ProtectedRoute allowedRoles={["ROLE_DRIVER"]}><DriverReserve /></ProtectedRoute>} />
          <Route path="/driver/add-ride" element={<ProtectedRoute allowedRoles={["ROLE_DRIVER"]}><AddVehicle /></ProtectedRoute>} />
          <Route path="/driver-history" element={<ProtectedRoute allowedRoles={["ROLE_DRIVER"]}><DriverHistory /></ProtectedRoute>} />
          <Route path="/driver/my-rides" element={<ProtectedRoute allowedRoles={["ROLE_DRIVER"]}><DriverAllBookings /></ProtectedRoute>} />

          {/* User */}
          <Route path="/user-rides" element={<ProtectedRoute allowedRoles={["ROLE_USER"]}><UserBus /></ProtectedRoute>} />
          <Route path="/book/:id" element={<ProtectedRoute allowedRoles={["ROLE_USER"]}><BookingForm /></ProtectedRoute>} />
          <Route path="/payment" element={<ProtectedRoute allowedRoles={["ROLE_USER"]}><PaymentPage /></ProtectedRoute>} />
          <Route path="/confirm-booking" element={<ProtectedRoute allowedRoles={["ROLE_USER"]}><ConfirmBooking /></ProtectedRoute>} />
          <Route path="/booking-success" element={<ProtectedRoute allowedRoles={["ROLE_USER"]}><PaymentSuccess /></ProtectedRoute>} />
          <Route path="/my-bookings" element={<ProtectedRoute allowedRoles={["ROLE_USER"]}><UserBookings /></ProtectedRoute>} />
          <Route path="/my-history" element={<ProtectedRoute allowedRoles={["ROLE_USER"]}><BookingHistory /></ProtectedRoute>} />
          <Route path="/my-reviews" element={<ProtectedRoute allowedRoles={["ROLE_USER", "ROLE_DRIVER"]}><MyReviews /></ProtectedRoute>} />

          {/* fallback -> login */}
          <Route path="*" element={<Login />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
}

