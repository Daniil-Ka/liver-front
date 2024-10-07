import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { StyledEngineProvider } from '@mui/material/styles';
import App from './SignIn';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.querySelector("#root")!).render(
    <React.StrictMode>
            <App />
    </React.StrictMode>
);