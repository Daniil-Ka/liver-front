import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import SignInPage from './pages/SignInPage';
import Dashboard from './pages/MainPage';
import CssBaseline from "@mui/material/CssBaseline";
import AppTheme from "./theme/AppTheme"; // Новая страница после входа

export default function RouterApp(props: { disableCustomTheme?: boolean }) {
      return (
      <AppTheme {...props}>
      <CssBaseline enableColorScheme />
        <Router future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
          <Routes>
            <Route path="/" element={<SignInPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </Router>
      </AppTheme>
      );
}