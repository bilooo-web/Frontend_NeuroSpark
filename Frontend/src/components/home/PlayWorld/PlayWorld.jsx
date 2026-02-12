import { useEffect, useRef } from "react";
import "./PlayWorld.css";

import duckLeft_h from "../../../assets/duck-left.png";
import duckRight_h from "../../../assets/duck-right.png";
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
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("playworld-step-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.3,
        rootMargin: "0px 0px -50px 0px",
      }
    );

    const currentRefs = stepRefs.current;

    currentRefs.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    setTimeout(() => {
      if (duckLeftRef.current) duckLeftRef.current.classList.add("playworld-duck-float");
      if (duckRightRef.current) duckRightRef.current.classList.add("playworld-duck-float");
    }, 300);

    return () => {
      currentRefs.forEach((ref) => {
        if (ref) observer.unobserve(ref);
      });
    };
  }, []);

  return (
    <section className="playworld-container">
      <img 
        ref={duckLeftRef}
        src={duckLeft_h} 
        className="playworld-duck playworld-duck-left" 
        alt="Floating duck"
      />
      <img 
        ref={duckRightRef}
        src={duckRight_h} 
        className="playworld-duck playworld-duck-right" 
        alt="Floating duck"
      />

      <h2 className="playworld-heading">
        How NeuroSpark Works <br /> for Your Family
      </h2>

      <p className="playworld-description">
        NeuroSpark provides your child with the same routines and the same
        support, no matter where they are or who they're with.
      </p>

      <div className="playworld-steps-grid">
        {steps.map((step, index) => (
          <div 
            key={index} 
            ref={(el) => (stepRefs.current[index] = el)}
            className="playworld-step-item"
            style={{ animationDelay: `${index * 0.2}s` }}
          >
            <div className="playworld-step-circle-outer">
              <div className="playworld-step-circle-inner">
                <img src={step.icon} alt="" />
              </div>
            </div>

            <div className="playworld-step-card">
              <strong>{step.title}</strong>
              <p>{step.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}