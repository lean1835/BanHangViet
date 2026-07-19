import React from "react";
import { useNavigate } from "react-router-dom";
import { APP_ROUTES } from "@/constants/routes";
import { LoginForm } from "../components/LoginForm";

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  return <LoginForm onSuccess={() => navigate(APP_ROUTES.DASHBOARD)} />;
};

export default LoginPage;
