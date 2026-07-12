import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Hero from "../../components/courts/Hero";
import GuestBooking from "../../components/courts/GuestBooking";
import CourtDetails from "../../components/courts/CourtDetails";
import CourtRules from "../../components/courts/CourtRules";

function Courts () {
    const { hash } = useLocation();

    // React Router doesn't scroll to a #hash target on client-side
    // navigation the way a full page load does — the Home/Courts hero
    // "Book a Court" buttons rely on this to land on the actual grid.
    useEffect(() => {
        if (!hash) return;
        const el = document.querySelector(hash);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, [hash]);

    return (
        <>
          <Hero />
            <GuestBooking />
            <CourtDetails />
            <CourtRules />
        </>

    );
}

export default Courts;