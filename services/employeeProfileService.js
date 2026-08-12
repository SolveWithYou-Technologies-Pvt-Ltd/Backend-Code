const hasOwn = (object, key) => {
  return Object.prototype.hasOwnProperty.call(
    object || {},
    key
  );
};

const cleanText = (value) => {
  return String(value || "").trim();
};

const cleanDate = (value) => {
  return value ? value : null;
};

const cleanExperience = (value) => {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const numberValue = Number(value);

  return Number.isFinite(numberValue)
    ? numberValue
    : null;
};

const cleanAddress = (
  address = {}
) => {
  return {
    line1: cleanText(address.line1),
    line2: cleanText(address.line2),
    city: cleanText(address.city),
    state: cleanText(address.state),
    pincode: cleanText(
      address.pincode
    ),
    country:
      cleanText(address.country) ||
      "India",
  };
};

const cleanEmergencyContact = (
  emergencyContact = {}
) => {
  return {
    name: cleanText(
      emergencyContact.name
    ),

    relation: cleanText(
      emergencyContact.relation
    ),

    phone: cleanText(
      emergencyContact.phone
    ),
  };
};

const employeeFieldNormalizers = {
  alternatePhone: cleanText,
  dateOfBirth: cleanDate,
  gender: cleanText,
  bloodGroup: cleanText,
  department: cleanText,
  designation: cleanText,
  joiningDate: cleanDate,
  employmentType: cleanText,
  workLocation: cleanText,
  highestQualification: cleanText,
  totalExperienceYears:
    cleanExperience,
};

const applyEmployeeProfileDetails = (
  user,
  payload = {},
  options = {}
) => {
  const partial =
    options.partial !== false;

  Object.entries(
    employeeFieldNormalizers
  ).forEach(
    ([fieldName, normalize]) => {
      if (
        partial &&
        !hasOwn(payload, fieldName)
      ) {
        return;
      }

      user[fieldName] = normalize(
        payload[fieldName]
      );
    }
  );

  if (
    !partial ||
    hasOwn(payload, "address")
  ) {
    user.address = cleanAddress(
      payload.address
    );
  }

  if (
    !partial ||
    hasOwn(
      payload,
      "emergencyContact"
    )
  ) {
    user.emergencyContact =
      cleanEmergencyContact(
        payload.emergencyContact
      );
  }

  return user;
};

module.exports = {
  applyEmployeeProfileDetails,
};
