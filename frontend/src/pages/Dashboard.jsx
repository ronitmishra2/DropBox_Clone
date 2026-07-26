import { useState, useEffect, useRef } from 'react';
import apiClient from '../api/axios';

export default function Dashboard() {
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [folderHistory, setFolderHistory] = useState([]); // Keeps track of how deep we are
  
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  // 1. Fetch directory contents whenever currentFolderId changes
  useEffect(() => {
    fetchDirectory();
  }, [currentFolderId]);

  const fetchDirectory = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/storage/directory', {
        params: { folder_id: currentFolderId }
      });
      setFiles(response.data.files);
      setFolders(response.data.folders);
    } catch (err) {
      setError('Failed to load directory.');
      if (err.response?.status === 401) handleLogout();
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle Creating a Folder
  const handleCreateFolder = async () => {
    const folderName = window.prompt("Enter new folder name:");
    if (!folderName) return;

    try {
      await apiClient.post('/storage/folders', {
        name: folderName,
        parent_id: currentFolderId
      });
      fetchDirectory(); // Refresh the view
    } catch (err) {
      setError('Failed to create folder.');
    }
  };

  // 3. Navigate into a Folder
  const enterFolder = (folderId, folderName) => {
    setFolderHistory([...folderHistory, { id: currentFolderId, name: folderName }]);
    setCurrentFolderId(folderId);
  };

  // 4. Navigate Back (Up one level)
  const goBack = () => {
    const newHistory = [...folderHistory];
    const previousFolder = newHistory.pop();
    setFolderHistory(newHistory);
    setCurrentFolderId(previousFolder ? previousFolder.id : null);
  };

  // 5. Handle File Uploads
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    if (currentFolderId) {
      formData.append('folder_id', currentFolderId);
    }

    try {
      setUploading(true);
      setError('');
      await apiClient.post('/storage/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await fetchDirectory(); 
    } catch (err) {
      setError('Failed to upload file.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // 6. Handle File Downloads
  const handleDownload = async (fileId) => {
    try {
      const response = await apiClient.get(`/storage/download/${fileId}`);
      const link = document.createElement('a');
      link.href = response.data.download_url;
      link.setAttribute('download', response.data.file_name);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      setError('Failed to download file.');
    }
  };

  // 7. Handle File Deletion
  const handleDelete = async (fileId) => {
    if (!window.confirm("Are you sure you want to delete this file?")) return;
    try {
      await apiClient.delete(`/storage/files/${fileId}`);
      await fetchDirectory();
    } catch (err) {
      setError('Failed to delete file.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.logo}>Dropbox Clone</h1>
        <button onClick={handleLogout} style={styles.logoutBtn}>Log Out</button>
      </header>

      <main style={styles.main}>
        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.toolbar}>
          <div style={styles.navigation}>
            {currentFolderId && (
              <button onClick={goBack} style={styles.backBtn}>← Back</button>
            )}
            <h2 style={styles.title}>
              {currentFolderId ? 'Inside Folder' : 'Main Dashboard'}
            </h2>
          </div>
          
          <div style={styles.actionButtons}>
            <button onClick={handleCreateFolder} style={styles.folderBtn}>
              + New Folder
            </button>
            
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} />
            <button onClick={() => fileInputRef.current.click()} style={styles.uploadBtn} disabled={uploading}>
              {uploading ? 'Uploading...' : '+ Upload File'}
            </button>
          </div>
        </div>

        <div style={styles.fileList}>
          {loading ? (
            <p>Loading...</p>
          ) : (folders.length === 0 && files.length === 0) ? (
            <div style={styles.emptyState}>This folder is empty.</div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Type</th>
                  <th style={styles.th}>Size</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {/* Render Folders First */}
                {folders.map((folder) => (
                  <tr key={`folder-${folder.id}`} style={styles.tr}>
                    <td style={{...styles.td, fontWeight: 'bold', cursor: 'pointer', color: '#0061FE'}} onClick={() => enterFolder(folder.id, folder.name)}>
                      📁 {folder.name}
                    </td>
                    <td style={styles.td}>Folder</td>
                    <td style={styles.td}>--</td>
                    <td style={styles.td}>
                      <button onClick={() => enterFolder(folder.id, folder.name)} style={styles.downloadBtn}>Open</button>
                    </td>
                  </tr>
                ))}
                
                {/* Render Files Second */}
                {files.map((file) => (
                  <tr key={`file-${file.id}`} style={styles.tr}>
                    <td style={styles.td}>📄 {file.name}</td>
                    <td style={styles.td}>File</td>
                    <td style={styles.td}>{file.size.toLocaleString()} Bytes</td>
                    <td style={styles.td}>
                      <button onClick={() => handleDownload(file.id)} style={styles.downloadBtn}>Download</button>
                      <button onClick={() => handleDelete(file.id)} style={{...styles.downloadBtn, backgroundColor: '#fee2e2', color: '#dc2626', marginLeft: '8px'}}>Delete</button>
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

const styles = {
  container: { minHeight: '100vh', backgroundColor: '#f9f9f9', fontFamily: 'sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 32px', backgroundColor: 'white', borderBottom: '1px solid #e5e7eb' },
  logo: { fontSize: '20px', color: '#0061FE', margin: 0 },
  logoutBtn: { padding: '8px 16px', border: '1px solid #d1d5db', backgroundColor: 'white', borderRadius: '4px', cursor: 'pointer' },
  main: { padding: '32px', maxWidth: '1000px', margin: '0 auto' },
  toolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  navigation: { display: 'flex', alignItems: 'center', gap: '16px' },
  title: { margin: 0, color: '#1f2937' },
  actionButtons: { display: 'flex', gap: '12px' },
  backBtn: { padding: '10px 16px', backgroundColor: '#e5e7eb', color: '#374151', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
  folderBtn: { padding: '10px 20px', backgroundColor: '#f3f4f6', color: '#1f2937', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
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