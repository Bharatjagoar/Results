// improved transform - uses tableHeaders + filteredIndices (from handleFileUpload)
const transformDataForBackend = () => {
  // tableHeaders and filteredIndices are from state
  console.log("Using tableHeaders:", tableHeaders);
  console.log("Using filteredIndices:", filteredIndices);
  const transformed = fullRawData.map((row, rowIdx) => {
    // basic fields: try to find common ones in the raw columns by name in tableHeaders
    // build a map headerName => value for this row using filteredIndices
    const rowMap = {};
    tableHeaders.forEach((h, i) => {
      const originalIndex = filteredIndices[i];
      rowMap[h] = row[originalIndex] !== undefined ? row[originalIndex] : "";
    });

    // Expect header names like "Name", "Father Name", or custom - adapt as needed
    const student = {
      name: row[0] || rowMap["name"] || rowMap["Name"] || "",
      fatherName: row[1] || rowMap["fatherName"] || rowMap["Father Name"] || "",
      motherName: row[2] || rowMap["motherName"] || rowMap["Mother Name"] || "",
      examRollNo: row[3] || rowMap["examRollNo"] || rowMap["Exam Roll No"] || "",
      class: row[4] || rowMap["class"] || rowMap["Class"] || "",
      dob: excelDateToJS(row[5] || rowMap["dob"] || rowMap["DOB"] || ""),
      admissionNo: row[6] || rowMap["admissionNo"] || rowMap["Admission No"] || "",
      house: row[7] || rowMap["house"] || rowMap["House"] || "",
      subjects: {},
      overallGrade: rowMap["overallGrade"] || rowMap["Overall Grade"] || null,
      result: rowMap["result"] || null,
      grandTotal: null
    };

    // Build subjects from tableHeaders: headers contain names like "Hindi Total", or "Maths Total".
    // We will detect headers that end with "Total" and then look for related internals/mid/final
    // We'll attempt to find internals/mid/final columns by searching tableHeaders for words.
    const headerLower = tableHeaders.map(h => (h || "").toString().toLowerCase());

    // Example heuristics: if header is "hindi total" or "hindi total" -> subjectName = "hindi"
    headerLower.forEach((h, idx) => {
      if (!h) return;
      if (h.includes(" total")) {
        const orig = tableHeaders[idx];
        // get subject name by removing trailing " Total"
        const subjectName = orig.replace(/[\s]*[Tt]otal$/,'').trim();
        if (!subjectName) return;

        // find internals/mid/final columns for the same subject
        const maybeInternalsIndex = headerLower.findIndex(x => x.includes(subjectName.toLowerCase()) && (x.includes("internal") || x.includes("internals") || x.includes("(20)") || x.includes("internal (20)")));
        const maybeMidIndex = headerLower.findIndex(x => x.includes(subjectName.toLowerCase()) && (x.includes("mid") || x.includes("(30)")));
        const maybeFinalIndex = headerLower.findIndex(x => x.includes(subjectName.toLowerCase()) && (x.includes("final") || x.includes("(50)") || x.includes("end")));

        const totalVal = row[ filteredIndices[idx] ];
        const internalsVal = maybeInternalsIndex === -1 ? null : row[ filteredIndices[maybeInternalsIndex] ];
        const midVal = maybeMidIndex === -1 ? null : row[ filteredIndices[maybeMidIndex] ];
        const finalVal = maybeFinalIndex === -1 ? null : row[ filteredIndices[maybeFinalIndex] ];

        const internalsN = internalsVal === "" || internalsVal == null ? null : parseFloat(internalsVal) || 0;
        const midN = midVal === "" || midVal == null ? null : parseFloat(midVal) || 0;
        const finalN = finalVal === "" || finalVal == null ? null : parseFloat(finalVal) || 0;
        const totalN = totalVal === "" || totalVal == null ? null : parseFloat(totalVal) || 0;

        // store only if there's some data
        if (internalsN !== null || midN !== null || finalN !== null || totalN !== null) {
          student.subjects[subjectName] = {
            internals: internalsN,
            midTerm: midN,
            finalTerm: finalN,
            total: totalN,
            grade: null // if you have a grade column, must find and set similarly
          };
        }
      }
    });

    // try to get grand total (maybe last numeric column in filteredIndices)
    for (let k = filteredIndices.length - 1; k >= 0; k--) {
      const val = row[ filteredIndices[k] ];
      if (val !== null && val !== "" && !isNaN(parseFloat(val))) {
        student.grandTotal = parseFloat(val);
        break;
      }
    }

    return student;
  });

  return transformed;
};


export {transformDataForBackend};