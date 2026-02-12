import Header from "../components/common/Header/Header";
import Footer from "../components/common/Footer/Footer";
import LetsReadTogether from "../components/ReadingSection/LetsReadTogether/LetsReadTogether";
import StoryCorner from "../components/ReadingSection/StoryCorner/StoryCorner";
import SafeStories from "../components/ReadingSection/SafeStories/SafeStories";

const Reading = () => {
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