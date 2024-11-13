import React, { useRef, useState } from 'react';
import { Button, Box, Typography, Alert } from '@mui/material';
import axios from '../api';

export default function CameraCapture() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [capturedImageUrl, setCapturedImageUrl] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  // Запуск камеры
  const startCamera = async () => {
    setErrorMessage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsCameraActive(true); // Камера активна
      }
    } catch (error) {
      console.error('Ошибка при доступе к камере:', error);
      setErrorMessage('Не удалось получить доступ к камере.');
      setIsCameraActive(false); // Камера не активна
    }
  };

  // Сделать фото
  const capturePhoto = () => {
    if (canvasRef.current && videoRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;

      // Устанавливаем размеры canvas по видео
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Рисуем кадр из видео на canvas
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageUrl = canvas.toDataURL('image/png');
        setCapturedImageUrl(imageUrl); // Сохраняем изображение для отображения
      }
    }
  };

  // Отправить фото на сервер
  const uploadPhoto = async () => {
    if (!capturedImageUrl) {
      setErrorMessage('Сначала сделайте фото.');
      return;
    }

    try {
      const blob = await (await fetch(capturedImageUrl)).blob();
      const formData = new FormData();
      formData.append('file', blob, 'photo.png'); // 'photo.png' — имя файла на сервере

      const response = await axios.post('/api/upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Ответ сервера:', response.data);
    } catch (error) {
      console.error('Ошибка при отправке фото:', error);
      setErrorMessage('Не удалось отправить фото. Попробуйте снова.');
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, mt: 4 }}>
      {errorMessage && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMessage}
        </Alert>
      )}
      <video ref={videoRef} style={{ maxWidth: '100%', border: '1px solid black' }} />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      {capturedImageUrl && (
        <img
          src={capturedImageUrl}
          alt="Captured"
          style={{ maxWidth: '100%', marginTop: '10px', border: '1px solid black' }}
        />
      )}
      <Button variant="contained" onClick={startCamera}>
        Включить камеру
      </Button>
      <Button variant="contained" onClick={capturePhoto} disabled={!isCameraActive}>
        Сделать фото
      </Button>
      <Button variant="contained" onClick={uploadPhoto} disabled={!capturedImageUrl}>
        Отправить фото
      </Button>
    </Box>
  );
}
