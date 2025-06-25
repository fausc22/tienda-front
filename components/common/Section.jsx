const Section = ({ children, title }) => {
  return (
    <section className="w-full py-8 sm:py-12 md:py-16 px-4 sm:px-6 md:px-8 lg:px-12 flex flex-col items-center">
      
      {/* Título de la sección */}
      {title && (
        <div className="relative text-center mb-6 sm:mb-8 md:mb-10 w-full">
          <h2 className="text-blue-600 text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold leading-tight px-4">
            {title}
          </h2>
          {/* Línea decorativa debajo del título */}
          <div className="absolute -bottom-2 sm:-bottom-3 left-1/2 transform -translate-x-1/2 w-16 sm:w-20 md:w-24 h-0.5 sm:h-1 rounded-lg bg-blue-600"></div>
        </div>
      )}
      
      {/* Contenido de la sección */}
      <div className="w-full flex flex-col items-center max-w-7xl mx-auto">
        {children}
      </div>
      
    </section>
  );
};

export default Section;