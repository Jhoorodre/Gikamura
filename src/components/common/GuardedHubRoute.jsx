// AIDEV-NOTE: Guarded route component for hub routes with parameter validation
import { useParams } from 'react-router-dom';
import { HubRouteGuard } from './RouteGuard';
import HubRouteHandler from '../../views/HubRouteHandler';

const GuardedHubRoute = () => {
  const { encodedUrl } = useParams();
  
  return (
    <HubRouteGuard encodedUrl={encodedUrl}>
      <HubRouteHandler />
    </HubRouteGuard>
  );
};

export default GuardedHubRoute;