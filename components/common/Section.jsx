const Section = ({ children, title }) => {
  return (
    <section className="py-12 px-12 w-full flex flex-col gap-15 justify-center items-center md:py-12 md:px-12 sm:py-8 sm:px-4">
      {title && (
        <div className="relative text-center mb-8">
          <h2 className="text-blue-600 text-4xl font-semibold leading-4 sm:text-2xl sm:leading-8">
            {title}
          </h2>
          <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-3/4 h-0.5 rounded-lg bg-blue-600"></div>
        </div>
      )}
      <div className="w-full flex flex-col gap-8 justify-center items-center">
        {children}
      </div>
    </section>
  );
};

export default Section;