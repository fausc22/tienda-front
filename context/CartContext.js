import { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

const CartContext = createContext();

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'LOAD_CART':
      return { ...state, items: action.payload };
    
   case 'ADD_ITEM': {
    const { name, price, imageUrl, quantity, cod_interno } = action.payload;
    
    // Ya no necesitas normalizar, siempre viene cod_interno
    const existingIndex = state.items.findIndex(item => item.name === name);
    
    let newItems;
    if (existingIndex >= 0) {
      newItems = [...state.items];
      newItems[existingIndex].quantity += quantity;
      newItems[existingIndex].total = newItems[existingIndex].quantity * price;
    } else {
      newItems = [...state.items, {
        id: uuidv4(),
        name,
        quantity,
        price,
        total: price * quantity,
        imageUrl,
        codigo_barra: imageUrl,
        cod_interno: cod_interno || 0 // ✅ Simplificado
      }];
    }
    
    return { ...state, items: newItems };
  }
    
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload)
      };
    
    case 'UPDATE_QUANTITY': {
      const { id, quantity } = action.payload;
      const newItems = state.items.map(item =>
        item.id === id
          ? { ...item, quantity, total: item.price * quantity }
          : item
      );
      return { ...state, items: newItems };
    }
    
    case 'CLEAR_CART':
      return { ...state, items: [] };
    
    default:
      return state;
  }
};

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
  });
  
  const [isLoaded, setIsLoaded] = useState(false);

  // Cargar carrito desde localStorage AL INICIO
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('cart');
      if (savedCart && savedCart !== 'undefined' && savedCart !== 'null') {
        const cartData = JSON.parse(savedCart);

        // Validar que sea un array válido
        if (Array.isArray(cartData)) {
          // Validar cada item del carrito
          const validatedCart = cartData.filter(item => {
            return item &&
                   typeof item.name === 'string' &&
                   typeof item.price === 'number' &&
                   typeof item.quantity === 'number' &&
                   item.quantity > 0 &&
                   item.price >= 0;
          });

          console.log(`🛒 Carrito cargado desde localStorage: ${validatedCart.length} items`);
          dispatch({ type: 'LOAD_CART', payload: validatedCart });
        } else {
          console.warn('⚠️ Carrito en localStorage no es un array válido, limpiando');
          localStorage.removeItem('cart');
        }
      }
    } catch (error) {
      console.error('❌ Error cargando carrito desde localStorage:', error);
      // Limpiar localStorage corrupto
      localStorage.removeItem('cart');
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Guardar carrito en localStorage cuando cambie - SOLO después de cargar
  useEffect(() => {
    if (isLoaded) {
      try {
        const cartString = JSON.stringify(state.items);
        localStorage.setItem('cart', cartString);
        console.log(`💾 Carrito guardado: ${state.items.length} items`);
      } catch (error) {
        console.error('❌ Error guardando carrito en localStorage:', error);
        // Si falla (quota exceeded), intentar limpiar y guardar versión mínima
        try {
          const minimalCart = state.items.map(({ id, name, quantity, price, cod_interno }) => ({
            id, name, quantity, price, cod_interno
          }));
          localStorage.setItem('cart', JSON.stringify(minimalCart));
        } catch (retryError) {
          console.error('❌ Error en retry de guardado:', retryError);
        }
      }
    }
  }, [state.items, isLoaded]);

  const totalItems = state.items.reduce((total, item) => total + item.quantity, 0);
  const totalPrice = state.items.reduce((total, item) => total + item.total, 0);

  return (
    <CartContext.Provider value={{
      ...state,
      totalItems,
      totalPrice,
      dispatch,
      isLoaded
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe usarse dentro de CartProvider');
  }
  return context;
};