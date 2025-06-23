import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaArrowRight, FaArrowLeft } from 'react-icons/fa';
import apiClient from '../../config/api';

const Categories = ({ onSelectCategory }) => {
  const [openCategories, setOpenCategories] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleToggleCategories = () => {
    setOpenCategories(prev => !prev);
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await apiClient.get('/store/categorias');
        setCategories(response.data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleSelectCategory = (name) => {
    onSelectCategory(name);
    setOpenCategories(false);
  };

  return (
    <>
      <AnimatePresence>
        {/* Menú de categorías */}
        {openCategories && (
          <motion.div
            initial={{ translateX: -1000 }}
            animate={{ translateX: 0 }}
            exit={{ translateX: -1000, opacity: 0 }}
            transition={{ type: "spring", damping: 27 }}
            className="fixed top-16 left-0 w-1/4 h-full bg-blue-600 z-50 overflow-y-auto md:w-1/4 sm:w-1/2"
          >
            <div className="p-8 flex flex-col gap-8">
              {/* Header */}
              <div className="flex items-center gap-3 border-b border-blue-400 pb-3">
                <button
                  onClick={handleToggleCategories}
                  className="text-white hover:text-blue-200 transition-colors"
                >
                  <FaArrowLeft />
                </button>
                <h3 className="text-white text-xl font-bold">Categorías</h3>
              </div>

              {/* Categories List */}
              <div className="flex flex-col gap-6">
                {loading ? (
                  <div className="text-white text-center">Cargando...</div>
                ) : (
                  categories.map(category => (
                    <div
                      key={category.NOM_CLASIF}
                      onClick={() => handleSelectCategory(category.NOM_CLASIF)}
                      className="flex justify-between items-center cursor-pointer group w-4/5 md:w-4/5 sm:w-11/12"
                    >
                      <span className="text-white group-hover:text-blue-200 transition-colors">
                        {category.NOM_CLASIF}
                      </span>
                      <FaArrowRight className="text-blue-300 text-sm group-hover:text-white transition-colors" />
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Botón de apertura */}
        {!openCategories && (
          <motion.div
            initial={{ translateX: -500 }}
            animate={{ translateX: 0 }}
            exit={{ translateX: -500, opacity: 0 }}
            transition={{ type: "spring", damping: 27, duration: 0.1 }}
            className="fixed top-16 left-0 w-20 h-full bg-blue-600 z-40 md:w-20 sm:w-1/10"
          >
            <div className="p-6 flex flex-col gap-8">
              <div className="flex justify-center">
                <button
                  onClick={handleToggleCategories}
                  className="text-white hover:text-blue-200 transition-colors"
                >
                  <FaArrowRight />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Categories;