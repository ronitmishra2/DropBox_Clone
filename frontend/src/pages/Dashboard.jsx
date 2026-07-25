import { useState, useEffect, useRef } from 'react';
import apiClient from '../api/axios';

export default function Dashboard() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  // 1. Fetch files when the dashboard loads
  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/storage/files');
      setFiles(response.data.files);
    } catch (err) {
      setError('Failed to load files.');
      if (err.response?.status === 401) handleLogout(); // Token expired
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle File Uploads
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Use FormData to send a multipart/form-data request
    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);
      setError('');
      await apiClient.post('/storage/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Refresh the file list to show the new file
      await fetchFiles(); 
    } catch (err) {
      setError('Failed to upload file.');
    } finally {
      setUploading(false);
      // Reset the file input so you can upload the same file again if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // 3. Handle File Downloads via Presigned URL
  const handleDownload = async (fileId) => {
    try {
      const response = await apiClient.get(`/storage/download/${fileId}`);
      const downloadUrl = response.data.download_url;
      
      // Create a temporary hidden link and click it to trigger the download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', response.data.file_name);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      setError('Failed to download file.');
    }
  };

  // 4. Handle File Deletion
  const handleDelete = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;

    try {
      await apiClient.delete(`/storage/files/${fileId}`);
      await fetchFiles(); // Refresh the file list
    } catch (err) {
      setError('Failed to delete file.');
    }
  };

  // 4. Logout User
  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <h1 style={styles.logo}>Dropbox Clone</h1>
        <button onClick={handleLogout} style={styles.logoutBtn}>Log Out</button>
      </header>

      {/* Main Content Area */}
      <main style={styles.main}>
        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.toolbar}>
          <h2 style={styles.title}>Your Files</h2>
          
          {/* Hidden File Input & Custom Upload Button */}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            style={{ display: 'none' }} 
          />
          <button 
            onClick={() => fileInputRef.current.click()} 
            style={styles.uploadBtn}
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : '+ Upload File'}
          </button>
        </div>

{/* File List */}
        <div style={styles.fileList}>
          {loading ? (
            <p>Loading files...</p>
          ) : files.length === 0 ? (
            <div style={styles.emptyState}>No files uploaded yet.</div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Size (Bytes)</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {files.map((file) => (
                  <tr key={file.id} style={styles.tr}>
                    <td style={styles.td}>{file.name}</td>
                    <td style={styles.td}>{file.size.toLocaleString()}</td>
                    <td style={styles.td}>
                      <button 
                        onClick={() => handleDownload(file.id)}
                        style={styles.downloadBtn}
                      >
                        Download
                      </button>
                      
                      {/* Added Delete Button Here */}
                      <button 
                        onClick={() => handleDelete(file.id)}
                        style={{...styles.downloadBtn, backgroundColor: '#fee2e2', color: '#dc2626', marginLeft: '8px'}}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}

// Basic inline styles
const styles = {
  container: { minHeight: '100vh', backgroundColor: '#f9f9f9', fontFamily: 'sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 32px', backgroundColor: 'white', borderBottom: '1px solid #e5e7eb' },
  logo: { fontSize: '20px', color: '#0061FE', margin: 0 },
  logoutBtn: { padding: '8px 16px', border: '1px solid #d1d5db', backgroundColor: 'white', borderRadius: '4px', cursor: 'pointer' },
  main: { padding: '32px', maxWidth: '1000px', margin: '0 auto' },
  toolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  title: { margin: 0, color: '#1f2937' },
  uploadBtn: { padding: '10px 20px', backgroundColor: '#0061FE', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
  fileList: { backgroundColor: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  th: { paddingBottom: '12px', borderBottom: '2px solid #e5e7eb', color: '#6b7280', fontWeight: '600' },
  td: { padding: '12px 0', borderBottom: '1px solid #e5e7eb', color: '#374151' },
  tr: { transition: 'background-color 0.2s' },
  downloadBtn: { padding: '6px 12px', backgroundColor: '#e0f2fe', color: '#0284c7', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' },
  emptyState: { textAlign: 'center', color: '#6b7280', padding: '40px 0' },
  error: { backgroundColor: '#fee2e2', color: '#dc2626', padding: '12px', borderRadius: '4px', marginBottom: '16px' }
};