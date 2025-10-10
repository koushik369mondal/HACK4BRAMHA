import React from "react";
import profilePic from "../assets/profile.jpg";

export default function ProfileAvatar({ name, avatarUrl }) {
  const src = avatarUrl || profilePic;
  
  // Get first letter of name for avatar fallback
  const getInitial = (name) => {
    if (!name) return "?";
    // If it's a full name, get first letter of first name
    const firstName = name.trim().split(' ')[0];
    return firstName.charAt(0).toUpperCase();
  };
  
  if (src) {
    return (
      <img
        src={src}
        alt={name || "Profile"}
        className="w-10 h-10 rounded-full object-cover"
      />
    );
  }
  return (
    <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-lg">
      {getInitial(name)}
    </div>
  );
}
