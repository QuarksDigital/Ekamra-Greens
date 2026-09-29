import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Statement from "@/components/Statement";
import Stepper from "@/components/Stepper";
import Rituals from "@/components/Rituals";
import Spaces from "@/components/Spaces";
import Gallery from "@/components/Gallery";
import Forecourt from "@/components/Forecourt";
import Quote from "@/components/Quote";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Statement />
        <Stepper />
        <Rituals />
        <Spaces />
        <Gallery />
        <Forecourt />
        <Quote />
      </main>
      <Footer />
    </>
  );
}
