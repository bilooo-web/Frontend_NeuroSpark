import Header from "../components/common/Header/Header";
import Footer from "../components/common/Footer/Footer";
import ChallengesHero from "../components/challenges/ChallengesHero/ChallengesHero";
import FocusChallenges from "../components/challenges/FocusChallenges/FocusChallenges";

const Challenges = () => {
  return (
    <>
      <Header />
      <ChallengesHero />
      <FocusChallenges/>
      <Footer />
    </>
  );
};

export default Challenges;
