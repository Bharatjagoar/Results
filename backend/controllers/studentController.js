const Student = require('../models/Student.js');

const bulkUploadStudents = async (req, res) => {
  try {
    const { classId, students } = req.body;

    console.log("Received first student:", students[0]);

    if (!students || !Array.isArray(students) || students.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No student data provided",
      });
    }

    // -------------------------------
    //  FORMAT STUDENTS PROPERLY
    // -------------------------------
    const formattedStudents = students.map((student) => {
      const formattedSubjects = {};

      // Convert subjects object → formatted plain object
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
                  : subjectData.grade,
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
        subjects: formattedSubjects, // ✅ Pure object (Mongoose converts to Map)
        overallGrade:
          student.overallGrade === "null" || student.overallGrade === ""
            ? null
            : student.overallGrade,
        result:
          student.result === "null" || student.result === ""
            ? null
            : student.result,
        grandTotal: Number(student.grandTotal),
      };
    });

    console.log(
      "Formatted subjects (first student):",
      formattedStudents[0]
    );

    // -------------------------------
    //  INSERT MANY
    // -------------------------------
    const result = await Student.insertMany(formattedStudents, {
      ordered: false,
      rawResult: true,
    });
    console.log("res :: ", result);

    console.log("=== FIRST VALIDATION ERROR ===");
    console.log(JSON.stringify(result.mongoose.validationErrors[0], null, 2));


    if (result.insertedCount === 0) {
      return res.status(400).json({
        success: false,
        message:
          "No students were uploaded. Possibly validation errors or duplicates.",
        attempted: students.length,
        inserted: 0,
      });
    }

    return res.status(201).json({
      success: true,
      message: `Successfully uploaded ${result.insertedCount} students`,
      inserted: result.insertedCount,
      attempted: students.length,
    });

  } catch (error) {
    console.error("Bulk upload error:", error);

    // -------------------------------
    //  PARTIAL SUCCESS HANDLING
    // -------------------------------
    if (error.writeErrors || error.insertedDocs) {
      return res.status(207).json({
        success: (error.insertedDocs || []).length > 0,
        message: `Partially uploaded: ${(error.insertedDocs || []).length
          } succeeded, ${error.writeErrors.length} failed`,
        inserted: (error.insertedDocs || []).length,
        failed: error.writeErrors.length,
        errors: error.writeErrors.map((e) => ({
          index: e.index,
          message: e.errmsg,
        })),
      });
    }

    // Duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Duplicate key error - student already exists",
        error: error.message,
      });
    }

    // Generic
    return res.status(500).json({
      success: false,
      message: "Error uploading students",
      error: error.message,
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
    console.log("erorr" )

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
    console.log("Update data:", updateData);

    const student = await Student.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).lean(); // ⭐ Returns plain JavaScript object

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Student updated successfully',
      data: student // Already a plain object, no conversion needed
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