import MembershipBenefits from "../../components/membership/Benefits";
import MembershipFAQ from "../../components/membership/FAQsection";
import Hero from "../../components/membership/Hero";
import MembershipPlans from "../../components/membership/MembershipPlan";


function Membership() {
    return (
        <>
            <Hero />
            <MembershipPlans />
            <MembershipBenefits />
            <MembershipFAQ />
        </>
    );
}

export default Membership;