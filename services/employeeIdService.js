const AdminUser = require("../models/AdminUser");

const EmployeeIdCounter = require("../models/EmployeeIdCounter");

const EMPLOYEE_ID_PREFIX = "EMP";

const formatEmployeeId = ( year, sequence) => {
  return [
    EMPLOYEE_ID_PREFIX,
    year,
    String(sequence).padStart(3,"0"),
  ].join("/");
};

const generateEmployeeId = async () => {
  const year =new Date().getFullYear();
  const counterId =`employee-id-${year}`;
  for (let attempt = 0;attempt < 10000;attempt += 1) {
    const counter = await EmployeeIdCounter.findByIdAndUpdate(
        counterId,
        { $inc: { sequence: 1}, $setOnInsert: { year} },
        { new: true, upsert: true, setDefaultsOnInsert: true}
      );
    const employeeCode = formatEmployeeId(year,counter.sequence);
    
    const alreadyExists =await AdminUser.exists({ employeeCode });
    if (!alreadyExists) {
      return employeeCode;
    }
  }
  throw new Error("Unable to generate employee ID");
};

module.exports = {formatEmployeeId, generateEmployeeId };
