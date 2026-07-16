// members.status/coaches.status (active/inactive/suspended) and users.status
// (active/pending/disabled) are separate enums for separate concerns —
// membership/employment standing vs. actual login access — but editing
// either one from any admin screen needs to be reflected in the other, or a
// "suspended" member/coach could still log in, and a "disabled" login would
// still show as a normal active row in its directory. These two small maps
// are the single place that translates between them.
const toLoginStatus = (profileStatus) => (profileStatus === 'active' ? 'active' : 'disabled');
const toProfileStatus = (loginStatus) => (loginStatus === 'active' ? 'active' : 'suspended');

module.exports = { toLoginStatus, toProfileStatus };
