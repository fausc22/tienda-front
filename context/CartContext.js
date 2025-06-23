import { createContext, useContext, useReducer, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

const CartContext = createContext();

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'LOAD_CART':
      return { ...state, items: action.payload };
    
    case 'ADD_ITEM': {
      const { name, price, imageUrl, quantity } = action.payload;
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
          imageUrl
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

  // Cargar carrito desde localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const cartData = JSON.parse(savedCart);
        dispatch({ type: 'LOAD_CART', payload: cartData });
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
  }, []);

  // Guardar carrito en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(state.items));
  }, [state.items]);

  const totalItems = state.items.reduce((total, item) => total + item.quantity, 0);
  const totalPrice = state.items.reduce((total, item) => total + item.total, 0);

  return (
    <CartContext.Provider value={{
      ...state,
      totalItems,
      totalPrice,
      dispatch
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