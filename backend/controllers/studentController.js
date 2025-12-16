const Student = require("../models/Student.js");
const ActivityLogService = require("../services/activityLogService.js");

const bulkUploadStudents = async (req, res) => {
  try {
    const { classId, students } = req.body;

    if (!students || !Array.isArray(students) || students.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No student data provided"
      });
    }

    // -------------------------------
    // FORMAT STUDENTS
    // -------------------------------
    const formattedStudents = students.map((student) => {
      const formattedSubjects = {};

      if (student.subjects && typeof student.subjects === "object") {
        Object.entries(student.subjects).forEach(
          ([subjectName, subjectData]) => {
            formattedSubjects[subjectName] = {
              internals: Number(subjectData.internals),
              midTerm: Number(subjectData.midTerm),
              finalTerm: Number(subjectData.finalTerm),
              total: Number(subjectData.total),
              grade:
                subjectData.grade === "null" ||
                  subjectData.grade === "" ||
                  subjectData.grade === null
                  ? null
                  : subjectData.grade
            };
          }
        );
      }

      return {
        name: student.name,
        fatherName: student.fatherName,
        motherName: student.motherName,
        examRollNo: Number(student.examRollNo),
        class: student.class,
        dob: student.dob ? String(student.dob) : "",
        admissionNo: Number(student.admissionNo),
        house: student.house,
        subjects: formattedSubjects,
        overallGrade:
          student.overallGrade === "null" || student.overallGrade === ""
            ? null
            : student.overallGrade,
        result:
          student.result === "null" || student.result === ""
            ? null
            : student.result,
        grandTotal: Number(student.grandTotal)
      };
    });

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: user not found"
      });
    }


    // -------------------------------
    // INSERT
    // -------------------------------
    const result = await Student.insertMany(formattedStudents, {
      ordered: false
    });

    // -------------------------------
    // ACTIVITY LOG (ONLY ONCE)
    // -------------------------------
    console.log(formattedStudents[0]?.class);
    await ActivityLogService.logBulkUpload({
      teacherId: req.user.id,
      classId,
      count: result.length
    });

    return res.status(201).json({
      success: true,
      message: `Successfully uploaded ${result.length} students`,
      inserted: result.length
    });

  } catch (error) {
    console.error("Bulk upload error:", error);

    return res.status(500).json({
      success: false,
      message: "Error uploading students",
      error: error.message
    });
  }
};


const getStudentsByClass = async (req, res) => {
  console.log("Fetching students for class:", req.params.classId);
  try {
    const { classId } = req.params;

    const students = await Student.find({ class: classId })
      .sort({ examRollNo: 1 });

    console.log(`Found ${students.length} students for class ${classId}`);

    // ⭐ Fix: subjects is already a plain object, no need to convert
    const formattedStudents = students.map(student => {
      const studentObj = student.toObject();

      // If subjects is a Map, convert it
      if (studentObj.subjects instanceof Map) {
        studentObj.subjects = Object.fromEntries(studentObj.subjects);
      }
      // Otherwise, it's already an object - leave it as is

      return studentObj;
    });
    console.log("erorr")

    return res.status(200).json({
      success: true,
      count: students.length,
      data: formattedStudents
    });

  } catch (error) {
    console.error("Error fetching students:", error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching students',
      error: error.message
    });
  }
};

const getStudentByRollNo = async (req, res) => {
  try {
    const { rollNo } = req.params;

    const student = await Student.findOne({ examRollNo: rollNo });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const studentObj = student.toObject();
    studentObj.subjects = Object.fromEntries(studentObj.subjects);

    res.status(200).json({
      success: true,
      data: studentObj
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching student',
      error: error.message
    });
  }
};


const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    console.log("Updating student:", id);

    // ⭐ Fetch old student data BEFORE update
    const oldStudent = await Student.findById(id).lean();

    if (!oldStudent) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }


    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    // Perform update
    const student = await Student.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).lean();

    console.log(id)
    // ⭐ Log the activity
    await ActivityLogService.logMarksUpdate({
      teacherId: req.user.id,
      student
    });


    res.status(200).json({
      success: true,
      message: 'Student updated successfully',
      data: student
    });

  } catch (error) {
    console.error("Error updating student:", error);
    res.status(500).json({
      success: false,
      message: 'Error updating student',
      error: error.message
    });
  }
};

const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await Student.findByIdAndDelete(id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Student deleted successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting student',
      error: error.message
    });
  }
};

const getAllClasses = async (req, res) => {
  try {
    const classes = await Student.distinct('class');

    res.status(200).json({
      success: true,
      count: classes.length,
      data: classes
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching classes',
      error: error.message
    });
  }
};

module.exports = {
  bulkUploadStudents,
  getStudentsByClass,
  getStudentByRollNo,
  updateStudent,
  deleteStudent,
  getAllClasses
};