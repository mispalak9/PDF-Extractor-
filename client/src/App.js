import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css'; // import the CSS file

function App() {
  const [file, setFile] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [selectedPages, setSelectedPages] = useState([]);
  const [viewingFile, setViewingFile] = useState(null);

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
    } else {
      alert("Please upload a PDF file.");
    }
  };

  const handleFileUpload = async () => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:3000/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUploadedFiles([...uploadedFiles, response.data.fileName]);
    } catch (error) {
      console.error(error);
    }
  };

  const handleFileDownload = async (filename) => {
    window.open(`http://localhost:3000/api/download/${filename}`);
  };

  const handleFileDelete = async (filename) => {
    try {
      const response = await axios.delete(`http://localhost:3000/api/delete/${encodeURIComponent(filename)}`);

      if (response.status === 200) {
        fetchFiles();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleFileRename = async (oldFilename) => {
    const newFilename = prompt('Enter new filename');
    if (newFilename) {
      try {
        const response = await axios.put(`http://localhost:3000/api/rename/${encodeURIComponent(oldFilename)}`, { newFilename });

        if (response.status === 200) {
          fetchFiles();
        }
      } catch (error) {
        console.error(error);
      }
    }
  };

  const fetchFiles = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/files');

      if (response.status === 200) {
        setUploadedFiles(response.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleFileView = async (filename) => {
    try {
      const response = await axios.get(`http://localhost:3000/api/pages/${encodeURIComponent(filename)}`);

      if (response.status === 200) {
        setViewingFile(filename);
        setSelectedPages(Array.from({ length: response.data }, (_, i) => i + 1));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handlePageSelection = (pageNumber) => {
    setSelectedPages(prevSelectedPages => {
      if (prevSelectedPages.includes(pageNumber)) {
        return prevSelectedPages.filter(page => page !== pageNumber);
      } else {
        return [...prevSelectedPages, pageNumber];
      }
    });
  };

  const handleCreatePdf = async () => {
    try {
      const response = await axios.post('http://localhost:3000/api/create', {
        inputFilename: viewingFile,
        pages: selectedPages
      });

      if (response.status === 200) {
        fetchFiles();
        alert(`New PDF created: ${response.data.fileName}`);
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="file-upload-box">
      <h1>Extract PDF File</h1>
      <input type="file" onChange={handleFileChange} />
      <button className="upload-button" onClick={handleFileUpload}>Upload</button>

      <h2>Uploaded files:</h2>
      <ul>
        {uploadedFiles.map((fileName, index) => (
          <li key={index}>
            {fileName}
            <button className="download-button" onClick={() => handleFileDownload(fileName)}>Download</button>
            <button className="delete-button" onClick={() => handleFileDelete(fileName)}>Delete</button>
            <button className="rename-button" onClick={() => handleFileRename(fileName)}>Rename</button>
            <button className="view-button" onClick={() => handleFileView(fileName)}>View</button>
          </li>
        ))}
      </ul>

      {viewingFile && (
        <div>
          <h2>Viewing: {viewingFile}</h2>
          <ul>
            {selectedPages.map((pageNumber, index) => (
              <li key={index}>
                <input type="checkbox" onChange={() => handlePageSelection(pageNumber)} />
                Page {pageNumber}
              </li>
            ))}
          </ul>
          <button className="create-button" onClick={handleCreatePdf}>Create PDF</button>
        </div>
      )}
    </div>
  );
}

export default App;