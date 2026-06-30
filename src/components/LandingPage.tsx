import React from 'react';
import { LogIn, UserPlus } from 'lucide-react';

interface LandingPageProps {
  onNavigate: (view: 'login' | 'register') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  return (
    <div style={styles.outerContainer}>
      <div style={styles.aspectRatioContainer}>
        {/* Background image */}
        <img src="/首页.png" alt="首页背景" style={styles.backgroundImage} />

        {/* Floating interactive buttons container */}
        <div style={styles.buttonsWrapper}>
          {/* Login Button Area */}
          <div style={styles.buttonCol}>
            <button 
              onClick={() => onNavigate('login')} 
              style={{ ...styles.btn, ...styles.btnLogin }}
              className="btn-primary-glow"
            >
              <LogIn size={20} />
              <span>登 录</span>
            </button>
            <span style={styles.subtext}>已有账号，立即登录</span>
          </div>

          {/* Register Button Area */}
          <div style={styles.buttonCol}>
            <button 
              onClick={() => onNavigate('register')} 
              style={{ ...styles.btn, ...styles.btnRegister }}
            >
              <UserPlus size={20} />
              <span>注 册</span>
            </button>
            <span style={styles.subtext}>加入社区，共筑安全</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  outerContainer: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#010612', // Matches image dark blue background
    overflow: 'hidden',
  },
  aspectRatioContainer: {
    position: 'relative',
    // The image aspect ratio is 1402:1122 = 1.25
    width: 'min(100vw, 100vh * 1.25)',
    height: 'min(100vh, 100vw / 1.25)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    pointerEvents: 'none', // Prevent dragging/selecting
  },
  buttonsWrapper: {
    position: 'absolute',
    // Positioned exactly over the original buttons in 首页.png
    top: '74.5%', 
    left: '50%',
    transform: 'translate(-50%, -50%)',
    display: 'flex',
    justifyContent: 'center',
    gap: '5.5vw', // Responsive spacing between buttons
    width: '56%',
  },
  buttonCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    flex: 1,
  },
  btn: {
    width: '100%',
    padding: 'min(1.4vh, 14px) min(2.5vw, 24px)',
    borderRadius: '6px',
    fontSize: 'min(1.8vh, 18px)',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    border: 'none',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    fontFamily: "'Inter', sans-serif",
  },
  btnLogin: {
    backgroundColor: '#1E62EC', // Matches original blue
    color: '#ffffff',
    boxShadow: '0 4px 15px rgba(30, 98, 236, 0.4), 0 0 15px rgba(30, 98, 236, 0.2)',
  },
  btnRegister: {
    backgroundColor: '#ffffff',
    color: '#081426',
    boxShadow: '0 4px 15px rgba(255, 255, 255, 0.2)',
  },
  subtext: {
    color: '#557297', // Soft blue muted color matching the screenshot subtext
    fontSize: 'min(1.3vh, 13px)',
    letterSpacing: '1px',
    fontWeight: '500',
    pointerEvents: 'none',
  }
};

// Add standard active/hover styles using global CSS
const styleSheet = document.createElement("style");
styleSheet.innerText = `
  .btn-primary-glow:hover {
    transform: translateY(-2px) scale(1.02);
    box-shadow: 0 8px 25px rgba(30, 98, 236, 0.6), 0 0 20px rgba(30, 98, 236, 0.4) !important;
    filter: brightness(1.1);
  }
  .btn-primary-glow:active {
    transform: translateY(0) scale(1);
  }
  button:not(.btn-primary-glow):hover {
    transform: translateY(-2px) scale(1.02);
    box-shadow: 0 8px 25px rgba(255, 255, 255, 0.4) !important;
    filter: brightness(0.95);
  }
  button:not(.btn-primary-glow):active {
    transform: translateY(0) scale(1);
  }
`;
document.head.appendChild(styleSheet);
