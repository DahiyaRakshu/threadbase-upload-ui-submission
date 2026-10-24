import { useEffect, useRef, useState } from "react";
import apiClient from "../services/apiClient";

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 5 * 1024 * 1024;

export default function AvatarUploader() {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [uploadedUrl, setUploadedUrl] = useState("");

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const chooseFile = (nextFile) => {
    if (!nextFile) return;
    if (!ALLOWED.includes(nextFile.type)) return setError("Only image files are allowed (JPEG, PNG, WebP, GIF)");
    if (nextFile.size > MAX_SIZE) return setError("File is too large (max 5MB)");
    setError(""); setProgress(0); setUploadedUrl(""); setFile(nextFile);
    setPreview(URL.createObjectURL(nextFile));
  };

  const upload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append("avatar", file);
    try {
      const response = await apiClient.post("/api/upload", formData, {
        onUploadProgress: (event) => {
          if (event.total) setProgress(Math.round((event.loaded * 100) / event.total));
        },
      });
      setUploadedUrl(response.data.url);
    } catch (err) { setError(err.response?.data?.error || "Upload failed"); }
  };

  return <section className="avatar-uploader">
    <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={(e) => chooseFile(e.target.files[0])} />
    <div className={isDragging ? "drop-zone dragging" : "drop-zone"}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
      onDrop={(e) => { e.preventDefault(); setIsDragging(false); chooseFile(e.dataTransfer.files[0]); }}>
      {isDragging ? "Drop to upload" : "Drag an image here, or click to choose"}
    </div>
    {error && <p className="error">{error}</p>}
    {preview && <img src={preview} alt="Avatar preview" className="preview" />}
    {file && <button type="button" onClick={upload}>Upload {file.name}</button>}
    {progress > 0 && <div className="bar"><div className="fill" style={{ width: `${progress}%` }} /></div>}
    {uploadedUrl && <p>Uploaded: {uploadedUrl}</p>}
  </section>;
}
