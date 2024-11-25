import React, { useRef, useState } from "react";
import { Button, Box, Alert } from "@mui/material";
import axios from "../api";
import DragAndDropFileUpload from "../components/DragAndDropFileUpload";

export default function CameraCapture() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [capturedImageUrl, setCapturedImageUrl] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [serverImageUrl, setServerImageUrl] = useState<string | null>(null);

  // Запуск камеры
  const startCamera = async () => {
    setErrorMessage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsCameraActive(true);
      }
    } catch (error) {
      console.error("Ошибка при доступе к камере:", error);
      setErrorMessage("Не удалось получить доступ к камере.");
      setIsCameraActive(false);
    }
  };

  // Сделать фото
  const capturePhoto = () => {
    if (canvasRef.current && videoRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageUrl = canvas.toDataURL("image/png");
        setCapturedImageUrl(imageUrl);
      }
    }
  };

  // Отправка файла на сервер
  const uploadFile = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post("/api/upload/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        responseType: "blob", // Ждем бинарный ответ
      });

      console.log("Файл успешно отправлен");

      // Создаем URL для отображения изображения
      const imageUrl = URL.createObjectURL(response.data);
      setServerImageUrl(imageUrl); // Устанавливаем URL для отображения
      setErrorMessage(null);
    } catch (error) {
      console.error("Ошибка при отправке файла:", error);
      setErrorMessage("Не удалось отправить файл. Попробуйте снова.");
    }
  };

  // Автоматическая отправка файла при его выборе
  const handleFileUpload = (file: File) => {
    const allowedExtensions = [".dcm", ".png", ".jpg", ".jpeg"];
    const fileExtension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();

    if (allowedExtensions.includes(fileExtension)) {
      console.log("Файл загружен:", file.name);
      uploadFile(file); // Автоматическая отправка
    } else {
      setErrorMessage("Пожалуйста, загрузите DICOM-файл или изображение (.png, .jpg, .jpeg).");
    }
  };

  // Отправка сделанного фото
  const uploadCapturedPhoto = async () => {
    if (!capturedImageUrl) {
      setErrorMessage("Сначала сделайте фото.");
      return;
    }

    try {
      const blob = await (await fetch(capturedImageUrl)).blob();
      const formData = new FormData();
      formData.append("file", blob, "photo.png");

      const response = await axios.post("/api/upload/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        responseType: "blob", // Ждем бинарный ответ
      });

      console.log("Фото успешно отправлено");

      // Создаем URL для изображения
      const imageUrl = URL.createObjectURL(response.data);
      setServerImageUrl(imageUrl);
      setErrorMessage(null);
    } catch (error) {
      console.error("Ошибка при отправке фото:", error);
      setErrorMessage("Не удалось отправить фото. Попробуйте снова.");
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
        mt: 4,
      }}
    >
      <DragAndDropFileUpload onFileUpload={handleFileUpload} />
      {errorMessage && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMessage}
        </Alert>
      )}
      <video ref={videoRef} style={{ maxWidth: "100%", border: "1px solid black" }} />
      <canvas ref={canvasRef} style={{ display: "none" }} />
      {capturedImageUrl && (
        <img
          src={capturedImageUrl}
          alt="Captured"
          style={{ maxWidth: "100%", marginTop: "10px", border: "1px solid black" }}
        />
      )}
      {serverImageUrl && (
        <img
          src={serverImageUrl}
          alt="Server Response"
          style={{ maxWidth: "100%", marginTop: "10px", border: "1px solid green" }}
        />
      )}
      <Button variant="contained" onClick={startCamera}>
        Включить камеру
      </Button>
      <Button variant="contained" onClick={capturePhoto} disabled={!isCameraActive}>
        Сделать фото
      </Button>
      <Button variant="contained" onClick={uploadCapturedPhoto} disabled={!capturedImageUrl}>
        Отправить фото
      </Button>
    </Box>
  );
}
