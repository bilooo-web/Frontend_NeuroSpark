import './WhyChoose.css';

import noDistraction from '../../../assets/no-distraction.png';
import therapist from '../../../assets/therapist.png';
import schedule from '../../../assets/schedule.png';
import affordable from '../../../assets/affordable.png';

const features = [
  {
    icon: noDistraction,
    title: 'Distraction Free',
    text: 'No ads, no web browser, no YouTube.'
  },
  {
    icon: therapist,
    title: 'Therapist Approved Apps',
    text: 'Tools to build essential life skills.'
  },
  {
    icon: schedule,
    title: 'Easy Scheduling',
    text: 'Custom schedules reduces stress for parents.'
  },
  {
    icon: affordable,
    title: 'Completely Free',
    text: 'No subscriptions, no hidden fees accessible to everyone.'
  }
];

function WhyChoose() {
  return (
    <section className="why-choose">

      {/* 🔼 TOP WAVES */}
      <div className="Why-features-wave wave-top">
        <svg className="wave-svg green-wave" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path
            d="M0,40 C150,10 350,70 600,40 S850,10 1200,40 L1200,120 L0,120 Z"
            fill="#2d3066"
          >
            <animate
              attributeName="d"
              dur="10s"
              repeatCount="indefinite"
              values="
                M0,40 C150,10 350,70 600,40 S850,10 1200,40 L1200,120 L0,120 Z;
                M0,40 C150,70 350,10 600,40 S850,70 1200,40 L1200,120 L0,120 Z;
                M0,40 C150,10 350,70 600,40 S850,10 1200,40 L1200,120 L0,120 Z
              "
            />
          </path>
        </svg>

        <svg className="wave-svg white-wave" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path
            d="M0,60 C200,30 400,90 600,60 S800,30 1200,60 L1200,120 L0,120 Z"
            fill="#141743ff"
          >
            <animate
              attributeName="d"
              dur="8s"
              repeatCount="indefinite"
              values="
                M0,60 C200,30 400,90 600,60 S800,30 1200,60 L1200,120 L0,120 Z;
                M0,60 C200,90 400,30 600,60 S800,90 1200,60 L1200,120 L0,120 Z;
                M0,60 C200,30 400,90 600,60 S800,30 1200,60 L1200,120 L0,120 Z
              "
            />
          </path>
        </svg>
      </div>

      {/* ✅ CONTENT */}
      <div className="why-container">

        <h2>Why Choose NeuroSpark?</h2>

        <p className="why-desc">
          We know mornings, bedtimes, and daily routines can feel overwhelming.
          Our <strong>Daily Skills System</strong> teaches your kid essential
          life skills with tools designed just for them, all while making your
          life a little easier.
        </p>

        <div className="why-cards">
          {features.map((item, index) => (
            <div className="why-card" key={index}>
              <div className="why-icon">
                <img src={item.icon} alt={item.title} />
              </div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </div>
          ))}
        </div>

        <button className="why-btn">
          Learn More About the Daily Skills System
        </button>

      </div>

      {/* 🔽 BOTTOM WAVES - FIXED */}
      <div className="Why-features-wave-b wave-bottom">
        <svg className="wave-svg green-wave" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path
            d="M0,40 C150,10 350,70 600,40 S850,10 1200,40 L1200,120 L0,120 Z"
            fill="#71D0B9"
          >
            <animate
              attributeName="d"
              dur="10s"
              repeatCount="indefinite"
              values="
                M0,40 C150,10 350,70 600,40 S850,10 1200,40 L1200,120 L0,120 Z;
                M0,40 C150,70 350,10 600,40 S850,70 1200,40 L1200,120 L0,120 Z;
                M0,40 C150,10 350,70 600,40 S850,10 1200,40 L1200,120 L0,120 Z
              "
            />
          </path>
        </svg>

        <svg className="wave-svg white-wave" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path
            d="M0,60 C200,30 400,90 600,60 S800,30 1200,60 L1200,120 L0,120 Z"
            fill="#8BE3D8"
          >
            <animate
              attributeName="d"
              dur="8s"
              repeatCount="indefinite"
              values="
                M0,60 C200,30 400,90 600,60 S800,30 1200,60 L1200,120 L0,120 Z;
                M0,60 C200,90 400,30 600,60 S800,90 1200,60 L1200,120 L0,120 Z;
                M0,60 C200,30 400,90 600,60 S800,30 1200,60 L1200,120 L0,120 Z
              "
            />
          </path>
        </svg>
      </div>

    </section>
  );
}

export default WhyChoose;