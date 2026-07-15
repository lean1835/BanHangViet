import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { PublicRoute } from "./guards/PublicRoute";
import { PrivateRoute } from "./guards/PrivateRoute";

const AuthPage = React.lazy(() => import("../pages/AuthPage"));
const DashboardPage = React.lazy(() => import("../pages/DashboardPage"));

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Suspense
        fallback={
          <div className="flex justify-center items-center h-screen">
            Đang tải...
          </div>
        }
      >
        <Routes>
          {/* Public routes */}
          <Route
            path="/auth"
            element={
              <PublicRoute>
                <AuthPage />
              </PublicRoute>
            }
          />

          {/* Private routes */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <DashboardPage />
              </PrivateRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default AppRouter;
