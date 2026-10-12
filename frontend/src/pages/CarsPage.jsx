import { memo } from 'react';
import Navbar from '../components/Navbar';
import Cars from '../components/Cars';
import Footer from '../components/Footer';

const CarsPage = () => {
  return (
    <div>
      <Navbar />
      <Cars />
      <Footer />
    </div>
  );
};

export default memo(CarsPage);