import Hero from "../../components/home/Hero";
import About from "../../components/home/About";
import Carousel from "../../components/home/carousel";
import Coaches from "../../components/home/Coaches";
import Contact from "../../components/home/Contact";


function Home() {
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