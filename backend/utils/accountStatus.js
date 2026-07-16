// members.status (active/inactive/suspended), coaches.status (active/
// inactive/on-leave — NOT the same enum as members!) and users.status
// (active/pending/disabled) are three separate enums for separate concerns
// — membership/employment standing vs. actual login access — but editing
// any one of them from an admin screen needs to be reflected in the others,
// or a "suspended"/"on-leave" member/coach could still log in, and a
// "disabled" login would still show as a normal active row in its
// directory. These two small maps are the single place that translates
// between them.
const toLoginStatus = (profileStatus) => (profileStatus === 'active' ? 'active' : 'disabled');

const toProfileStatus = (loginStatus, role) => {
    if (loginStatus === 'active') return 'active';
    return role === 'coach' ? 'on-leave' : 'suspended';
};

module.exports = { toLoginStatus, toProfileStatus };
