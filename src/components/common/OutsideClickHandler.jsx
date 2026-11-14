import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

// Drop-in replacement for the unmaintained `react-outside-click-handler` (no React 19 support):
// renders a wrapper <div> and calls `onOutsideClick` on a mousedown/touchstart outside it.
function OutsideClickHandler({ children, onOutsideClick }) {
  const ref = useRef(null);
  const callback = useRef(onOutsideClick);

  useEffect(() => {
    callback.current = onOutsideClick;
  });

  useEffect(() => {
    const handle = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        callback.current(event);
      }
    };
    document.addEventListener('mousedown', handle);
    document.addEventListener('touchstart', handle);
    return () => {
      document.removeEventListener('mousedown', handle);
      document.removeEventListener('touchstart', handle);
    };
  }, []);

  return <div ref={ref}>{children}</div>;
}

OutsideClickHandler.propTypes = {
  children: PropTypes.node.isRequired,
  onOutsideClick: PropTypes.func.isRequired,
};

export default OutsideClickHandler;
