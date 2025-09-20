import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: "default" | "error";
}

export function Input({ className = "", variant = "default", ...props }: InputProps) {
  const variants = {
    default: "border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-900",
    error: "border-red-300 focus:border-red-500 focus:ring-red-500 bg-white text-gray-900",
  };

  return (
    <input
      className={`flex h-10 w-full rounded-md border px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
