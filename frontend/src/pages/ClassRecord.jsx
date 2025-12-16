import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar"
import StudentEditModal from "../components/StudentEditModal.jsx";
import { toast } from "react-toastify";
import "./ClassRecordsPage.css";

const ClassRecordsPage = () => {
  const { classId } = useParams();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  const [section, setSection] = useState("");
  const [hasSelectedSection, setHasSelectedSection] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // =========================
  // FETCH STUDENTS
  // =========================
  const fetchStudents = async (fullClassName) => {
    try {
      setLoading(true);

      const encodedClass = encodeURIComponent(fullClassName);

      const res = await axios.get(
        `http://localhost:5000/api/students/class/${encodedClass}`
      );

      setStudents(res.data.data);
    } catch (err) {
      toast.error("Failed to fetch students");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // EDIT HANDLERS
  // =========================
  const openEditModal = (student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedStudent(null);
  };

  const handleSave = async (updatedStudent) => {
    try {
      const payload = {
        subjects: updatedStudent.subjects,
        grandTotal: updatedStudent.grandTotal,
        result: updatedStudent.result,
        overallGrade: updatedStudent.overallGrade,
      };

      const token = localStorage.getItem("authToken");

      await axios.put(
        `http://localhost:5000/api/students/${updatedStudent._id}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );


      toast.success("Student updated successfully");
      closeModal();

      const fullClassName = `${classId} ${section}`;
      fetchStudents(fullClassName);
    } catch (err) {
      console.log("err", err);
      toast.error("Update failed");
    }
  };

  // =========================
  // SECTION SELECTION UI
  // =========================
  if (!hasSelectedSection) {
    return (
      <>
        <Navbar />
        <div className="records-container empty-state">
          <h1 className="records-title">
            Class {classId} — Select Section
          </h1>

          <div className="empty-card">
            <h2>Select Section</h2>
            <p>Please choose a section to load student records.</p>

            <select
              className="section-dropdown"
              value={section}
              onChange={(e) => setSection(e.target.value)}
            >
              <option value="">-- Select Section --</option>
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
              <option value="D">Section D</option>
            </select>

            <button
              className="primary-btn"
              disabled={!section}
              onClick={() => {
                const fullClassName = `${classId} ${section.toUpperCase()}`;
                setHasSelectedSection(true);
                fetchStudents(fullClassName);
              }}
            >
              Load Records
            </button>
          </div>
        </div>
      </>
    );
  }

  // =========================
  // LOADING STATE
  // =========================
  if (loading) {
    return (
      <>
        <Navbar />
        <div className="records-container">Loading...</div>
      </>
    );
  }

  // =========================
  // EMPTY DATA STATE
  // =========================
  if (!loading && students.length === 0) {
    return (
      <>
        <Navbar />
        <div className="records-container empty-state">
          <h1 className="records-title">
            Class {classId} {section} — Student Records
          </h1>

          <div className="empty-card">
            <h2>No student data found</h2>
            <p>
              No students or marks have been uploaded for this class section yet.
            </p>

            <button
              className="primary-btn"
              onClick={() =>
                (window.location.href = `/class/${classId}/excel`)
              }
            >
              Upload Marks via Excel
            </button>
          </div>
        </div>
      </>
    );
  }

  // =========================
  // MAIN TABLE UI
  // =========================
  return (
    <>
      <Navbar />
      <div className="records-container">
        <h1 className="records-title">
          Class {classId} {section} — Student Records
        </h1>

        <div className="records-table-wrapper">
          <table className="records-table">
            <thead>
              <tr>
                <th>Roll No</th>
                <th>Name</th>
                <th>Father's Name</th>
                <th>Grand Total</th>
                <th>Result</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {students.map((student) => (
                <tr key={student._id}>
                  <td>{student.examRollNo}</td>
                  <td>{student.name}</td>
                  <td>{student.fatherName}</td>
                  <td className="grand-total-cell">
                    <strong>{student.grandTotal}</strong>
                  </td>
                  <td>
                    <span className={`result-badge ${student.result?.toLowerCase()}`}>
                      {student.result || "N/A"}
                    </span>
                  </td>
                  <td>
                    <button
                      className="view-edit-btn"
                      onClick={() => openEditModal(student)}
                    >
                      View/Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      <StudentEditModal
        isOpen={isModalOpen}
        onClose={closeModal}
        student={selectedStudent}
        onSave={handleSave}
      />
    </>
  );
};

export default ClassRecordsPage;