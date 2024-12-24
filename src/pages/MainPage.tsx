import React, { useRef, useState, useEffect } from "react";
import { Button, Box, Typography, Slider } from "@mui/material";

export default function MaskSelectionCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(10);
  const [mask, setMask] = useState<number[][]>([]);
  const lastPosition = useRef<{ x: number; y: number } | null>(null);
  const [allowDrawing, setAllowDrawing] = useState(true);

  const initializeMask = (width: number, height: number) => {
    return Array.from({ length: height }, () => Array(width).fill(0));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        setImage(img);
        setMask(initializeMask(img.width, img.height));
      };
    }
  };

  useEffect(() => {
    if (canvasRef.current && image) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (ctx) {
        canvas.width = image.width;
        canvas.height = image.height;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0);
      }
    }
  }, [image]);

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
            if (mask[y][x] === 1) {
              const index = (y * canvas.width + x) * 4;
              imageData.data[index] = 255;
              imageData.data[index + 1] = 0;
              imageData.data[index + 2] = 0;
              imageData.data[index + 3] = 100;
            }
          }
        }
        ctx.putImageData(imageData, 0, 0);
      }
    }
  }, [mask, image]);

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
        updatedMask[ny][nx] = 1;
      }
    }
  }
  setMask(updatedMask);
};

const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
  if (!maskCanvasRef.current || !image || !isDrawing) return;

  const rectBounds = maskCanvasRef.current.getBoundingClientRect();
  const mouseX = Math.floor((e.clientX - rectBounds.left) * (image?.width ?? 1) / rectBounds.width);
  const mouseY = Math.floor((e.clientY - rectBounds.top) * (image?.height ?? 1) / rectBounds.height);
  console.log(checkBrushTouchesMask(mouseX, mouseY))

  if (true) {
    if (checkBrushTouchesMask(mouseX, mouseY) && isDrawing)
      setAllowDrawing(true);
  }

  // Мы рисуем на маске, только если мышь находится на допустимой области
  if (allowDrawing) {
    if (lastPosition.current) {
      const { x: lastX, y: lastY } = lastPosition.current;
      interpolateLine(lastX, lastY, mouseX, mouseY);
    }

    lastPosition.current = { x: mouseX, y: mouseY };
  }
};

  const interpolateLine = (x0: number, y0: number, x1: number, y1: number) => {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = Math.round(x0 + t * dx);
      const y = Math.round(y0 + t * dy);
      drawOnMask(x, y);
    }
  };

    // Проверка на касание кисточки с закрашенной областью
// Проверка на касание кисточки с уже нарисованной областью
// Проверка, касается ли кисточка уже нарисованной области
const checkBrushTouchesMask = (x: number, y: number): boolean => {
  for (let dy = -brushSize; dy <= brushSize; dy++) {
    for (let dx = -brushSize; dx <= brushSize; dx++) {
      const nx = x + dx;
      const ny = y + dy;
      if (
        nx >= 0 &&
        ny >= 0 &&
        ny < mask.length &&
        nx < mask[0].length &&
        Math.sqrt(dx * dx + dy * dy) <= brushSize &&
        mask[ny][nx] === 1
      ) {
        return true; // Есть касание с уже нарисованной областью
      }
    }
  }
  return false; // Нет касания с нарисованной областью
};

const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
  if (!maskCanvasRef.current || !image) return;

  const rectBounds = maskCanvasRef.current.getBoundingClientRect();
  const mouseX = Math.floor(e.clientX - rectBounds.left);
  const mouseY = Math.floor(e.clientY - rectBounds.top);

  // Проверка на возможность начать рисование
  const canStartDrawing = mask.flat().every((val) => val === 0) || checkBrushTouchesMask(mouseX, mouseY);

  setIsDrawing(true); // Начинаем рисовать
  if (canStartDrawing) {
    setAllowDrawing(true); // Разрешаем рисование
    lastPosition.current = { x: mouseX, y: mouseY };
    drawOnMask(mouseX, mouseY);
  } else {
    setAllowDrawing(false); // Блокируем рисование, если оно не должно начаться
  }
};

const handleMouseUp = () => {
  setIsDrawing(false);
  lastPosition.current = null;
  fillEnclosedAreas();
  setAllowDrawing(false);  // Блокируем рисование после отпускания кнопки
};

  // Функция для заливки пустых областей
const fillEnclosedAreas = () => {
  const newMask = [...mask];
  const visited = Array.from({ length: mask.length }, () => Array(mask[0].length).fill(false));

  const stack: { x: number; y: number }[] = [];

  // Начнем с проверки всех внешних клеток
  const floodFillExternal = (startX: number, startY: number) => {
    stack.push({ x: startX, y: startY });
    while (stack.length > 0) {
      const { x, y } = stack.pop()!;

      if (
        x < 0 ||
        y < 0 ||
        x >= mask[0].length ||
        y >= mask.length ||
        visited[y][x] ||
        mask[y][x] === 1
      ) {
        continue;
      }

      visited[y][x] = true;

      // Добавляем соседей в стек
      if (x + 1 < mask[0].length) stack.push({ x: x + 1, y });
      if (x - 1 >= 0) stack.push({ x: x - 1, y });
      if (y + 1 < mask.length) stack.push({ x, y: y + 1 });
      if (y - 1 >= 0) stack.push({ x, y: y - 1 });
    }
  };

  // Начнем с внешней области и помечаем все "открытые" клетки
  for (let x = 0; x < mask[0].length; x++) {
    if (!visited[0][x]) floodFillExternal(x, 0); // Верхний край
    if (!visited[mask.length - 1][x]) floodFillExternal(x, mask.length - 1); // Нижний край
  }

  for (let y = 0; y < mask.length; y++) {
    if (!visited[y][0]) floodFillExternal(0, y); // Левый край
    if (!visited[y][mask[0].length - 1]) floodFillExternal(mask[0].length - 1, y); // Правый край
  }

  // Теперь залить все "внутренние" области
  const floodFillInternal = (startX: number, startY: number) => {
    stack.push({ x: startX, y: startY });
    while (stack.length > 0) {
      const { x, y } = stack.pop()!;

      if (
        x < 0 ||
        y < 0 ||
        x >= mask[0].length ||
        y >= mask.length ||
        visited[y][x] ||
        mask[y][x] === 1
      ) {
        continue;
      }

      visited[y][x] = true;
      newMask[y][x] = 1; // Закрашиваем внутреннюю область

      // Добавляем соседей в стек
      if (x + 1 < mask[0].length) stack.push({ x: x + 1, y });
      if (x - 1 >= 0) stack.push({ x: x - 1, y });
      if (y + 1 < mask.length) stack.push({ x, y: y + 1 });
      if (y - 1 >= 0) stack.push({ x, y: y - 1 });
    }
  };

  // Запускаем floodFill для каждой незакрашенной внутренней клетки
  for (let y = 0; y < mask.length; y++) {
    for (let x = 0; x < mask[0].length; x++) {
      if (mask[y][x] === 0 && !visited[y][x]) {
        floodFillInternal(x, y); // Только для внутренних областей
      }
    }
  }

  setMask(newMask);
};


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
