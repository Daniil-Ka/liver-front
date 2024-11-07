import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { StyledEngineProvider } from '@mui/material/styles';
import App from './pages/SignInPage';

ReactDOM.createRoot(document.querySelector("#root")!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);