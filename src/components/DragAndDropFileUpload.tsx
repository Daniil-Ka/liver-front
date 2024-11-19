import React, { useCallback, useState } from 'react';
import { Box, Paper, Typography, IconButton } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

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
      style={{
        border: dragOver ? '2px dashed #000' : '2px dashed #aaa',
        padding: 20,
        textAlign: 'center',
        cursor: 'pointer',
        background: dragOver ? '#eee' : '#fafafa',
      }}
    >
      <input
        accept="image/*"
        style={{ display: 'none' }}
        id="raised-button-file"
        multiple
        type="file"
        onChange={handleChange}
      />
      <label htmlFor="raised-button-file">
        <Box display="flex" flexDirection="column" alignItems="center">
          <IconButton color="primary" aria-label="upload picture" component="span">
            <CloudUploadIcon style={{ fontSize: 60 }} />
          </IconButton>
          <Typography>Drag and drop files here or click to select files</Typography>
        </Box>
      </label>
    </Paper>
  );
};

export default DragAndDropFileUpload;
