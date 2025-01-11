import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// Создаем экземпляр axios с базовыми настройками
const api: AxiosInstance = axios.create({
  baseURL: "http://80.87.104.152:8000/", // Замените на ваш базовый URL
  timeout: 10000, // Устанавливаем таймаут в миллисекундах (например, 10 секунд)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Интерфейс для типизации ответа
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

// Интерфейс для типизации ошибок
export interface ApiError {
    message: string
}

export default api;