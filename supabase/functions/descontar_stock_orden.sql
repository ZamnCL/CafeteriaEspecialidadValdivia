-- Función mejorada para descontar stock solo cuando el pago está aprobado
CREATE OR REPLACE FUNCTION descontar_stock_orden(id_orden_input TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  item RECORD;
  orden_estado TEXT;
  stock_actual INTEGER;
BEGIN
  -- 1. Verificar que la orden existe y está en estado 'Pagado'
  SELECT estado INTO orden_estado
  FROM ordenes
  WHERE id_orden = id_orden_input;

  IF orden_estado IS NULL THEN
    RAISE EXCEPTION 'Orden % no encontrada', id_orden_input;
  END IF;

  IF orden_estado != 'Pagado' THEN
    RAISE EXCEPTION 'No se puede descontar stock. La orden % está en estado: %', id_orden_input, orden_estado;
  END IF;

  -- 2. Recorrer cada producto de la orden
  FOR item IN
    SELECT *
    FROM detalles_orden
    WHERE id_orden = id_orden_input
  LOOP
    -- Obtener el stock actual
    SELECT stock INTO stock_actual
    FROM formatos
    WHERE id_formato = item.id_formato;

    -- 3. Solo descontar si NO es stock infinito (preparaciones tienen stock > 9000)
    IF stock_actual IS NOT NULL AND stock_actual < 9000 THEN
      -- 4. Verificar que hay suficiente stock
      IF stock_actual < item.cantidad THEN
        RAISE EXCEPTION 'Stock insuficiente para formato %. Disponible: %, Requerido: %',
          item.id_formato, stock_actual, item.cantidad;
      END IF;

      -- 5. Descontar el stock
      UPDATE formatos
      SET stock = stock - item.cantidad
      WHERE id_formato = item.id_formato;

      RAISE NOTICE 'Stock descontado: Formato %, Cantidad: %', item.id_formato, item.cantidad;
    ELSE
      RAISE NOTICE 'Stock infinito detectado para formato %. No se descuenta.', item.id_formato;
    END IF;
  END LOOP;

  RAISE NOTICE 'Stock descontado exitosamente para orden %', id_orden_input;
END;
$function$;
