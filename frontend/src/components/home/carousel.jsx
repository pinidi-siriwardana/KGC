import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Trophy, Users, Calendar, MapPin } from 'lucide-react';
import clayCourtImg from "../../assets/images/court.jpg";
import nightPlayImg from "../../assets/images/night-tennis.jpg";
import coachingImg from "../../assets/images/coaching.jpg";
import clubhouseImg from "../../assets/images/clubhouse-view.jpg";

const ImageCarousel = () => {
  const slides = [
    {
      url: clayCourtImg,
      title: "Championship Red Clay",
      subtitle: "Traditional clay surfaces maintained to international ITF standards.",
      icon: <Trophy size={16} className="text-amber" />
    },
    {
      url: nightPlayImg,
      title: "Floodlit Night Play",
      subtitle: "Professional-grade stadium lighting for evening matches in Kandy.",
      icon: <Calendar size={16} className="text-amber" />
    },
    {
      url: coachingImg,
      title: "Elite Coaching",
      subtitle: "Nurturing local talent and competitive spirits since 1878.",
      icon: <Users size={16} className="text-amber" />
    },
    {
      url: clubhouseImg,
      title: "Members' Veranda",
      subtitle: "Historic views of the lush garden landscape and clubhouse legacy.",
      icon: <MapPin size={16} className="text-amber" />
    }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    setProgress(0);
  }, [slides.length]);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
    setProgress(0);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          nextSlide();
          return 0;
        }
        return prev + 1;
      });
    }, 50); 
    return () => clearInterval(interval);
  }, [nextSlide, currentIndex]);

  return (
    <section className="py-16 md:py-24 bg-alabaster">
      {/* Reduced max-w to 6xl to make the overall gallery feel more "framed" and less overwhelming on wide screens */}
      <div className="max-w-6xl mx-auto px-6 lg:px-10">
        
        {/* Symmetrical Header */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-10 gap-6">
          <div className="max-w-md">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald/10 text-emerald text-[9px] font-black uppercase tracking-registry mb-4">
               <span className="w-1.5 h-1.5 bg-emerald rounded-full animate-pulse" />
               Facility Gallery
            </div>
            <h2 className="text-obsidian text-5xl md:text-5xl lg:text-6xl leading-tight">
              The <span className="text-emerald italic">Grounds</span>
            </h2>
          </div>
          
          <div className="flex items-center gap-3">
             <button 
                onClick={prevSlide} 
                className="p-4 rounded-full border border-obsidian/10 hover:bg-obsidian hover:text-white transition-all active:scale-95"
              >
                <ChevronLeft size={20} />
             </button>
             <button 
                onClick={nextSlide} 
                className="p-4 rounded-full border border-obsidian/10 hover:bg-obsidian hover:text-white transition-all active:scale-95"
              >
                <ChevronRight size={20} />
             </button>
          </div>
        </div>

        {/* Main Frame - Height adjusted to keep images sharp and visible */}
        <div className="relative h-[450px] md:h-[550px] lg:h-[600px] w-full overflow-hidden rounded-club shadow-2xl bg-obsidian group">
          
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                index === currentIndex ? "opacity-100 scale-100 z-10" : "opacity-0 scale-105 z-0"
              }`}
            >
              <img
                src={slide.url}
                alt={slide.title}
                className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-105 brightness-[0.75]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-obsidian/80 via-transparent to-transparent" />
            </div>
          ))}

          {/* Symmetrical Floating Caption - Reduced width to show more image */}
          <div className="absolute bottom-8 left-8 right-8 md:right-auto z-30">
            <div className="
              backdrop-blur-md bg-obsidian/40 border border-white/10 
              p-6 md:p-8 rounded-3xl 
              w-full md:w-[340px]     /* Smaller width (340px) so the image center is clear */
              min-w-[260px] 
              shadow-2xl relative overflow-hidden
            ">
              <div 
                className="absolute bottom-0 left-0 h-1 bg-amber" 
                style={{ width: `${progress}%` }} 
              />

              <div className="flex items-center gap-3 mb-3">
                <span className="text-amber font-black text-[9px] uppercase tracking-registry">
                    KGC Grounds
                </span>
              </div>

              <h3 className="text-white text-xl md:text-2xl font-serif italic mb-2 leading-snug">
                {slides[currentIndex].title}
              </h3>
              
              <p className="text-white/60 text-[11px] md:text-xs leading-relaxed font-light">
                {slides[currentIndex].subtitle}
              </p>
            </div>
          </div>

          {/* Small Top Info Badge */}
          <div className="absolute top-8 right-8 z-30 hidden sm:block">
            <div className="bg-white/5 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10">
              <span className="text-white/70 font-black text-[8px] tracking-registry uppercase">
                Premium Clay • Sri Lanka
              </span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default ImageCarousel;