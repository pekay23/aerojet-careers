import React from 'react'

interface PageHeroProps {
  title: string
  subtitle?: string
  image?: string
  height?: number
}

export function PageHero({
  title,
  subtitle,
  image = '/images/mro1-BNITgFHH.jpg',
  height = 360,
}: PageHeroProps) {
  return (
    <div
      className="relative flex items-center justify-center text-white text-center px-4 py-20 overflow-hidden"
      style={{ minHeight: height }}
    >
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-&lsqb;10s&rsqb; hover:scale-105"
        style={{ backgroundImage: `url('${image}')` }}
      />
      <div className="absolute inset-0 z-10 bg-[#1c2a38]/60 backdrop-blur-[2px]" />

      {/* Content */}
      <div className="relative z-20 max-w-4xl mx-auto space-y-4">
        <h1 className="text-4xl md:text-5xl lg:text-5xl font-bold tracking-tight uppercase leading-none drop-shadow-2xl">
          {title}
        </h1>
        {subtitle && (
          <p className="text-lg md:text-xl font-medium text-white/90 max-w-2xl mx-auto tracking-tight drop-shadow-lg">
            {subtitle}
          </p>
        )}
      </div>

      {/* Decorative Gradient Bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent z-10" />
    </div>
  )
}
