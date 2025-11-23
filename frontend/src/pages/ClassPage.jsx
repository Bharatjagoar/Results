import React from "react";
import "./ClassPage.css";
import { useNavigate, useParams } from "react-router-dom";

const ClassPage = () => {
  const navigate = useNavigate();
  const { classId } = useParams(); // "9" or "10"

  const options = [
    { title: "Upload Marks Manually", path: `/class/${classId}/manual` },
    { title: "Upload Marks via Excel", path: `/class/${classId}/excel` },
    { title: "Upload Students Data (Excel)", path: `/class/${classId}/students` },
  ];

  return (
    <div className="class-container">
      <h1 className="class-title">Class {classId}</h1>

      <div className="class-cards">
        {options.map((opt, index) => (
          <div
            key={index}
            className="class-card"
            onClick={() => navigate(opt.path)}
          >
            {opt.title}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClassPage;
