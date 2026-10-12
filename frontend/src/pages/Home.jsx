import { memo } from 'react';
import Navbar from '../components/Navbar';
import HomeBanner from '../components/HomeBanner';
import HomeCars from '../components/HomeCars';
import Testinominal from '../components/Testimonial';
import Footer from '../components/Footer';

const Home = () => {
  return (
    <div>
      <Navbar />
      <HomeBanner />
      <HomeCars />
      <Testinominal />
      <Footer />
    </div>
  );
};

export default memo(Home);