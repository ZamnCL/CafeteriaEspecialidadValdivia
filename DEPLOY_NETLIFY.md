# Guía de Despliegue en Netlify

## Opción 1: Despliegue Manual (Drag & Drop)

1. Ve a [https://app.netlify.com/](https://app.netlify.com/)
2. Inicia sesión o crea una cuenta
3. Arrastra la carpeta `dist/` directamente a la interfaz de Netlify
4. Netlify desplegará automáticamente tu sitio

## Opción 2: Despliegue desde Git (Recomendado)

### Paso 1: Subir el código a GitHub

```bash
git add .
git commit -m "Preparar para despliegue en Netlify"
git push origin main
```

### Paso 2: Conectar con Netlify

1. Ve a [https://app.netlify.com/](https://app.netlify.com/)
2. Click en "Add new site" → "Import an existing project"
3. Selecciona "GitHub" y autoriza el acceso
4. Busca y selecciona tu repositorio `CafeteriaEspecialidadValdivia`
5. Configura los siguientes ajustes:
   - **Branch to deploy**: `main`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
6. Click en "Deploy site"

### Paso 3: Configurar Variables de Entorno

En el dashboard de Netlify:
1. Ve a "Site settings" → "Environment variables"
2. Agrega las siguientes variables:
   - `VITE_SUPABASE_URL`: Tu URL de Supabase
   - `VITE_SUPABASE_ANON_KEY`: Tu clave anónima de Supabase

### Paso 4: Actualizar URLs en Supabase Edge Function

Una vez que Netlify te asigne una URL (ej: `https://tu-sitio.netlify.app`):

1. Ve a tu proyecto en Supabase
2. Navega a "Edge Functions" → `mercado_pago`
3. Actualiza la variable de entorno `BASE_URL` con tu URL de Netlify:
   ```
   BASE_URL=https://tu-sitio.netlify.app
   ```

O actualiza el código de la función para usar tu URL:

```typescript
const BASE_URL = Deno.env.get('BASE_URL') || 'https://tu-sitio.netlify.app';
```

### Paso 5: Verificar el Despliegue

1. Visita tu sitio en la URL proporcionada por Netlify
2. Prueba el flujo de compra completo
3. Verifica que las redirecciones de Mercado Pago funcionen correctamente

## URLs de Callback de Mercado Pago

Las siguientes rutas están configuradas para manejar las respuestas de Mercado Pago:

- **Éxito**: `https://tu-sitio.netlify.app/compra-exitosa`
- **Fallo**: `https://tu-sitio.netlify.app/compra-fallida`
- **Pendiente**: `https://tu-sitio.netlify.app/compra-fallida`

## Notas Importantes

- El archivo `netlify.toml` ya está configurado para manejar las rutas de React Router
- Asegúrate de que todas las variables de entorno estén configuradas correctamente
- Netlify reconstruirá automáticamente tu sitio cada vez que hagas push a la rama principal

## Solución de Problemas

### Si el sitio muestra "Page Not Found"
- Verifica que el archivo `netlify.toml` esté en la raíz del proyecto
- Asegúrate de que la configuración de redirects esté correcta

### Si Mercado Pago no redirige correctamente
- Verifica que la variable `BASE_URL` en la Edge Function esté actualizada
- Confirma que las rutas `/compra-exitosa` y `/compra-fallida` existan en tu aplicación

### Si hay errores de Supabase
- Verifica que las variables de entorno `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` estén configuradas en Netlify
- Reconstruye el sitio después de agregar las variables de entorno
