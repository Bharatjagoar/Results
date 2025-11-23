import React, { useState } from "react";
import * as XLSX from "xlsx";
import "./ExcelUploadPage.css";
import StudentDetailsModal from "./StudentDetailsModal"; 
import { useParams } from "react-router-dom";

const ExcelUploadPage = () => {
  const { classId } = useParams();

  const [excelData, setExcelData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [fullRawData, setFullRawData] = useState([]); // Complete raw rows
  const [allMainHeaders, setAllMainHeaders] = useState([]); // Row 0
  const [allSubHeaders, setAllSubHeaders] = useState([]); // Row 1

  // Handle Excel Upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (event) => {
      const data = event.target.result;

      const workbook = XLSX.read(data, { type: "binary" });
      const sheetName = workbook.SheetNames[0];

      const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
        header: 1,
      });

      // Row 0: Main headers (subjects with merged cells)
      // Row 1: Sub-headers (Internals, Mid-Term, Final-Term, Total)
      const mainHeaders = sheet[0];
      const subHeaders = sheet[1];
      const rawRows = sheet.slice(2); // Data starts from row 2

      console.log("Main Headers (Row 0):", mainHeaders);
      console.log("Sub Headers (Row 1):", subHeaders);

      // Store complete headers and raw data for modal
      setAllMainHeaders(mainHeaders);
      setAllSubHeaders(subHeaders);
      setFullRawData(rawRows);

      const filteredHeaders = [];
      const filteredIndices = [];

      // Track which subject we're currently in (for merged cells)
      let currentSubject = "";

      for (let index = 0; index < mainHeaders.length; index++) {
        const mainHeaderStr = mainHeaders[index] ? mainHeaders[index].toString().trim() : "";
        const subHeaderStr = subHeaders[index] ? subHeaders[index].toString().trim().toLowerCase() : "";

        // Update current subject when we encounter a non-empty main header
        if (mainHeaderStr) {
          currentSubject = mainHeaderStr;
        }

        // Decide whether to keep this column

        // Case 1: Column has both main header and sub-header
        if (mainHeaderStr && subHeaderStr) {
          // Check if sub-header contains marks breakdown
          if (subHeaderStr.includes("(20)") || subHeaderStr.includes("(30)") ||
            subHeaderStr.includes("(50)") || subHeaderStr.includes("(100)")) {
            // This is a subject marks column - only keep Total (100)
            if (subHeaderStr.includes("total") && subHeaderStr.includes("(100)")) {
              filteredHeaders.push(`${currentSubject} Total`);
              filteredIndices.push(index);
            }
          } else {
            // This is a basic info column (like Student's Name, Father's Name)
            filteredHeaders.push(mainHeaderStr);
            filteredIndices.push(index);
            currentSubject = ""; // Reset subject tracker
          }
        }
        // Case 2: Empty main header but has sub-header (merged cell continuation)
        else if (!mainHeaderStr && subHeaderStr && currentSubject) {
          // Check if this is a marks column
          if (subHeaderStr.includes("(20)") || subHeaderStr.includes("(30)") ||
            subHeaderStr.includes("(50)") || subHeaderStr.includes("(100)")) {
            // Only keep Total (100)
            if (subHeaderStr.includes("total") && subHeaderStr.includes("(100)")) {
              filteredHeaders.push(`${currentSubject} Total`);
              filteredIndices.push(index);
            }
          } else {
            // Standalone sub-header like GRADE, Attendance
            filteredHeaders.push(subHeaders[index].toString().trim());
            filteredIndices.push(index);
          }
        }
        // Case 3: Empty main header and empty sub-header
        else if (!mainHeaderStr && !subHeaderStr) {
          // Skip empty columns
          continue;
        }
      }

      console.log("Filtered Headers:", filteredHeaders);
      console.log("Filtered Indices:", filteredIndices);

      // Format rows using only filtered columns
      const formatted = rawRows.map((row) => {
        const obj = {};
        filteredHeaders.forEach((header, i) => {
          const originalIndex = filteredIndices[i];
          obj[header] = row[originalIndex] || "";
        });
        return obj;
      });

      setColumns(filteredHeaders);
      setExcelData(formatted);
      console.log("Formatted Data:", formatted);
    };

    reader.readAsBinaryString(file);
  };

  // Allow editing inside table
  const handleEdit = (rowIndex, colName, newValue) => {
    const updated = [...excelData];
    updated[rowIndex][colName] = newValue;
    setExcelData(updated);
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    setEditMode(!editMode);
  };

  return (
    <div className="excel-container">
      <h1 className="excel-title">Upload Excel – Class {classId}</h1>

      {/* Upload Box */}
      <div className="upload-box">
        <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />
      </div>

      {/* Show table only if data exists */}
      {excelData.length > 0 && (
        <>
          <div className="header-controls">
            <h2 className="preview-title">Preview & Edit Data</h2>
            <button className="edit-toggle-btn" onClick={toggleEditMode}>
              {editMode ? "🔒 Lock Table" : "✏️ Enable Editing"}
            </button>
          </div>

          <div className="table-container">
            <table className="excel-table">
              <thead>
                <tr>
                  {columns.map((col, index) => (
                    <th key={index}>{col}</th>
                  ))}
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {excelData.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {columns.map((col, colIndex) => (
                      <td key={colIndex}>
                        <input
                          value={row[col]}
                          onChange={(e) => handleEdit(rowIndex, col, e.target.value)}
                          disabled={!editMode}
                          className={editMode ? "editable" : "locked"}
                        />
                      </td>
                    ))}

                    {/* Details button */}
                    <td>
                      <button
                        className="details-btn"
                        onClick={() => {
                          setSelectedStudent(fullRawData[rowIndex]);
                          setModalOpen(true);
                        }}
                      >
                        📄 Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <StudentDetailsModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            student={selectedStudent}
            mainHeaders={allMainHeaders}
            subHeaders={allSubHeaders}
          />

          <button className="submit-btn">Submit Data</button>
        </>
      )}
    </div>
  );
};

export default ExcelUploadPage;