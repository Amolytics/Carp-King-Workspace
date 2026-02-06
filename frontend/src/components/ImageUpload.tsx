import React, { useRef, useState } from 'react';
import AdminButton from './AdminButton';

const ImageUpload: React.FC<{ onUpload: (url: string) => void }> = ({ onUpload }) => {
  const fileInput = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileInput.current?.files?.[0]) return;
    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append('image', fileInput.current.files[0]);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      onUpload(data.url);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <AdminButton />
      <form onSubmit={handleUpload}>
        <input type="file" accept="image/*" ref={fileInput} />
        <button type="submit" disabled={uploading}>Upload Image</button>
        {error && <div style={{ color: 'red' }}>{error}</div>}
      </form>
    </>
  );
};

export default ImageUpload;
