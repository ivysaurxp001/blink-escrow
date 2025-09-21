import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function Logo({ size = 'md', className = '' }: LogoProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12', 
    lg: 'w-16 h-16'
  };

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      {/* Logo Z với brushstroke style */}
      <div className="w-full h-full bg-black rounded-lg flex items-center justify-center border-2 border-white/20 relative overflow-hidden">
        {/* Background texture */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black opacity-80"></div>
        
        {/* Z letter với brushstroke effect */}
        <svg 
          viewBox="0 0 100 100" 
          className="w-3/4 h-3/4 text-white relative z-10"
          style={{
            filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.3))'
          }}
        >
          {/* Top horizontal stroke */}
          <path
            d="M15 25 L85 25"
            stroke="white"
            strokeWidth="8"
            strokeLinecap="round"
            fill="none"
            style={{
              filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.8))'
            }}
          />
          
          {/* Diagonal stroke */}
          <path
            d="M85 25 L15 75"
            stroke="white"
            strokeWidth="8"
            strokeLinecap="round"
            fill="none"
            style={{
              filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.8))'
            }}
          />
          
          {/* Bottom horizontal stroke */}
          <path
            d="M15 75 L85 75"
            stroke="white"
            strokeWidth="8"
            strokeLinecap="round"
            fill="none"
            style={{
              filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.8))'
            }}
          />
        </svg>
        
        {/* Brush texture overlay */}
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='10' cy='10' r='1'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat'
          }}></div>
        </div>
      </div>
      
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg blur-sm -z-10"></div>
    </div>
  );
}
