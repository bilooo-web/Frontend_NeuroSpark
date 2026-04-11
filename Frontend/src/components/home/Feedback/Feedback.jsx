import { useState, useEffect } from 'react';
import './Feedback.css';

import cloud    from '../../../assets/cloud-blue.png';
import dinoBlue  from '../../../assets/dino-blue.png';
import dinoPink  from '../../../assets/dino-pink.png';
import dinoGreen from '../../../assets/dino-green.png';

const DINO_IMAGES  = [dinoBlue, dinoPink, dinoGreen];
const DINO_CLASSES = ['feedback-item-blue', 'feedback-item-pink', 'feedback-item-green'];

// Shown when no featured feedback exists yet in the DB
const FALLBACK = [
  {
    name: 'Fatima Al-Hassan',
    role: 'Mother of Adam (9 years old)',
    text: 'I used to struggle to keep my son focused for even ten minutes. With NeuroSpark, he actually asks to do his challenges every day!',
  },
  {
    name: 'Omar Khaled',
    role: 'Father of Lina (10 years old)',
    text: "My daughter used to get frustrated easily. Now she's more confident and excited to learn. I can see real progress in her focus.",
  },
  {
    name: 'Rania Mansour',
    role: 'Mother of Youssef (8 years old)',
    text: 'Finally something that feels fun and educational at the same time! NeuroSpark turned learning into a game my child loves.',
  },
];

function Feedback() {
  const [cards, setCards]   = useState(FALLBACK);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
        const token    = localStorage.getItem('token');

        // Use admin endpoint with token if available, otherwise skip
        if (!token) { setLoading(false); return; }

        const res = await fetch(
          `${API_BASE}/admin/feedback/all?limit=20`,
          { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } }
        );

        if (!res.ok) { setLoading(false); return; }

        const json = await res.json();
        const featured = (json.data || []).filter(f => f.is_featured);

        if (featured.length > 0) {
          setCards(featured.slice(0, 6).map(fb => ({
            name: fb.guardian?.user?.full_name || fb.guardian?.user?.name || 'NeuroSpark User',
            role: '',   // not stored — could add later
            text: fb.text || '',
          })));
        }
        // if none featured → keep FALLBACK
      } catch {
        // network error → keep FALLBACK silently
      } finally {
        setLoading(false);
      }
    };

    fetchFeatured();
  }, []);

  return (
    <section className="feedback-section">

      <div className="feedback-wave feedback-wave-top">
        <svg className="feedback-wave-svg feedback-wave-green" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,40 C150,10 350,70 600,40 S850,10 1200,40 L1200,120 L0,120 Z" fill="#8BE3D8">
            <animate attributeName="d" dur="10s" repeatCount="indefinite"
              values="M0,40 C150,10 350,70 600,40 S850,10 1200,40 L1200,120 L0,120 Z;
                      M0,40 C150,70 350,10 600,40 S850,70 1200,40 L1200,120 L0,120 Z;
                      M0,40 C150,10 350,70 600,40 S850,10 1200,40 L1200,120 L0,120 Z"/>
          </path>
        </svg>
        <svg className="feedback-wave-svg feedback-wave-light" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,60 C200,30 400,90 600,60 S800,30 1200,60 L1200,120 L0,120 Z" fill="#8BE3D8">
            <animate attributeName="d" dur="8s" repeatCount="indefinite"
              values="M0,60 C200,30 400,90 600,60 S800,30 1200,60 L1200,120 L0,120 Z;
                      M0,60 C200,90 400,30 600,60 S800,90 1200,60 L1200,120 L0,120 Z;
                      M0,60 C200,30 400,90 600,60 S800,30 1200,60 L1200,120 L0,120 Z"/>
          </path>
        </svg>
      </div>

      <img src={cloud} className="feedback-cloud feedback-cloud-tl" alt="" />
      <img src={cloud} className="feedback-cloud feedback-cloud-br" alt="" />

      <div className="feedback-content">
        <h2 className="feedback-title">We get a lot of fan mail</h2>

        {loading ? (
          <div style={{ textAlign:'center', padding:'40px', color:'#6b7280' }}>
            Loading...
          </div>
        ) : (
          <div className="feedback-grid">
            {cards.map((card, i) => (
              <div key={i} className={`feedback-item ${DINO_CLASSES[i % 3]}`}>
                <img src={DINO_IMAGES[i % 3]} alt="dinosaur" />
                <h4>
                  {card.name}
                  {card.role && <><br />{card.role}</>}
                </h4>
                <p>{card.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>

    </section>
  );
}

export default Feedback;