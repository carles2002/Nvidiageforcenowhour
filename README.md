# Control de horas para Nvidia GeForce NOW

Aplicación web estática para controlar las horas mensuales restantes de Nvidia GeForce NOW.

## ¿Qué hace?

- Permite introducir las horas restantes que muestra Nvidia.
- Registra las horas jugadas por día.
- Calcula automáticamente las horas restantes después de cada registro diario.
- Reserva 8 horas para cada sábado y domingo restante del mes.
- Reparte el resto de horas de forma equitativa entre los días laborables que quedan.
- Guarda los datos en el navegador mediante `localStorage`.

## Cómo usarla desde GitHub

Puedes abrir `index.html` directamente en tu navegador tras clonar o descargar el repositorio.

```bash
python3 -m http.server 8000
```

Después entra en <http://localhost:8000>.

## Lógica de planificación

La app parte de un límite mensual de 100 horas. Cuando introduces el saldo restante real que te muestra Nvidia, el planificador:

1. Cuenta los días que quedan desde la fecha seleccionada hasta final de mes.
2. Detecta sábados y domingos y les asigna una recomendación de 8 h/día.
3. Reserva como máximo las horas disponibles para esos fines de semana.
4. Divide las horas sobrantes entre los días laborables restantes.
5. Recalcula el saldo real restando las horas jugadas que registres cada día.
