import React from 'react';
import cybernerdsLogo from '../assets/cybernerds.png';
import owaspLogo from '../assets/owasp.png';
import kalasalingamLogo from '../assets/kalasalingam.png';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="site-footer-wrap">
        <div className="site-footer-row">
          <div className="site-footer-logos site-footer-logos-clubs">
            <img
              src={cybernerdsLogo}
              alt="CYBERNERDS KARE Student Chapter"
              className="site-footer-logo site-footer-logo-club"
            />
            <img
              src={owaspLogo}
              alt="OWASP KARE Student Chapter"
              className="site-footer-logo site-footer-logo-club site-footer-logo-owasp"
            />
          </div>

          <p className="site-footer-credit">
            DESIGNED AND DEVELOPED BY WEB DEV TEAM CYBERNERDS X OWSAP KARE
          </p>

          <div className="site-footer-logos site-footer-logos-uni">
            <img
              src={kalasalingamLogo}
              alt="Kalasalingam Academy of Research and Education"
              className="site-footer-logo site-footer-logo-uni"
            />
          </div>
        </div>

        <p className="site-footer-brand">CYBERNERDS OWASP</p>
        <p className="site-footer-uni">Kalasalingam Academy of Research and Education</p>
        <p className="site-footer-tag">Learn. Build. Collaborate. Grow.</p>
      </div>
    </footer>
  );
};

export default Footer;
