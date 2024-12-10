import React, { useCallback, useState } from "react";
import { Box, Paper, Typography } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

interface DragAndDropFileUploadProps {
  onFileUpload: (file: File) => void; // Функция обратного вызова для загрузки файла
}

const DragAndDropFileUpload: React.FC<DragAndDropFileUploadProps> = ({ onFileUpload }) => {
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDragOver(false);
      if (event.dataTransfer.files && event.dataTransfer.files[0]) {
        onFileUpload(event.dataTransfer.files[0]);
      }
    },
    [onFileUpload]
  );

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.files && event.target.files[0]) {
        onFileUpload(event.target.files[0]);
      }
    },
    [onFileUpload]
  );

  return (
    <Paper
      variant="outlined"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      sx={{
        border: dragOver ? "2px dashed #0078d4" : "2px dashed #aaa",
        padding: 4,
        textAlign: "center",
        cursor: "pointer",
        background: dragOver ? "#f0f8ff" : "#fafafa",
        transition: "background 0.3s, border-color 0.3s",
        width: "100%",
        maxWidth: 600,
        margin: "0 auto",
        borderRadius: 4,
        position: "relative", // Для абсолютного позиционирования <input>
      }}
    >
      {/* Невидимое поле <input>, занимающее всю область */}
      <input
        accept=".dcm, image/*"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          opacity: 0, // Невидимо, но кликабельно
          cursor: "pointer",
        }}
        id="upload-input"
        multiple
        type="file"
        onChange={handleChange}
      />
      {/* Видимый контент */}
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        height={150} // Фиксированная высота
      >
        <CloudUploadIcon
          sx={{
            fontSize: 60,
            color: dragOver ? "#0078d4" : "#aaa",
            mb: 1,
          }}
        />
        <Typography
          variant="body1"
          sx={{
            color: dragOver ? "#0078d4" : "#aaa",
            fontWeight: "bold",
          }}
        >
          Перетащите файлы сюда или нажмите для выбора
        </Typography>
      </Box>
    </Paper>
  );
};

export default DragAndDropFileUpload;
