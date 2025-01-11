import React, { useRef, useEffect } from "react";

const VideoStream = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Инициализация WebSocket
    wsRef.current = new WebSocket("ws://80.87.104.152:8000/ws");

    wsRef.current.onopen = () => {
      console.log("WebSocket подключен.");
    };

    wsRef.current.onclose = () => {
      console.log("WebSocket отключен.");
    };

    wsRef.current.onerror = (error) => {
      console.error("Ошибка WebSocket:", error);
    };

    // Доступ к камере
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        // Отображение видео
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // Передача кадров через WebSocket
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.width = 640;
        canvas.height = 640;

        const sendFrame = () => {
          if (wsRef && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              if (!context)
                  return

              if (videoRef.current)
                    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            const frame = canvas.toDataURL("image/jpeg");
            wsRef.current.send(frame); // Отправка кадра в формате Base64
          }
          requestAnimationFrame(sendFrame);
        };

        sendFrame(); // Запуск отправки кадров
      })
      .catch((error) => {
        console.error("Ошибка доступа к камере:", error);
      });

    return () => {
      // Закрываем WebSocket при размонтировании
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return <video ref={videoRef} autoPlay muted />;
};

export default VideoStream;
