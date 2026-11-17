import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/** Nieuwe pagina = bovenaan beginnen. Bij "terug" (POP) laat de browser de oude positie staan. */
export function ScrollToTop() {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();
  useEffect(() => {
    if (navigationType !== 'POP') window.scrollTo(0, 0);
  }, [pathname, navigationType]);
  return null;
}
