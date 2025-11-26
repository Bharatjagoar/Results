import React, { useEffect, useState } from "react";
import "./StudentDetailsModal.css";

const StudentDetailsModal = ({ isOpen, onClose, student, mainHeaders, subHeaders }) => {
  const [blocks, setBlocks] = useState([]);

  useEffect(() => {
    if (isOpen && student) {
      setBlocks(parseBlocks(student, mainHeaders, subHeaders));
    }
  }, [isOpen, student]);

  if (!isOpen || !student) return null;

  const parseBlocks = (studentRow, mainHdrs, subHdrs) => {
    const result = [];
    let current = null;

    for (let i = 8; i < mainHdrs.length; i++) {
      const main = String(mainHdrs[i] || "").trim();
      const sub = String(subHdrs[i] || "").trim().toLowerCase();

      if (main && sub.includes("internals")) {
        if (current) result.push(current);

        current = {
          subject: main,
          internals: studentRow[i] || "0",
          mid: "0",
          final: "0",
          total: "0"
        };
      } 
      else if (!main && current) {
        if (sub.includes("mid") && !sub.includes("final")) {
          current.mid = studentRow[i] || "0";
        } else if (sub.includes("final")) {
          current.final = studentRow[i] || "0";
        }
      }
    }

    if (current) result.push(current);

    result.forEach(b => {
      const i = parseFloat(b.internals) || 0;
      const m = parseFloat(b.mid) || 0;
      const f = parseFloat(b.final) || 0;
      b.total = (i + m + f).toFixed(2);
    });

    return result;
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <button className="close-btn" onClick={onClose}>✖</button>

        <h2>Subject-wise Breakdown</h2>

        <table className="details-table">
          <thead>
            <tr>
              <th>Subject</th>
              <th>Internals</th>
              <th>Mid</th>
              <th>Final</th>
              <th>Total</th>
            </tr>
          </thead>

          <tbody>
            {blocks.map((b, i) => (
              <tr key={i}>
                <td>{b.subject}</td>
                <td>{b.internals}</td>
                <td>{b.mid}</td>
                <td>{b.final}</td>
                <td><strong>{b.total}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentDetailsModal;
