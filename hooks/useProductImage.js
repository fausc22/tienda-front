import { useState, useEffect } from 'react';

export const useProductImage = (barcode) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!barcode) {
      setImageSrc('https://vps-5234411-x.dattaweb.com/api/images/placeholder.png');
      setLoading(false);
      return;
    }

    const localUrl = `https://vps-5234411-x.dattaweb.com/api/images/products/${barcode}.png`;
    const placeholder = 'https://vps-5234411-x.dattaweb.com/api/images/placeholder.png';

    const checkImage = async () => {
      try {
        // 1️⃣ Intentar cargar imagen local con un simple GET
        const res = await fetch(localUrl);
        if (res.ok) {
          setImageSrc(localUrl);
          return;
        }

        // 2️⃣ Buscar en Open Food Facts si no está localmente
        const offRes = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
        const data = await offRes.json();

        if (data.status === 1 && data.product && data.product.image_front_url) {
          setImageSrc(data.product.image_front_url);
        } else {
          setImageSrc(placeholder);
        }
      } catch (error) {
        console.error('Error buscando imagen:', error);
        setImageSrc(placeholder);
      } finally {
        setLoading(false);
      }
    };

    checkImage();
  }, [barcode]);

  return { imageSrc, loading };
};
