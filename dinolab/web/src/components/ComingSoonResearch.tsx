import React, { useState } from 'react';
import './ComingSoonResearch.css';

interface ComingSoonResearchProps {
  onClose?: () => void;
  onEmailSubmit?: (email: string) => void;
}

const ComingSoonResearch: React.FC<ComingSoonResearchProps> = ({
  onClose,
  onEmailSubmit,
}) => {
  const [email, setEmail] = useState<string>('');
  const [emailError, setEmailError] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(false);

  const validateEmail = (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    if (emailError) {
      setEmailError('');
    }
  };

  const handleEmailSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email.trim()) {
      setEmailError('Please enter your email address');
      return;
    }

    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    if (onEmailSubmit) {
      onEmailSubmit(email);
    } else {
      console.log('Email submitted:', email);
    }

    setSubmitted(true);
    setEmail('');
    setTimeout(() => {
      setSubmitted(false);
    }, 3000);
  };

  return (
    <div className="coming-soon-research-container">
      <div className="coming-soon-research-content">
        <div className="mascot-wrapper">
          <img
            src="/research-mascot.png"
            alt="Research Lab Mascot"
            className="research-mascot"
          />
        </div>

        <h1 className="coming-soon-title">Coming Soon</h1>
        <p className="coming-soon-message">
          Our research team is getting the lab ready for you!
        </p>
        <p className="coming-soon-subtitle">
          Expert Q&A assistance is on the way. Stay tuned for groundbreaking insights.
        </p>

        <form
          className="email-signup-form"
          onSubmit={handleEmailSubmit}
        >
          <div className="email-input-group">
            <input
              type="email"
              value={email}
              onChange={handleEmailChange}
              placeholder="your@email.com"
              className="email-input"
              disabled={submitted}
            />
            <button
              type="submit"
              className="email-submit-button"
              disabled={submitted}
            >
              {submitted ? 'Thank you!' : 'Notify Me'}
            </button>
          </div>
          {emailError && (
            <span className="email-error-message">{emailError}</span>
          )}
        </form>

        {onClose && (
          <button
            className="close-button"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

export default ComingSoonResearch;