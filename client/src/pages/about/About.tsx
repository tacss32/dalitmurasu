import { useEffect } from "react";
import Header from "../../components/Header";
// import OurMission from "./OurMission"; 
import OurStory from "./OurStory";     

export default function About() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="flex flex-col gap-5">
      <Header />
      {/* <OurMission />  */}
      <OurStory />   
    </div>
  );
}