import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./components/HomePage.jsx";
import SecondaryWing from "./pages/SecondaryWing.jsx";
import ClassPage from "./pages/ClassPage.jsx";
import ExcelUploadPage from "./pages/ExcelUploadPage.jsx"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/class/:classId" element={<ClassPage />} />

        {/* Example future pages */}
        <Route path="/primary" element={<div>Primary Wing</div>} />
        <Route path="/middle" element={<div>Middle Wing</div>} />
        <Route path="/secondary" element={<SecondaryWing/>} />
        <Route path="/senior-secondary" element={<div>Senior Secondary Wing</div>} />
        <Route path="/class/:classId/excel" element={<ExcelUploadPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
