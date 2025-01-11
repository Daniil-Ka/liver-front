import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import SignInPage from './pages/SignInPage';
import Dashboard from './pages/MainPage';
import CssBaseline from "@mui/material/CssBaseline";
import AppTheme from "./theme/AppTheme";
import VideoStream from "./pages/WebRTC"; // Новая страница после входа

export default function RouterApp(props: { disableCustomTheme?: boolean }) {
      return (
      <AppTheme {...props}>
      <CssBaseline enableColorScheme />
        <Router future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
          <Routes>
            <Route path="/" element={<SignInPage />} />
            <Route path="/main" element={<Dashboard />} />
            <Route path="/webrtc" element={<VideoStream />} />
          </Routes>
        </Router>
      </AppTheme>
      );
}