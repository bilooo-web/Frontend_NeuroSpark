import { useParams } from "react-router-dom";
import { useState } from "react";
import { stories } from "../data/storiesData";
import Header from "../components/common/Header/Header";
import Footer from "../components/common/Footer/Footer";
import GingerIntroSlide from "../components/StoryReader/slides/Ginger/GingerIntroSlide";
import Ginger2Slide from "../components/StoryReader/slides/Ginger/Ginger2Slide";
import Ginger3Slide from "../components/StoryReader/slides/Ginger/Ginger3Slide";
import Ginger4Slide from "../components/StoryReader/slides/Ginger/Ginger4Slide";
import "./StoryBook.css";

const StoryBook = () => {
  const { id } = useParams();
  const story = stories[id];
  const [pageIndex, setPageIndex] = useState(0);

  if (!story) return <h2>Story not found</h2>;

  console.log("Current page index:", pageIndex);

  const goToNextPage = () => {
    if (pageIndex < story.pages.length - 1) {
      console.log("Moving to next page:", pageIndex + 1);
      setPageIndex(pageIndex + 1);
    }
  };

  const handlePageComplete = () => {
    console.log("Page completed! Moving to next in 1.5 seconds...");
    setTimeout(() => {
      goToNextPage();
    }, 1500);
  };

  const renderCurrentSlide = () => {
    const currentPage = story.pages[pageIndex];
    
    const slideProps = {
      text: currentPage.text,
      onPageComplete: handlePageComplete,
      pageNumber: pageIndex + 1,
      totalPages: story.pages.length
    };

    if (id === "1") {
      switch(pageIndex) {
        case 0: return <GingerIntroSlide key={pageIndex} {...slideProps} />;
        case 1: return <Ginger2Slide key={pageIndex} {...slideProps} />;
        case 2: return <Ginger3Slide key={pageIndex} {...slideProps} />;
        case 3: return <Ginger4Slide key={pageIndex} {...slideProps} />;
        default: return <div>Page not found</div>;
      }
    }
    return <div>Story not found</div>;
  };

  return (
    <div className="storybook-container">
      <Header />
      
      <div className="book-page">
        {renderCurrentSlide()}
      </div>

      {/* Page indicator */}
      
      <div className="page-indicator-book">
        Page {pageIndex + 1} of {story.pages.length}
      </div>
      
      <Footer />
    </div>
  );
};

export default StoryBook;