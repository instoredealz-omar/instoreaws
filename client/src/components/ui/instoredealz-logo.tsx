import logoImage from "../../assets/Instoredealz logo_1749978877977.jpg";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "icon" | "full" | "text-only";
}

export default function InstoredeelzLogo({ 
  className = "", 
  size = "md",
  variant = "full" 
}: LogoProps) {
  const sizeClasses = {
    sm: "h-6",
    md: "h-8", 
    lg: "h-12",
    xl: "h-16"
  };

  const LogoIcon = () => (
    <div className={`${sizeClasses[size]} aspect-square rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 p-0.5 shadow-lg`}>
      <img 
        src={logoImage} 
        alt="Instoredealz" 
        className={`w-full h-full object-cover rounded-full ${className}`}
      />
    </div>
  );

  const LogoText = () => {
    const coloredText = "instoredealz".split("").map((letter, index) => {
      const colors = [
        "text-blue-600 dark:text-blue-400",
        "text-yellow-500 dark:text-yellow-400"
      ];
      return (
        <span key={`${letter}-${index}`} className={`${colors[index % colors.length]} font-bold tracking-wide ${size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-2xl' : size === 'xl' ? 'text-3xl' : 'text-lg'}`}>
          {letter}
        </span>
      );
    });

    return (
      <div className={`relative overflow-hidden ${size === 'sm' ? 'w-20' : size === 'lg' ? 'w-48' : size === 'xl' ? 'w-64' : 'w-32'}`}>
        <div className="animate-scroll-text whitespace-nowrap">
          {coloredText}&nbsp;&nbsp;
          <span className="text-gray-400 dark:text-gray-500">•</span>&nbsp;&nbsp;
          {coloredText}&nbsp;&nbsp;
          <span className="text-gray-400 dark:text-gray-500">•</span>&nbsp;&nbsp;
          {coloredText}&nbsp;&nbsp;
          <span className="text-gray-400 dark:text-gray-500">•</span>&nbsp;&nbsp;
          {coloredText}&nbsp;&nbsp;
          <span className="text-gray-400 dark:text-gray-500">•</span>&nbsp;&nbsp;
        </div>
      </div>
    );
  };

  if (variant === "icon") {
    return <LogoIcon />;
  }

  if (variant === "text-only") {
    return <LogoText />;
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <LogoIcon />
      <LogoText />
    </div>
  );
}