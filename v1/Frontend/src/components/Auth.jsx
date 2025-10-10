import React, { useState } from "react";
import SignIn from "./SignIn";
import SignUp from "./SignUp";

export default function Auth({ onLoginSuccess }) {
  const [isSignIn, setIsSignIn] = useState(true);

  const handleSignUpSuccess = (userData) => {
    // Show a success message or redirect to email verification
    console.log("Sign up successful:", userData);
    // For now, we'll treat signup as immediate login
    onLoginSuccess(userData);
  };

  const switchToSignUp = () => {
    setIsSignIn(false);
  };

  const switchToSignIn = () => {
    setIsSignIn(true);
  };

  if (isSignIn) {
    return (
      <SignIn 
        onLoginSuccess={onLoginSuccess} 
        onSwitchToSignUp={switchToSignUp} 
      />
    );
  } else {
    return (
      <SignUp 
        onSignUpSuccess={handleSignUpSuccess} 
        onSwitchToSignIn={switchToSignIn} 
      />
    );
  }
}