import React from "react";
import { useNavigate } from "react-router-dom";
import { APP_ROUTES } from "@/constants/routes";
import { RegisterForm } from "../components/RegisterForm";

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  return <RegisterForm onSuccess={() => navigate(APP_ROUTES.DASHBOARD)} />;
};

export default RegisterPage;
