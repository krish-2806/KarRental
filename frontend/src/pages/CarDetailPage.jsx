import { memo } from 'react';
import CarDetails from '../components/CarDetails';

const CarDetailPage = () => {
  return (
    <div>
      <CarDetails />
    </div>
  );
};

export default memo(CarDetailPage);