import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { StyledEngineProvider } from '@mui/material/styles';
import App from './SignIn';
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import {LocalizationProvider} from "@mui/x-date-pickers/LocalizationProvider";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.querySelector("#root")!).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
        <StyledEngineProvider injectFirst>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <App />
        </LocalizationProvider>
        </StyledEngineProvider>
        </QueryClientProvider>
    </React.StrictMode>
);