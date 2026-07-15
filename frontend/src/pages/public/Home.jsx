import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Hero from "../../components/home/Hero";
import About from "../../components/home/About";
import Carousel from "../../components/home/carousel";
import Coaches from "../../components/home/Coaches";
import Contact from "../../components/home/Contact";


function Home() {
    const { hash } = useLocation();

    // Same fix as the Courts page: React Router doesn't scroll to a #hash
    // target on client-side navigation, which the Membership page's
    // "Contact the Admin" links (to /#contact) rely on to land on the form.
    useEffect(() => {
        if (!hash) return;
        const el = document.querySelector(hash);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, [hash]);

    return (
        <>
            <Hero />
            <About />
            <Carousel />
            <Coaches />
            <Contact />
        </>

    );
}

export default Home;