import React, { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  baseOpacity: number;
  layer: number;
}

interface ShootingStar {
  x: number;
  y: number;
  length: number;
  speed: number;
  opacity: number;
  dx: number;
  dy: number;
}

const Starfield: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  let stars: Star[] = [];
  const layerCount = 3; // Количество слоёв для параллакса
  const speeds = [0.05, 0.1, 0.2]; // Скорости звёзд
  const baseStarCount = 50; // Базовое количество звёзд на слой
  let shootingStar: ShootingStar | null = null;
  let animationFrameId: number;

  const resizeCanvas = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    createStars();
  };

  const createStars = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    stars = [];
    const scalingFactor = Math.max(canvas.width, canvas.height) / 1000; // Масштаб звёзд
    for (let i = 0; i < layerCount; i++) {
      const starCount = Math.floor(baseStarCount * scalingFactor * (i + 1));
      for (let j = 0; j < starCount; j++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * (i + 1) + 0.5,
          speed: speeds[i],
          opacity: Math.random(),
          baseOpacity: Math.random() * 0.5 + 0.5,
          layer: i,
        });
      }
    }
  };

  const updateStars = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    stars.forEach((star) => {
      star.y -= star.speed;
      star.opacity =
        star.baseOpacity + Math.sin(Date.now() * 0.001 * star.speed) * 0.3;
      if (star.y < 0) {
        star.y = canvas.height;
        star.x = Math.random() * canvas.width;
      }
    });
  };

  const drawStars = (ctx: CanvasRenderingContext2D) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Фон с градиентом
    const gradient = ctx.createRadialGradient(
      canvas.width / 2,
      canvas.height / 2,
      canvas.width / 8,
      canvas.width / 2,
      canvas.height / 2,
      canvas.width
    );
    gradient.addColorStop(0, "rgba(10, 20, 40, 1)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 1)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Рисуем звёзды
    stars.forEach((star) => {
      ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
      ctx.fillRect(star.x, star.y, star.size, star.size);
    });
  };

  const createShootingStar = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const startX = Math.random() * canvas.width;
    const startY = Math.random() * canvas.height;
    const angle = Math.random() * Math.PI * 2;
    const length = Math.random() * 300 + 100;
    const speed = Math.random() * 4 + 2;

    shootingStar = {
      x: startX,
      y: startY,
      length: length,
      speed: speed,
      opacity: 1,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
    };

    setTimeout(createShootingStar, Math.random() * 20000 + 20000);
  };

  const updateShootingStar = () => {
    if (!shootingStar || !canvasRef.current) return;
    const canvas = canvasRef.current;

    shootingStar.x += shootingStar.dx;
    shootingStar.y += shootingStar.dy;
    shootingStar.opacity -= 0.01;

    if (
      shootingStar.opacity <= 0 ||
      shootingStar.x < 0 ||
      shootingStar.x > canvas.width ||
      shootingStar.y < 0 ||
      shootingStar.y > canvas.height
    ) {
      shootingStar = null;
    }
  };

  const drawShootingStar = (ctx: CanvasRenderingContext2D) => {
    if (!shootingStar) return;

    const gradient = ctx.createLinearGradient(
      shootingStar.x,
      shootingStar.y,
      shootingStar.x - shootingStar.dx * shootingStar.length,
      shootingStar.y - shootingStar.dy * shootingStar.length
    );
    gradient.addColorStop(0, `rgba(255, 255, 255, ${shootingStar.opacity})`);
    gradient.addColorStop(1, `rgba(255, 255, 255, 0)`);

    ctx.beginPath();
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2;
    ctx.moveTo(shootingStar.x, shootingStar.y);
    ctx.lineTo(
      shootingStar.x - shootingStar.dx * shootingStar.length,
      shootingStar.y - shootingStar.dy * shootingStar.length
    );
    ctx.stroke();
    ctx.closePath();
  };

  const animate = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    updateStars();
    updateShootingStar();
    drawStars(ctx);
    drawShootingStar(ctx);

    animationFrameId = requestAnimationFrame(animate);
  };

  useEffect(() => {
    resizeCanvas();
    createStars();
    setTimeout(createShootingStar, Math.random() * 20000 + 20000);
    animate();

    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="starfield"
      style={{
        display: "block",
        zIndex: -100,
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
      }}
    />
  );
};

export default Starfield;
