const express = require('express');
const router = express.Router();

const {
  bulkUploadStudents,
  getStudentsByClass,
  getStudentByRollNo,
  updateStudent,
  deleteStudent,
  getAllClasses
} = require('../controllers/studentController');

router.post('/bulk', bulkUploadStudents);
router.get('/classes/list', getAllClasses);
router.get('/class/:classId', getStudentsByClass);
router.get('/roll/:rollNo', getStudentByRollNo);
router.put('/:id', updateStudent);
router.delete('/:id', deleteStudent);

module.exports = router;