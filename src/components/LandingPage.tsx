import React from 'react';

const landingImage = `${import.meta.env.BASE_URL}首页.png`;

interface LandingPageProps {
  onNavigate: (view: 'login' | 'register') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  return (
    <div style={styles.outerContainer}>
      <div style={styles.imageStage}>
        <img
          src={landingImage}
          alt="Landing page background"
          style={styles.backgroundImage}
        />

        <button
          aria-label="Login"
          title="Login"
          onClick={() => onNavigate('login')}
          style={{ ...styles.hotspotButton, ...styles.loginHotspot }}
        />
        <button
          aria-label="Register"
          title="Register"
          onClick={() => onNavigate('register')}
          style={{ ...styles.hotspotButton, ...styles.registerHotspot }}
        />
      </div>
      <div style={styles.scrollSpacer} aria-hidden="true" />
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  outerContainer: {
    width: '100vw',
    minHeight: '100vh',
    position: 'relative',
    backgroundColor: '#010612',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    overflowX: 'hidden',
    overflowY: 'auto',
    scrollbarGutter: 'stable',
  },
  imageStage: {
    position: 'relative',
    width: 'max(100vw, 960px)',
    aspectRatio: '1402 / 880',
    flex: '0 0 auto',
    overflow: 'hidden',
  },
  backgroundImage: {
    width: '100%',
    height: 'auto',
    display: 'block',
    pointerEvents: 'none',
  },
  hotspotButton: {
    position: 'absolute',
    zIndex: 2,
    border: 0,
    borderRadius: '8px',
    background: 'transparent',
    cursor: 'pointer',
    outlineOffset: '4px',
  },
  loginHotspot: {
    left: '29%',
    top: '92.9%',
    width: '19.1%',
    height: '6.1%',
  },
  registerHotspot: {
    left: '51.9%',
    top: '92.9%',
    width: '19.1%',
    height: '6.1%',
  },
  scrollSpacer: {
    display: 'none',
    pointerEvents: 'none',
  },
};
