import React, { useState } from "react";
import * as XLSX from "xlsx";
import "./ExcelUploadPage.css";
import StudentDetailsModal from "./StudentDetailsModal";
import { useParams } from "react-router-dom";

const columns = [
  "name",
  "fatherName",
  "motherName",
  "examRollNo",
  "class",
  "dob",
  "admissionNo",
  "house",
  "internalHindi",
  "midHindi",
  "endHindi",
  "totalHindi",
  "gradeHindi",
  "internalEng",
  "midEng",
  "endEng",
  "totalEng",
  "gradeEng",
  "internalMaths",
  "midMaths",
  "endMaths",
  "totalMaths",
  "gradeMaths",
  "internalScience",
  "midScience",
  "endScience",
  "totalScience",
  "gradeScience",
  "internalSst",
  "midSst",
  "endSst",
  "totalSst",
  "gradeSst",
  "internalSanskrit",
  "midSanskrit",
  "endSanskrit",
  "totalSanskrit",
  "gradeSanskrit",
  "overallGrade",
  "result",
  "grandTotal"
];


const ExcelUploadPage = () => {
  const { classId } = useParams();

  const [excelData, setExcelData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedStudentIndex, setSelectedStudentIndex] = useState(null);
  const [fullRawData, setFullRawData] = useState([]);
  const [allMainHeaders, setAllMainHeaders] = useState([]);
  const [allSubHeaders, setAllSubHeaders] = useState([]);
  const [filteredIndices, setFilteredIndices] = useState([]); // ⭐ Store filtered indices

  // ⭐ Helper function to calculate total marks
  const calculateTotalForSubject = (row, mainHeaders, subHeaders, subjectName) => {
    let internals = 0, mid = 0, final = 0;

    for (let i = 0; i < mainHeaders.length; i++) {
      const mainHeader = mainHeaders[i] ? mainHeaders[i].toString().trim() : "";
      const subHeader = subHeaders[i] ? subHeaders[i].toString().trim().toLowerCase() : "";

      if (mainHeader === subjectName || (!mainHeader && subjectName)) {
        if (subHeader.includes("internals")) {
          internals = parseFloat(row[i]) || 0;
        } else if (subHeader.includes("mid") && !subHeader.includes("final")) {
          mid = parseFloat(row[i]) || 0;
        } else if (subHeader.includes("final")) {
          final = parseFloat(row[i]) || 0;
        }
      }
    }

    return (internals + mid + final).toFixed(2);
  };

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

      const mainHeaders = sheet[0];
      const subHeaders = sheet[1];
      const rawRows = sheet.slice(2);

      console.log("Main Headers (Row 0):", mainHeaders);
      console.log("Sub Headers (Row 1):", subHeaders);

      setAllMainHeaders(mainHeaders);
      setAllSubHeaders(subHeaders);
      setFullRawData(rawRows);

      const filteredHeaders = [];
      const indices = [];
      let currentSubject = "";

      for (let index = 0; index < mainHeaders.length; index++) {
        const mainHeaderStr = mainHeaders[index] ? mainHeaders[index].toString().trim() : "";
        const subHeaderStr = subHeaders[index] ? subHeaders[index].toString().trim().toLowerCase() : "";

        if (mainHeaderStr) {
          currentSubject = mainHeaderStr;
        }

        if (mainHeaderStr && subHeaderStr) {
          if (subHeaderStr.includes("(20)") || subHeaderStr.includes("(30)") ||
            subHeaderStr.includes("(50)") || subHeaderStr.includes("(100)")) {
            if (subHeaderStr.includes("total")) {
              filteredHeaders.push(`${currentSubject} Total`);
              indices.push(index);
            }
          } else {
            filteredHeaders.push(mainHeaderStr);
            indices.push(index);
            currentSubject = "";
          }
        }
        else if (!mainHeaderStr && subHeaderStr && currentSubject) {
          if (subHeaderStr.includes("(20)") || subHeaderStr.includes("(30)") ||
            subHeaderStr.includes("(50)") || subHeaderStr.includes("(100)")) {
            if (subHeaderStr.includes("total")) {
              filteredHeaders.push(`${currentSubject} Total`);
              indices.push(index);
            }
          } else {
            filteredHeaders.push(subHeaders[index].toString().trim());
            indices.push(index);
          }
        }
        else if (!mainHeaderStr && !subHeaderStr) {
          continue;
        }
      }

      console.log("Filtered Headers:", filteredHeaders);
      console.log("Filtered Indices:", indices);

      setFilteredIndices(indices);

      const formatted = rawRows.map((row) => {
        const obj = {};
        filteredHeaders.forEach((header, i) => {
          const originalIndex = indices[i];
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

  const handleEdit = (rowIndex, colName, newValue) => {
    const updated = [...excelData];
    updated[rowIndex][colName] = newValue;
    setExcelData(updated);
  };

  const toggleEditMode = () => {
    setEditMode(!editMode);
  };

  const transformDataForBackend = () => {
    // First, let's log to debug
    console.log("🔍 Debugging Headers:");
    console.log("Main Headers:", allMainHeaders);
    console.log("Sub Headers:", allSubHeaders);
    console.log("First Row Sample:", fullRawData[0]);

    const transformedData = fullRawData.map((row, rowIdx) => {
      const studentData = {
        name: row[0] || "",
        fatherName: row[1] || "",
        motherName: row[2] || "",
        examRollNo: row[3] || "",
        class: row[4] || "",
        dob: row[5] || "",
        admissionNo: row[6] || "",
        house: row[7] || "",
        subjects: {},
        overallGrade: null,
        result: null,
        grandTotal: null
      };

      let currentSubject = "";
      let subjectData = {
        internals: null,
        midTerm: null,
        finalTerm: null,
        total: null,
        grade: null
      };

      // Start from index 8 (after basic info)
      for (let i = 8; i < row.length; i++) {
        const mainHeader = allMainHeaders[i] ? allMainHeaders[i].toString().trim() : "";
        const subHeader = allSubHeaders[i] ? allSubHeaders[i].toString().trim().toLowerCase() : "";
        const cellValue = row[i];

        // Log first student for debugging
        if (rowIdx === 0) {
          console.log(`Index ${i}: Main="${mainHeader}" | Sub="${subHeader}" | Value="${cellValue}"`);
        }

        // Skip empty columns
        if (!mainHeader && !subHeader) {
          continue;
        }

        // Check if this is a subject name (main header exists and is not GRADE/Arts/Sports/Attendance)
        const isSubjectHeader = mainHeader &&
          !mainHeader.toLowerCase().includes("grade") &&
          !mainHeader.toLowerCase().includes("arts") &&
          !mainHeader.toLowerCase().includes("sports") &&
          !mainHeader.toLowerCase().includes("attendance");

        // Detect new subject
        if (isSubjectHeader) {
          // Save previous subject if it has data
          if (currentSubject && Object.values(subjectData).some(v => v !== null)) {
            studentData.subjects[currentSubject] = { ...subjectData };
          }

          // Check if current column has marks (internals column)
          if (subHeader.includes("internals") || subHeader.includes("(20)")) {
            currentSubject = mainHeader;
            subjectData = {
              internals: parseFloat(cellValue) || 0,
              midTerm: null,
              finalTerm: null,
              total: null,
              grade: null
            };
          }
          continue;
        }

        // If we're in a subject, collect the marks
        if (currentSubject && !mainHeader) {
          if (subHeader.includes("mid") && subHeader.includes("(30)")) {
            subjectData.midTerm = parseFloat(cellValue) || 0;
          } else if (subHeader.includes("final") && subHeader.includes("(50)")) {
            subjectData.finalTerm = parseFloat(cellValue) || 0;
          } else if (subHeader.includes("total") && subHeader.includes("(100)")) {
            subjectData.total = parseFloat(cellValue) || 0;
          } else if (!subHeader.includes("(") && subHeader) {
            // This is the grade (no parentheses)
            subjectData.grade = cellValue || "";
            // Save subject after grade
            studentData.subjects[currentSubject] = { ...subjectData };
            currentSubject = ""; // Reset
          }
        }

        // Handle GRADE column (overall grade)
        if (mainHeader.toLowerCase().includes("grade") && !subHeader.includes("(")) {
          studentData.overallGrade = cellValue || "";
        }

        // Handle Arts/Sports column (result)
        if (subHeader.toLowerCase().includes("arts") || subHeader.toLowerCase().includes("sports")) {
          studentData.result = cellValue || "";
        }

        // Handle Attendance/Grand Total (last number column)
        if (subHeader.toLowerCase().includes("attendance") || i === row.length - 1) {
          const numValue = parseFloat(cellValue);
          if (!isNaN(numValue)) {
            studentData.grandTotal = numValue;
          }
        }
      }

      return studentData;
    });

    return transformedData;
  };

  const handleSubmit = () => {
    const transformedData = transformDataForBackend();
    console.log("📄 TRANSFORMED DATA FOR BACKEND:", JSON.stringify(transformedData, null, 2));
  };



  return (
    <div className="excel-container">
      <h1 className="excel-title">Upload Excel – Class {classId}</h1>

      <div className="upload-box">
        <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />
      </div>

      {excelData.length > 0 && (
        <>
          <div className="header-controls">
            <h2 className="preview-title">Preview & Edit Data</h2>
            {/* <button className="edit-toggle-btn" onClick={toggleEditMode}>
              {editMode ? "🔒 Lock Table" : "✏️ Enable Editing"}
            </button> */}
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

                    <td>
                      <button
                        className="details-btn"
                        onClick={() => {
                          setSelectedStudent(fullRawData[rowIndex]);
                          setSelectedStudentIndex(rowIndex);
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

          <button className="submit-btn" onClick={handleSubmit}>Submit Data</button>
        </>
      )}
    </div>
  );
};

export default ExcelUploadPage;