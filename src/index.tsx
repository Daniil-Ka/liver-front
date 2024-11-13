import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { StyledEngineProvider } from '@mui/material/styles';
import App from './pages/SignInPage';
import RouterApp from './AppRoutes';

ReactDOM.createRoot(document.querySelector("#root")!).render(
    <React.StrictMode>
        <RouterApp />
    </React.StrictMode>
);