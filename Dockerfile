# Базовый образ для сборки
FROM node:21.1.0-alpine3.18 as build

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json и устанавливаем зависимости
COPY package.json package-lock.json ./
RUN npm install

# Копируем исходный код приложения
COPY . .

# Сборка Vite приложения
RUN npm run build

# Базовый образ для раздачи собранных файлов
FROM nginx:alpine

# Копируем собранные файлы Vite из предыдущего этапа
COPY --from=build /app/dist /usr/share/nginx/html

# Открываем порт 80
EXPOSE 80

# Запускаем NGINX
CMD ["nginx", "-g", "daemon off;"]
