import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

import { analyticsService } from '@/services/analyticsService';
import { useCustomerAuthStore } from '@/store/customerAuthStore';

export default function AnalyticsTracker() {
  const location = useLocation();
  const customer = useCustomerAuthStore((s) => s.customer);
  const lastPageAt = useRef(Date.now());

  useEffect(() => {
    const pagePath = `${location.pathname}${location.search}`;
    const userId = customer?._id || null;
    const timeOnPage = Math.max(0, Math.round((Date.now() - lastPageAt.current) / 1000));
    lastPageAt.current = Date.now();

    analyticsService.startSession({ pagePath, userId });
    analyticsService.trackPageView({ pagePath, userId, timeOnPage });
  }, [customer?._id, location.pathname, location.search]);

  useEffect(() => {
    const onBeforeUnload = () => {
      analyticsService.heartbeat({ pagePath: window.location.pathname });
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  return null;
}
