import axios from "../api";
import Starfield from "../components/StarField";
import DragAndDropFileUpload from "../components/DragAndDropFileUpload";
import {styled} from "@mui/material/styles";
import Stack from "@mui/material/Stack";
import ColorModeSelect from '../theme/ColorModeSelect';
import React, {useEffect, useRef, useState} from "react";
import {Alert, Box, Button, Slider, Typography} from "@mui/material";

const Container = styled(Stack)(({ theme }) => ({
  minHeight: '100%',
  padding: theme.spacing(2),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(4),
  },
  '&::before': {
    content: '""',
    display: 'block',
    position: 'fixed',
    zIndex: -99,
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

export default function CameraCapture() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [capturedImageUrl, setCapturedImageUrl] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [serverImageUrl, setServerImageUrl] = useState<string | null>(null);


    // Ссылки на канвасы для отображения изображения и маски
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Состояния для изображения, рисования, размера кисти и самой маски
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(10);
  const [mask, setMask] = useState<number[][]>([]);
  const lastPosition = useRef<{ x: number; y: number } | null>(null);
  const [allowDrawing, setAllowDrawing] = useState(true);

  // Запуск камеры
const startCamera = async () => {
  setErrorMessage(null);

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

  wsRef.current.onmessage = (event) => {
    const data = event.data;
    const canvas = canvasRef.current;

    // Проверяем, что данные — это Blob
    if (data instanceof Blob) {
      const reader = new FileReader();

      reader.onloadend = () => {
        const arrayBuffer = reader.result;
        const byteArray = new Uint8Array(arrayBuffer);

        // Создаём изображение из полученных данных
        const image = new Image();
        const blob = new Blob([byteArray], { type: 'image/png' });  // Убедитесь, что формат 'image/png' соответствует типу, который отправляется с сервера
        image.src = URL.createObjectURL(blob);
        setServerImageUrl(image.src); // Устанавливаем URL для отображения

        image.onload = () => {
          if (maskCanvasRef.current) {
            const maskCanvas = maskCanvasRef.current;
            const maskCtx = maskCanvas.getContext("2d");

            // Устанавливаем размеры канваса для маски
            maskCanvas.width = image.width;
            maskCanvas.height = image.height;

            setMask(initializeMask(image.width, image.height)); // Инициализируем маску для изображения

            // Создаем новый ImageData для работы с пикселями
            const tempCanvas = document.createElement("canvas");
            const tempCtx = tempCanvas.getContext("2d");
            tempCanvas.width = image.width;
            tempCanvas.height = image.height;

            // Отрисовываем изображение на временном канвасе для извлечения данных
            tempCtx?.drawImage(image, 0, 0);

            // Получаем данные пикселей с альфа-каналом
            const imageData = tempCtx?.getImageData(0, 0, image.width, image.height);

            if (imageData) {
              const mask = [];

              // Проходим по всем пикселям изображения и создаем маску
              for (let y = 0; y < image.height; y++) {
                let row = [];
                for (let x = 0; x < image.width; x++) {
                  // Индекс в массиве ImageData
                  let index = (y * image.width + x) * 4;

                  // Получаем значение alpha-канала
                  let alpha = imageData.data[index + 3];

                  // Заполняем mask 1, если alpha > 0 (непрозрачный), иначе 0
                  row.push(alpha > 254 ? 1 : 0);
                }
                mask.push(row);
              }

              // Заполняем маску
              setMask(mask);
            }
          }
        };
      };

      reader.readAsArrayBuffer(data); // Читаем Blob как ArrayBuffer
    } else {
      console.error("Получены некорректные данные:", data);
    }
  };

  // Доступ к камере
  navigator.mediaDevices
    .getUserMedia({ video: true })
    .then((stream) => {
      // Создаем элемент video для доступа к камере
      const video = document.createElement("video");
      video.srcObject = stream;
      video.play();

      video.onloadedmetadata = () => {
        // Получаем ссылки на canvas элементы
        const canvas = canvasRef.current;
        const maskCanvas = maskCanvasRef.current;

        if (canvas && maskCanvas) {
          const context = canvas.getContext("2d");
          const maskContext = maskCanvas.getContext("2d");

          // Устанавливаем размеры canvas
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          maskCanvas.width = video.videoWidth;
          maskCanvas.height = video.videoHeight;

          let lastSendTime = Date.now(); // Время последней отправки

          const sendFrame = () => {
            const currentTime = Date.now();

            // Проверяем, прошло ли 500 мс с последней отправки
            if (currentTime - lastSendTime >= 400) {
              if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                // Отправляем кадр через WebSocket
                const frame = canvas.toDataURL("image/jpeg");
                wsRef.current.send(frame); // Отправка кадра в формате Base64

                lastSendTime = currentTime; // Обновляем время последней отправки
              }
            }
          };

          // Отображение видео на канвасе и отправка кадров с интервалом 500 мс
          const updateCanvas = () => {
            // Рисуем кадр с видео на основной канвас
            context?.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Создаем маску (например, прозрачность)
            //maskContext?.clearRect(0, 0, maskCanvas.width, maskCanvas.height); // Очищаем маску
            //maskContext?.fillStyle = "rgba(0, 0, 0, 0.5)"; // Полупрозрачная маска
            //maskContext?.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

            // Проверяем и отправляем кадр
            sendFrame();

            // Запуск следующего обновления
            requestAnimationFrame(updateCanvas);
          };

          updateCanvas(); // Запуск обновления канваса
        }
      };
    })
    .catch((error) => {
      console.error("Ошибка доступа к камере:", error);
    });
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
    if (!image) {
      setErrorMessage("Сначала сделайте фото.");
      return;
    }

    // Для изображения
    const imageToBlob = (image: HTMLImageElement): Promise<Blob> => {
      return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = image.width;
          canvas.height = image.height;
          ctx.drawImage(image, 0, 0);
          canvas.toBlob(resolve, 'image/png');
        }
      });
    };

    // Для маски
    const maskToBlob = (mask: number[][]): Blob => {
      const maskJson = JSON.stringify(mask);
      return new Blob([maskJson], { type: 'application/json' });
    };

    try {
      const imageBlob = await imageToBlob(image);
      const maskBlob = maskToBlob(mask);

      const formData = new FormData();
      formData.append("file", imageBlob, "photo.png");
      formData.append("mask", maskBlob, "mask.json");

      const response = await axios.post("/edited-images/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        responseType: "blob", // Ждем бинарный ответ
      });

      console.log("Фото успешно отправлено");
    } catch (error) {
      console.error("Ошибка при отправке фото:", error);
      setErrorMessage("Не удалось отправить фото. Попробуйте снова.");
    }
  };


  // Инициализация маски в виде двумерного массива (все элементы 0)
  const initializeMask = (width: number, height: number) => {
    return Array.from({ length: height }, () => Array(width).fill(0));
  };

  // Обработчик загрузки изображения
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        setImage(img); // Загружаем изображение
        setMask(initializeMask(img.width, img.height)); // Инициализируем маску для изображения
      };
    }
  };

  // Рисуем изображение на канвасе при его загрузке
  useEffect(() => {
    if (canvasRef.current && image) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (ctx) {
        canvas.width = image.width;
        canvas.height = image.height;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        //ctx.drawImage(image, 0, 0)

        ctx.drawImage(image, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < imageData.data.length; i += 4) {
            imageData.data[i + 3] = 255;
        }
        ctx.putImageData(imageData, 0, 0);
      }
    }
  }, [image]);

  // Отображаем маску на канвасе, когда она меняется
  useEffect(() => {
    if (maskCanvasRef.current && image) {
      const canvas = maskCanvasRef.current;
      const ctx = canvas.getContext("2d", { willReadFrequently: true, alpha: false });
      if (ctx) {
        canvas.width = image.width;
        canvas.height = image.height;

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        for (let y = 0; y < mask.length; y++) {
          for (let x = 0; x < mask[0].length; x++) {
            // Закрашиваем пиксели, где значение в маске равно 1
            if (mask[y][x] === 1) {
              const index = (y * canvas.width + x) * 4;
              imageData.data[index] = 255;
              imageData.data[index + 1] = 0;
              imageData.data[index + 2] = 0;
              imageData.data[index + 3] = 100; // Полупрозрачность
            }
          }
        }
        ctx.putImageData(imageData, 0, 0); // Отображаем измененные данные
      }
    }
  }, [mask, image]);

  // Функция для рисования на маске
  const drawOnMask = (x: number, y: number) => {
    const updatedMask = [...mask];
    for (let dy = -brushSize; dy <= brushSize; dy++) {
      for (let dx = -brushSize; dx <= brushSize; dx++) {
        const nx = x + dx;
        const ny = y + dy;

        // Проверка на выход за пределы изображения
        if (
          nx >= 0 && nx < mask[0].length &&
          ny >= 0 && ny < mask.length &&
          Math.sqrt(dx * dx + dy * dy) <= brushSize
        ) {
          updatedMask[ny][nx] = 1; // Закрашиваем пиксели в маске
        }
      }
    }
    setMask(updatedMask); // Обновляем маску
  };

  // Обработчик движения мыши на канвасе
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!maskCanvasRef.current || !image || !isDrawing) return;

    const rectBounds = maskCanvasRef.current.getBoundingClientRect();
    const mouseX = Math.floor((e.clientX - rectBounds.left) * (image?.width ?? 1) / rectBounds.width);
    const mouseY = Math.floor((e.clientY - rectBounds.top) * (image?.height ?? 1) / rectBounds.height);

    // Проверяем, можно ли рисовать
    if (checkBrushTouchesMask(mouseX, mouseY) && isDrawing) {
      setAllowDrawing(true);
    }

    // Рисуем на маске, если мышь находится в допустимой области
    if (allowDrawing) {
      if (lastPosition.current) {
        const { x: lastX, y: lastY } = lastPosition.current;
        interpolateLine(lastX, lastY, mouseX, mouseY); // Интерполируем между предыдущими и текущими координатами
      }

      lastPosition.current = { x: mouseX, y: mouseY }; // Обновляем последнюю позицию
    }
  };

  // Функция для интерполяции линии между двумя точками
  const interpolateLine = (x0: number, y0: number, x1: number, y1: number) => {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = Math.round(x0 + t * dx);
      const y = Math.round(y0 + t * dy);
      drawOnMask(x, y); // Рисуем на маске
    }
  };

  // Проверка на касание кисточки с уже нарисованной областью
  const checkBrushTouchesMask = (x: number, y: number): boolean => {
    for (let dy = -brushSize; dy <= brushSize; dy++) {
      for (let dx = -brushSize; dx <= brushSize; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (
          nx >= 0 && nx < mask[0].length &&
          ny >= 0 && ny < mask.length &&
          Math.sqrt(dx * dx + dy * dy) <= brushSize &&
          mask[ny][nx] === 1 // Если касаемся закрашенной области
        ) {
          return true;
        }
      }
    }
    return false; // Нет касания с закрашенной областью
  };

  // Обработчик начала рисования
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!maskCanvasRef.current || !image) return;

    const rectBounds = maskCanvasRef.current.getBoundingClientRect();
    const mouseX = Math.floor(e.clientX - rectBounds.left);
    const mouseY = Math.floor(e.clientY - rectBounds.top);

    // Проверка на возможность начать рисование
    const canStartDrawing = mask.flat().every((val) => val === 0) || checkBrushTouchesMask(mouseX, mouseY);

    setIsDrawing(true);
    if (canStartDrawing) {
      setAllowDrawing(true); // Разрешаем рисование
      lastPosition.current = { x: mouseX, y: mouseY };
      drawOnMask(mouseX, mouseY); // Рисуем на месте клика
    } else {
      setAllowDrawing(false); // Блокируем рисование, если оно не должно начаться
    }
  };

  // Обработчик завершения рисования
  const handleMouseUp = () => {
    setIsDrawing(false);
    lastPosition.current = null;
    fillEnclosedAreas(); // Заполняем внутренние области после завершения рисования
    setAllowDrawing(false);
  };

  // Функция для заливки внутренних областей маски
  const fillEnclosedAreas = () => {
    const newMask = [...mask];
    const visited = Array.from({ length: mask.length }, () => Array(mask[0].length).fill(false));
    const stack: { x: number; y: number }[] = [];

    // Заполняем внешние области
    const floodFillExternal = (startX: number, startY: number) => {
      stack.push({ x: startX, y: startY });
      while (stack.length > 0) {
        const { x, y } = stack.pop()!;
        if (x < 0 || y < 0 || x >= mask[0].length || y >= mask.length || visited[y][x] || mask[y][x] === 1) {
          continue;
        }
        visited[y][x] = true;
        stack.push({ x: x + 1, y });
        stack.push({ x: x - 1, y });
        stack.push({ x, y: y + 1 });
        stack.push({ x, y: y - 1 });
      }
    };

    // Применяем заливку
    if (mask[0]?.length) {
      for (let x = 0; x < mask[0].length; x++) {
        if (!visited[0][x]) floodFillExternal(x, 0);
        if (!visited[mask.length - 1][x]) floodFillExternal(x, mask.length - 1);
      }
    }

    // Заполняем внутренние области
    const floodFillInternal = (startX: number, startY: number) => {
      stack.push({ x: startX, y: startY });
      while (stack.length > 0) {
        const { x, y } = stack.pop()!;
        if (x < 0 || y < 0 || x >= mask[0].length || y >= mask.length || visited[y][x] || mask[y][x] === 1) {
          continue;
        }
        visited[y][x] = true;
        newMask[y][x] = 1; // Закрашиваем внутреннюю область
        stack.push({ x: x + 1, y });
        stack.push({ x: x - 1, y });
        stack.push({ x, y: y + 1 });
        stack.push({ x, y: y - 1 });
      }
    };

    // Запуск заливки для всех внутренних областей
    for (let y = 0; y < mask.length; y++) {
      for (let x = 0; x < mask[0].length; x++) {
        if (mask[y][x] === 0 && !visited[y][x]) {
          floodFillInternal(x, y);
        }
      }
    }

    setMask(newMask);
  };

    useEffect(() => {
    if (serverImageUrl && canvasRef.current && maskCanvasRef.current) {
      const canvas = canvasRef.current;
      const maskCanvas = maskCanvasRef.current;
      const ctx = canvas.getContext("2d");
      const maskCtx = maskCanvas.getContext("2d");

      const image = new Image();
      image.src = serverImageUrl;
      image.onload = () => {
        canvas.width = image.width;
        canvas.height = image.height;

        setMask(initializeMask(image.width, image.height)); // Инициализируем маску для изображения

        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height); // Очистить канвас перед отрисовкой
          ctx.drawImage(image, 0, 0, canvas.width, canvas.height); // Рисуем изображение на канвасе

          // Извлекаем альфа-канал как маску
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const maskData = new Uint8Array(imageData.data.length / 4);
          for (let i = 0; i < imageData.data.length; i += 4) {
            maskData[i / 4] = imageData.data[i + 3]; // A канал (маска)
          }

          // Создаем изображение маски
          const maskCanvas = document.createElement("canvas");
          maskCanvas.width = canvas.width;
          maskCanvas.height = canvas.height;

          if (maskCtx) {
            // Массив mask, который будет хранить 0 или 1
            let mask = [];

            // Проходим по всем пикселям
            for (let y = 0; y < maskCanvas.height; y++) {
                let row = [];
                for (let x = 0; x < maskCanvas.width; x++) {
                    // Индекс в массиве ImageData
                    let index = (y * maskCanvas.width + x) * 4;

                    // Получаем значение alpha-канала
                    let alpha = imageData.data[index + 3];

                    // Заполняем mask 1, если alpha > 0 (непрозрачный), иначе 0
                    row.push(alpha > 254 ? 1 : 0);
                }
                mask.push(row);
            }

            setImage(image); // Загружаем изображение
            setMask(mask)
          }
        }
      };

    }
  }, [serverImageUrl]); // Этот useEffect срабатывает, когда imageUrl меняется


  return (
      <Container
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
            mt: 4,
          }}
      >
        <Starfield/>
        <ColorModeSelect sx={{position: 'fixed', top: '1rem', right: '1rem'}}/>
        <Box sx={{ height: '0.5rem' }} /> {/* Вертикальный отступ */}
        <DragAndDropFileUpload onFileUpload={handleFileUpload}/>
        {errorMessage && (
            <Alert severity="error" sx={{mb: 2}}>
              {errorMessage}
            </Alert>
        )}
        <canvas ref={canvasRef} style={{display: "none"}}/>
        {capturedImageUrl && (
            <img
                src={capturedImageUrl}
                alt="Captured"
                style={{maxWidth: "100%", marginTop: "10px", border: "1px solid black"}}
            />
        )}
        {serverImageUrl && (
            <img
                src={serverImageUrl}
                alt="Server Response"
                style={{
                  position: "absolute",
                  display: "none",
                  maxWidth: "100%",
                  marginTop: "10px",
                  border: "1px solid green"
                }}
            />
        )}

<Box
  id="data_container"
  sx={{
    width: "100%",            // Использует всю доступную ширину
    maxWidth: "640px",        // Ограничивает максимальную ширину
    aspectRatio: "1 / 1",     // Делает контейнер квадратным (1:1)
    padding: 0,
    boxSizing: "border-box",  // Учитывает padding в расчете размеров
    position: "relative",     // Для корректной работы абсолютного позиционирования canvas
  }}
>
  <canvas ref={canvasRef} style={{ position: "absolute", width: "100%", height: "100%" }} />
  <canvas
    ref={maskCanvasRef}
    style={{
      position: "absolute",
      cursor: "crosshair",
      width: "100%",           // Чтобы канвас занимал весь размер родителя
      height: "100%",
    }}
    onMouseDown={handleMouseDown}
    onMouseMove={handleMouseMove}
    onMouseUp={handleMouseUp}
    onMouseLeave={handleMouseUp}
  />
</Box>


        <video ref={videoRef} autoPlay playsInline style={{display:"none", maxWidth: "100%", border: "1px solid black"}}/>

      <Stack direction="row" spacing={2}>
        <Button variant="contained" onClick={startCamera}>
          Включить камеру
        </Button>
        <Button variant="contained" onClick={uploadCapturedPhoto} disabled={!image}>
          Отправить фото с изменённым контуром
        </Button>
      </Stack>


      <Box sx={{ textAlign: "center", padding: "20px", maxWidth: 600, width: '100%' }}>
        <Stack direction="row" spacing={2} justifyContent="center" alignItems="center">
          <Typography>Размер кисти: {brushSize}</Typography>
          <Slider
            value={brushSize}
            min={1}
            max={50}
            step={1}
            onChange={(e, value) => setBrushSize(value as number)}
          />
        </Stack>
      </Box>
      </Container>
  );
}