import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import CssBaseline from '@mui/material/CssBaseline';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import MuiCard from '@mui/material/Card';
import { styled } from '@mui/material/styles';
import { SitemarkIcon } from '../CustomIcons';
import AppTheme from '../theme/AppTheme';
import ColorModeSelect from '../theme/ColorModeSelect';
import api from '../api'
import axios, { AxiosError } from 'axios';

const Card = styled(MuiCard)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: 'auto',
  [theme.breakpoints.up('sm')]: {
    maxWidth: '450px',
  },
  boxShadow:
    'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
  ...theme.applyStyles('dark', {
    boxShadow:
      'hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px',
  }),
}));

const SignInContainer = styled(Stack)(({ theme }) => ({
  minHeight: '100vh',
  padding: theme.spacing(2),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(4),
  },
  '&::before': {
    content: '""',
    display: 'block',
    position: 'absolute',
    zIndex: -1,
    inset: 0,
    backgroundImage:
      'radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))',
    backgroundRepeat: 'no-repeat',
    ...theme.applyStyles('dark', {
      backgroundImage:
        'radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))',
    }),
  },
}));

export default function SignInPage(props: { disableCustomTheme?: boolean }) {
  const [emailHasError, setEmailHasError] = React.useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = React.useState('');
  const [passwordHasError, setPasswordHasError] = React.useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = React.useState('');
  const [generalErrorMessage, setGeneralErrorMessage] = React.useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateInputs()) {
      return;
    }

    const data = new FormData(event.currentTarget);
    const payload = {
      email: data.get('email'),
      password: data.get('password'),
    };

    try {
      const response = await api.post('login', payload);
      console.log('Успешный вход:', response.data);

      // Логика после успешного входа, например, перенаправление пользователя
    } catch (error) {
       if (axios.isAxiosError(error) && error.response) {
         const errorMessage = error.response.data.message || 'Ошибка при входе';
      
         if (error.response.data.field === 'email') {
           setEmailHasError(true);
           setEmailErrorMessage(errorMessage);
         } else if (error.response.data.field === 'password') {
           setPasswordHasError(true);
           setPasswordErrorMessage(errorMessage);
         } else {
           setGeneralErrorMessage(errorMessage);
         }
       } else {
         console.error('Ошибка:', error);
         setGeneralErrorMessage('Произошла непредвиденная ошибка. Попробуйте еще раз.');
       }
    }
  };

  const validateInputs = () => {
    const email = document.getElementById('email') as HTMLInputElement;
    const password = document.getElementById('password') as HTMLInputElement;

    let isValid = true;

    if (!email.value || !/\S+@\S+\.\S+/.test(email.value)) {
      setEmailHasError(true);
      setEmailErrorMessage('Пожалуйста, введите действительный адрес электронной почты.');
      isValid = false;
    } else {
      setEmailHasError(false);
      setEmailErrorMessage('');
    }

    if (!password.value || password.value.length < 6) {
      setPasswordHasError(true);
      setPasswordErrorMessage('Пароль должен содержать не менее 6 символов.');
      isValid = false;
    } else {
      setPasswordHasError(false);
      setPasswordErrorMessage('');
    }

    return isValid;
  };

  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <SignInContainer direction="column" justifyContent="center" alignItems="center">
        <ColorModeSelect sx={{ position: 'fixed', top: '1rem', right: '1rem' }} />
        <Card variant="outlined">
          <SitemarkIcon />
          <Typography
            component="h1"
            variant="h4"
            sx={{ width: '100%', fontSize: 'clamp(2rem, 10vw, 2.15rem)' }}
          >
            Войти
          </Typography>
          {generalErrorMessage && (
            <Typography color="error" sx={{ mb: 2 }}>
              {generalErrorMessage}
            </Typography>
          )}
          <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
            sx={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              gap: 2,
            }}
          >
            <FormControl>
              <FormLabel htmlFor="email">Электронная почта</FormLabel>
              <TextField
                error={emailHasError}
                helperText={emailErrorMessage}
                id="email"
                type="email"
                name="email"
                placeholder="ваш@email.com"
                autoComplete="email"
                autoFocus
                required
                fullWidth
                variant="outlined"
                color={emailHasError ? 'error' : 'primary'}
                sx={{ ariaLabel: 'email' }}
              />
            </FormControl>
            <FormControl>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <FormLabel htmlFor="password">Пароль</FormLabel>
                <Link
                  component="button"
                  type="button"
                  variant="body2"
                  sx={{ alignSelf: 'baseline' }}
                >
                  Забыли пароль?
                </Link>
              </Box>
              <TextField
                error={passwordHasError}
                helperText={passwordErrorMessage}
                name="password"
                placeholder="••••••"
                type="password"
                id="password"
                autoComplete="current-password"
                required
                fullWidth
                variant="outlined"
                color={passwordHasError ? 'error' : 'primary'}
              />
            </FormControl>
            <FormControlLabel
              control={<Checkbox value="remember" color="primary" />}
              label="Запомнить меня"
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
            >
              Войти
            </Button>
          </Box>
        </Card>
      </SignInContainer>
    </AppTheme>
  );
}
