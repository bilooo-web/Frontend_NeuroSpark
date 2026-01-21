import Header from "../components/common/Header/Header";
import Hero from "../components/home/Hero/Hero";
import WhyChoose from "../components/home/WhyChoose/WhyChoose";
import Knowledge from "../components/home/Knowledge/Knowledge";
import PlayWorld from "../components/home/PlayWorld/PlayWorld";
import Superpowers from "../components/home/Superpowers/Superpowers";
import Universe from "../components/home/Universe/Universe";
import Features from "../components/home/Features/Features";
import Feedback from "../components/home/Feedback/Feedback";
import Footer from "../components/common/Footer/Footer";

const Home = () => {
  return (
    <>
      <Header />
      <Hero />
      <Features />
      <Universe />
      <Knowledge />
      <Superpowers />
      <WhyChoose />
      <PlayWorld />
      <Feedback />
      <Footer />
    </>
  );
};

export default Home;
