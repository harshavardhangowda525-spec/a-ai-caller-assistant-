import {
  getEvents,
  getFeaturedCoffee,
  getFood,
  getGallery,
  getReviewThemes,
  getSiteContent,
} from '@/lib/data';
import { MouseLight, Blobs } from '@/components/glass/Atmosphere';
import Nav from '@/components/site/Nav';
import Hero from '@/components/site/Hero';
import Intro from '@/components/site/Intro';
import Journey from '@/components/site/Journey';
import CoffeeCollection from '@/components/site/CoffeeCollection';
import Food from '@/components/site/Food';
import Experience from '@/components/site/Experience';
import Events from '@/components/site/Events';
import Reviews from '@/components/site/Reviews';
import Gallery from '@/components/site/Gallery';
import About from '@/components/site/About';
import Location from '@/components/site/Location';
import Footer from '@/components/site/Footer';

export const revalidate = 300;

export default async function HomePage() {
  const [content, coffee, food, events, gallery, reviews] = await Promise.all([
    getSiteContent(),
    getFeaturedCoffee(),
    getFood(),
    getEvents(),
    getGallery(),
    getReviewThemes(),
  ]);

  return (
    <main className="relative">
      <Blobs />
      <MouseLight />
      <div className="relative z-10">
        <Nav orderingUrl={content.orderingUrl} />
        <Hero content={content} />
        <Intro />
        <Journey />
        <CoffeeCollection items={coffee} orderingUrl={content.orderingUrl} />
        <Food items={food} orderingUrl={content.orderingUrl} />
        <Experience />
        <Events events={events} orderingUrl={content.orderingUrl} />
        <Reviews themes={reviews} reviewsUrl={content.mapsUrl} />
        <Gallery images={gallery} />
        <About content={content} />
        <Location content={content} />
        <Footer content={content} />
      </div>
    </main>
  );
}
