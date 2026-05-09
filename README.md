# Control de horas para Nvidia GeForce NOW

Aplicación web estática para controlar las horas mensuales restantes de Nvidia GeForce NOW.

## Cómo ejecutarla en móvil o PC

La app está preparada para funcionar con **un único archivo**:

1. Descarga o clona el repositorio.
2. Abre `index.html` directamente en el navegador del móvil o del ordenador.
3. No necesitas servidor, instalar dependencias ni conexión a internet.

También puedes servirla en local si lo prefieres:

```bash
python3 -m http.server 8000
```

Después entra en <http://localhost:8000>.

> Los archivos `app.js` y `styles.css` se conservan por compatibilidad con la versión anterior, pero la app actual no depende de ellos: todo el CSS y JavaScript necesario está dentro de `index.html`.

## ¿Qué hace?

- Permite introducir las horas restantes que muestra Nvidia.
- Registra las horas jugadas por día.
- Calcula automáticamente las horas restantes después de cada registro diario.
- Reserva 8 horas para cada sábado y domingo restante del mes.
- Reparte el resto de horas de forma equitativa entre los días laborables que quedan.
- Guarda los datos en el navegador mediante `localStorage`.
- Mantiene un historial local de saldos de Nvidia, con opciones para restaurar o borrar entradas anteriores.
- Permite borrar solo las horas jugadas o reiniciar todos los datos guardados.

## Lógica de planificación

La app parte de un límite mensual de 100 horas. Cuando introduces el saldo restante real que te muestra Nvidia, el planificador:

1. Cuenta los días que quedan desde la fecha seleccionada hasta final de mes.
2. Detecta sábados y domingos y les asigna una recomendación de 8 h/día.
3. Reserva como máximo las horas disponibles para esos fines de semana.
4. Divide las horas sobrantes entre los días laborables restantes.
5. Recalcula el saldo real restando las horas jugadas que registres cada día.
6. Guarda cada saldo introducido en un historial local para que puedas consultarlo, restaurarlo o borrarlo.
