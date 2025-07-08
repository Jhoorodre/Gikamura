// AIDEV-NOTE: Guarded route component for reader routes with parameter validation
import { useParams } from 'react-router-dom';
import { ReaderRouteGuard } from './RouteGuard';
import ReaderChapter from '../../pages/ReaderChapter';

const GuardedReaderRoute = () => {
  const { encodedUrl, encodedChapterId } = useParams();
  
  return (
    <ReaderRouteGuard encodedUrl={encodedUrl} encodedChapterId={encodedChapterId}>
      <ReaderChapter />
    </ReaderRouteGuard>
  );
};

export default GuardedReaderRoute;