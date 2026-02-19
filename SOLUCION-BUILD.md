# Solución al Problema de Estilos en el Build

## Problema Identificado

El build se genera correctamente, pero cuando lo pruebas localmente o cuando se sube al servidor sin la configuración correcta, se ve sin estilos.

## Causa

El build está configurado para servir desde `/tienda` usando `basePath` y `assetPrefix`, pero:
1. Los CSS/JS se generan con paths como `/tienda/_next/static/css/...`
2. Las imágenes se generan con paths como `/logo.jpg` (sin el basePath)

Cuando pruebas localmente con `npx serve`, el servidor sirve desde `/`, no desde `/tienda`, por eso los assets no cargan.

## Solución

### 1. En el Servidor VPS

Asegúrate de que tu servidor web (Apache/Nginx) esté configurado correctamente:

- Los archivos de `tienda/out/` deben estar en `/tienda/` en el servidor
- El servidor debe servir correctamente las rutas `/tienda/_next/...`

### 2. Verificar el Build

Después de hacer `npm run build:prod`, verifica que:

```bash
# Verificar que los CSS tienen el path correcto
grep -o 'href="[^"]*\.css"' tienda/out/index.html

# Deberías ver: href="/tienda/_next/static/css/..."
```

### 3. Probar Localmente (para desarrollo)

Si quieres probar el build localmente como si estuviera en `/tienda`, puedes:

**Opción A: Usar un servidor HTTP simple con basePath**
```bash
cd tienda/out
python3 -m http.server 3000
```
Luego accede a: `http://localhost:3000/tienda/` (si creas un symlink)

**Opción B: Usar el servidor de desarrollo**
```bash
cd tienda
npm run dev
```

**Opción C: Configurar un proxy local** (más complejo)

### 4. Verificar en el Servidor VPS

Una vez subido, accede a:
- `https://tu-dominio.com/tienda/`

Y verifica en las herramientas de desarrollador (F12) que:
- Los CSS cargan desde `/tienda/_next/static/css/...`
- Los JS cargan desde `/tienda/_next/static/chunks/...`
- Las imágenes cargan correctamente

## Estado Actual del Build

✅ CSS y JS: Generados correctamente con paths `/tienda/_next/...`
✅ Configuración: `basePath` y `assetPrefix` configurados para producción
⚠️ Imágenes: Algunas usan paths absolutos que pueden necesitar ajuste

## Próximos Pasos

1. Subir el contenido de `tienda/out/` a `/tienda/` en tu servidor VPS
2. Verificar que el servidor web esté configurado correctamente
3. Acceder a `https://tu-dominio.com/tienda/` y verificar que todo funcione

