// AIDEV-NOTE: Guarded route component for manga routes with parameter validation
import { useParams } from 'react-router-dom';
import { MangaRouteGuard } from './RouteGuard';
import PageView from '../../pages/PageView';

const GuardedMangaRoute = () => {
  const { encodedUrl } = useParams();
  
  return (
    <MangaRouteGuard encodedUrl={encodedUrl}>
      <PageView />
    </MangaRouteGuard>
  );
};

export default GuardedMangaRoute;