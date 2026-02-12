import React from "react";
import "./LetsReadTogether.css";
import billboard from "../../../assets/billboard.png";
import twoDucksReading from "../../../assets/two-ducks-reading.png";
import stamp from "../../../assets/stamp 2.png";
import pinkTicket from "../../../assets/pink-ticket.png";
import shine from "../../../assets/shine.png";
import girlDuck from "../../../assets/girl-duck.png";

const LetsReadTogether = () => {
    return (
    <div className="lets-read-together">
        <div className="content-container">
        <div className="billboard-section">
            <img src={billboard} alt="Billboard" className="billboard" />
        </div>

        <div className="ducks-reading-section">
            <img src={twoDucksReading} alt="Ducks reading books" className="ducks-reading" />
        </div>

        <div className="shine-section">
            <img src={shine} alt="Shine" className="shine-effect" />
        </div>

        <div className="stamp-section">
            <img src={stamp} alt="Stamp background" className="stamp-bg" />
            <img src={pinkTicket} alt="Pink ticket" className="pink-ticket" />
            <div className="stamp-content">
                <h2 className="main-heading">Let's Read Together</h2>
                <p className="description">
                This is a place where stories are meant to be enjoyed, not rushed. You’ll meet friendly characters, explore feelings, and discover new ideas along the way. Pick a story, get comfortable, and let the words guide you at your own pace.
                </p>
            </div>
        </div>

        <div className="girl-duck-section">
            <img src={girlDuck} alt="Girl duck with books" className="girl-duck" />
        </div>
        </div>

        <div className="wave-together-container">
        <svg viewBox="0 0 1440 120" preserveAspectRatio="none" className="wave-together">
            <path
            d="M0,64 C240,90 480,90 720,64 C960,38 1200,38 1440,64 L1440,120 L0,120 Z"
            fill="#9AD0EE"
            />
            <path
            d="M0,80 C240,100 480,100 720,80 C960,60 1200,60 1440,80 L1440,120 L0,120 Z"
            fill="#77BEF0"
            />
        </svg>
        </div>
    </div>
    );
};

export default LetsReadTogether;