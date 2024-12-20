import React, { useRef, useState, useEffect } from "react";
import { Button, Box, Typography, Slider } from "@mui/material";

export default function MaskSelectionCanvas() {
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
        ctx.drawImage(image, 0, 0); // Рисуем изображение на канвасе
      }
    }
  }, [image]);

  // Отображаем маску на канвасе, когда она меняется
  useEffect(() => {
    if (maskCanvasRef.current && image) {
      const canvas = maskCanvasRef.current;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (ctx) {
        canvas.width = image.width;
        canvas.height = image.height;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

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
    for (let x = 0; x < mask[0].length; x++) {
      if (!visited[0][x]) floodFillExternal(x, 0);
      if (!visited[mask.length - 1][x]) floodFillExternal(x, mask.length - 1);
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

  // Функция для сохранения маски
  const handleSave = () => {
    console.log("Сохраненная маска:", mask);
    alert("Маска сохранена. Проверьте консоль.");
  };

  return (
    <Box sx={{ textAlign: "center", marginTop: "20px" }}>
      <input type="file" accept="image/*" onChange={handleImageUpload} />
      <Box sx={{ margin: "10px 0" }}>
        <Typography>Размер кисти: {brushSize}</Typography>
        <Slider
          value={brushSize}
          min={1}
          max={50}
          step={1}
          onChange={(e, value) => setBrushSize(value as number)}
        />
      </Box>
      <Box
        sx={{
          position: "relative",
          display: "inline-block",
          border: "1px solid black",
        }}
      >
        <canvas ref={canvasRef} style={{ position: "absolute", top: 0, left: 0 }} />
        <canvas
          ref={maskCanvasRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            cursor: "crosshair",
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </Box>
      <Button
        variant="contained"
        onClick={handleSave}
        disabled={!image}
        sx={{ marginTop: "10px" }}
      >
        Сохранить маску
      </Button>
    </Box>
  );
}
