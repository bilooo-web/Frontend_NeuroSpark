import { useEffect, useRef } from "react";
import "./PlayWorld.css";

import duckLeft from "../../../assets/duck-left.png";
import duckRight from "../../../assets/duck-right.png";
import style1 from "../../../assets/style-1.png";

const steps = [
  {
    title: "1) Set Up Routines",
    text: "Use the Parent App to customize daily routines that fit your child's needs.",
    icon: style1,
  },
  {
    title: "2) Step-by-Step Guidance",
    text: "Kids follow routines on their tablet, like brushing teeth or getting dressed, with clear, distraction-free instructions.",
    icon: style1,
  },
  {
    title: "3) Track Progress",
    text: "Monitor their progress, adjust goals, and reward successes directly from the app.",
    icon: style1,
  },
  {
    title: "4) Celebrate Milestones",
    text: "Watch your child gain confidence, build essential life skills, and thrive.",
    icon: style1,
  },
];

export default function PlayWorld() {
  const stepRefs = useRef([]);
  const duckLeftRef = useRef(null);
  const duckRightRef = useRef(null);

  useEffect(() => {
    // Create intersection observer for step items
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-in");
            // Unobserve after animation starts
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.3,
        rootMargin: "0px 0px -50px 0px",
      }
    );

    // Copy ref to local variable for cleanup function
    const currentRefs = stepRefs.current;

    // Observe step items
    currentRefs.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    // Duck animations on load
    setTimeout(() => {
      if (duckLeftRef.current) duckLeftRef.current.classList.add("duck-float");
      if (duckRightRef.current) duckRightRef.current.classList.add("duck-float");
    }, 300);

    // Cleanup
    return () => {
      currentRefs.forEach((ref) => {
        if (ref) observer.unobserve(ref);
      });
    };
  }, []);

  return (
    <section className="playworld">
      {/* Animated Ducks */}
      <img 
        ref={duckLeftRef}
        src={duckLeft} 
        className="duck duck-left" 
        alt="Floating duck"
      />
      <img 
        ref={duckRightRef}
        src={duckRight} 
        className="duck duck-right" 
        alt="Floating duck"
      />

      {/* Text */}
      <h2 className="playworld-title">
        How NeuroSpark Works <br /> for Your Family
      </h2>

      <p className="playworld-subtitle">
        NeuroSpark provides your child with the same routines and the same
        support, no matter where they are or who they're with.
      </p>

      {/* Animated Steps */}
      <div className="steps-container">
        {steps.map((step, index) => (
          <div 
            key={index} 
            ref={(el) => (stepRefs.current[index] = el)}
            className="step-item"
            style={{ animationDelay: `${index * 0.2}s` }}
          >
            <div className="step-circle">
              <div className="step-circle-inner">
                <img src={step.icon} alt="" />
              </div>
            </div>

            <div className="step-card">
              <strong>{step.title}</strong>
              <p>{step.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}