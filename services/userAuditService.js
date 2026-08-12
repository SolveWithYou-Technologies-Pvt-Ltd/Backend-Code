const ACTOR_SELECT = "fullName email role";

const auditPopulateOptions = [
  { path: "createdBy", select: ACTOR_SELECT },
  { path: "updatedBy", select: ACTOR_SELECT },
  { path: "lastActivity.by", select: ACTOR_SELECT}
];

const setLastActivity = ( user, action, actorId, activityTime = new Date() ) => {
  user.updatedBy = actorId;
  user.lastActivity = {
    action,
    by: actorId,
    at: activityTime,
  };
};

const setCreatedAudit = ( user, actorId) => {
  const activityTime = new Date();
  user.createdBy = actorId;
  user.updatedBy = actorId;
  user.lastActivity = {
    action: "created",
    by: actorId,
    at: activityTime,
  };
};

const populateAuditFields = (query) => {
  return query.populate(
    auditPopulateOptions
  );
};

module.exports = { auditPopulateOptions, populateAuditFields, setCreatedAudit, setLastActivity };
