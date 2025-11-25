import React from "react";
import "./StudentDetailsModal.css";

const StudentDetailsModal = ({ isOpen, onClose, student, mainHeaders, subHeaders }) => {
  if (!isOpen || !student || !mainHeaders || !subHeaders) return null;

  // Helper functions for mark conversion
  const convertMidTerm = (marks) => {
    // Convert marks out of 80 to out of 30
    const num = parseFloat(marks);
    if (isNaN(num) || num === 0) return 0;
    return marks;
  };

  const convertFinalTerm = (marks) => {
    // Convert marks out of 80 to out of 50
    const num = parseFloat(marks);
    if (isNaN(num) || num === 0) return 0;
    return marks;
  };

  const calculateTotal = (internals, mid, final) => {
    const int = parseFloat(internals) || 0;
    const midConverted = parseFloat(convertMidTerm(mid)) || 0;
    const finalConverted = parseFloat(convertFinalTerm(final)) || 0;
    return (int + midConverted + finalConverted).toFixed(2);
  };

  // Parse basic info (first 8 columns based on your sheet structure)
  const basicInfo = {
    "Student's Name": student[0] || "",
    "Father's Name": student[1] || "",
    "Mother's Name": student[2] || "",
    "Exam Roll No.": student[3] || "",
    "Class": student[4] || "",
    "D.O.B": student[5] || "",
    "Admission No.": student[6] || "",
    "House": student[7] || ""
  };

  // Parse subjects (starting from index 8)
  const subjectBlocks = [];
  let currentSubject = "";
  let tempBlock = {};
  let blockStartIndex = -1;

  for (let i = 8; i < mainHeaders.length; i++) {
    const mainHeader = mainHeaders[i] ? mainHeaders[i].toString().trim() : "";
    const subHeader = subHeaders[i] ? subHeaders[i].toString().trim().toLowerCase() : "";

    console.log(`Index ${i}: mainHeader="${mainHeader}", subHeader="${subHeader}", value="${student[i]}"`);

    // New subject detected
    if (mainHeader && subHeader.includes("internals")) {
      // Save previous block if exists
      if (currentSubject && blockStartIndex !== -1) {
        subjectBlocks.push(tempBlock);
      }

      // Start new block
      currentSubject = mainHeader;
      blockStartIndex = i;
      tempBlock = {
        subject: currentSubject,
        internals: student[i] || "-",
        mid: "",
        final: "",
        total: ""
      };
    }
    // Continuation of current subject (merged cells)
    else if (!mainHeader && currentSubject) {
      // Check for Mid-Term (looks for "mid" in the header)
      if (subHeader.includes("mid") && !subHeader.includes("final")) {
        tempBlock.mid = student[i] || "-";
      }
      // Check for Final-Term (looks for "final" in the header)
      else if (subHeader.includes("final")) {
        tempBlock.final = student[i] || "-";
      }
      // Check for Total (100)
      else if (subHeader.includes("total") && subHeader.includes("(100)")) {
        tempBlock.total = student[i] || "-";
      }
    }
    // Standalone columns like GRADE, Attendance
    else if (mainHeader && !subHeader.includes("internals")) {
      // Save previous subject block
      if (currentSubject && blockStartIndex !== -1) {
        subjectBlocks.push(tempBlock);
        currentSubject = "";
        blockStartIndex = -1;
      }
    }
  }

  console.log("Subject Blocks:", subjectBlocks);

  // Push last subject if exists
  if (currentSubject && blockStartIndex !== -1) {
    subjectBlocks.push(tempBlock);
  }

  // ✅ Fix: compute mid/final raw + converted fields
  subjectBlocks.forEach(block => {
    const midRaw = block.mid || "-";
    const finalRaw = block.final || "-";

    block.midRaw = midRaw;
    block.finalRaw = finalRaw;

    block.midConverted = midRaw !== "-" ? convertMidTerm(midRaw) : "-";
    block.finalConverted = finalRaw !== "-" ? convertFinalTerm(finalRaw) : "-";

    block.total = calculateTotal(block.internals, midRaw, finalRaw);
  });


  // Get GRADE and Attendance (last columns)
  const gradeIndex = mainHeaders.findIndex(h => h && h.toString().trim() === "GRADE");
  const attendanceIndex = mainHeaders.findIndex(h => h && h.toString().trim().toLowerCase() === "attendance");

  const grade = gradeIndex !== -1 ? student[gradeIndex] || "-" : "-";
  const attendance = attendanceIndex !== -1 ? student[attendanceIndex] || "-" : "-";
  console.log(subjectBlocks);
  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <button className="close-btn" onClick={onClose}>✖</button>

        <h2 className="modal-title">Student Full Details</h2>

        <h3 className="section-title">Basic Information</h3>
        <div className="info-grid">
          {Object.entries(basicInfo).map(([key, value]) => (
            <div key={key} className="info-item">
              <strong>{key}:</strong> {value}
            </div>
          ))}
        </div>

        <h3 className="section-title">Subject-wise Breakdown</h3>
        <table className="details-table">
          <thead>
            <tr>
              <th>Subject</th>
              <th>Internals (20)</th>
              <th>Mid-Term<br />(Entered/80 → Weighted/30)</th>
              <th>Final-Term<br />(Entered/80 → Weighted/50)</th>
              <th>Total (100)</th>
            </tr>
          </thead>

          <tbody>
            {subjectBlocks.map((subj, index) => (

              <tr key={index}>
                <td>{subj.subject}</td>
                <td>{subj.internals}</td>
                <td>{subj.midConverted}</td>
                <td>{subj.finalConverted}</td>
                <td><strong>{subj.total}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3 className="section-title">Additional Info</h3>
        <div className="info-grid">
          <div className="info-item">
            <strong>Grade:</strong> {grade}
          </div>
          <div className="info-item">
            <strong>Attendance:</strong> {attendance}
          </div>
        </div>

      </div>
    </div>
  );
};

export default StudentDetailsModal;