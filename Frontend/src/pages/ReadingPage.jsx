import { useEffect } from "react"; 
import Header from "../components/common/Header/Header";
import LetsReadTogether from "../components/ReadingSection/LetsReadTogether/LetsReadTogether";
import StoryCorner from "../components/ReadingSection/StoryCorner/StoryCorner";
import SafeStories from "../components/ReadingSection/SafeStories/SafeStories";
import Footer from "../components/common/Footer/Footer";

const Reading = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <Header />
      <LetsReadTogether />
      <StoryCorner />
      <SafeStories />
      <Footer />
    </>
  );
};

export default Reading;