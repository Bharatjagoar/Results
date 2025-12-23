import { useState } from "react";
import TeacherSearch from "../components/TeacherSearch";
import ActivityList from "../components/ActivityList";
// import {Nav}
import Navbar from "../components/Navbar";
import "./AdminDashboard.css"
const AdminDashboard = () => {
  const [selectedTeacher, setSelectedTeacher] = useState(null);

  return (
    <>
      <Navbar />
      <div className="admin-container">
        <div className="admin-inner">
          <h2>Admin Dashboard</h2>
          <TeacherSearch onSelect={setSelectedTeacher} />
          <ActivityList teacher={selectedTeacher} />
        </div>
      </div>
    </>

  );
};

export default AdminDashboard;
