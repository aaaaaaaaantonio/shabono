# Shabono · Gestión interna (demo)

Demo de la app de gestión interna de **Shabono by Nelson Méndez** (Puerto Ayacucho, Amazonas), pensada para enseñarla en un pitch. Es solo para uso interno del restaurante: **no es facturación fiscal**.

Todos los datos son **de ejemplo**: ficticios pero verosímiles. Un aviso fijo lo recuerda en cada pantalla. Solo los nombres de los platos vienen de la carta pública de la web.

El sistema visual sigue [`design.md`](design.md), que manda en todo lo visual. La web está en la rama `claude/shabono-restaurant-website-z2twv0`.

## Qué hace

| Sección | Contenido |
|---|---|
| Inicio | Alertas ordenadas por gravedad (agotados, vencidos, platos no disponibles, cuentas vencidas, bajo mínimo, vencen esta semana, margen bajo, compras por recibir), resumen del mes y acciones rápidas. |
| Inventario | Existencias, mínimo, lotes con fecha de vencimiento, movimientos, ajustes (consumo, merma o conteo) y baja de lotes vencidos. |
| Compras y proveedores | Pedidos y recepción (crea los lotes, guarda el precio y anota el gasto o la cuenta por pagar), proveedores (se pueden agregar más) e historial de precios. |
| Carta y precios | Costo de cada plato según su ficha técnica y el último precio de cada insumo, frente a su precio de venta; margen, objetivo de costo y simulador de precio. |
| Finanzas | Resumen del mes, ingresos (cierre diario en Bs. y divisas), gastos y cuentas por pagar. |

**Doble moneda.** Euros y bolívares con la tasa euro del BCV, que se escribe a mano. La tasa de ejemplo es la del 20/10/2026 (€ 1 = Bs. 988,97203073), dada por el cliente. Cada registro guarda su moneda, su tasa y el equivalente. Las tasas de los registros anteriores son ficticias.

**Funciones.** Se entra eligiendo el rol, sin contraseñas:
- **Administración**: todo.
- **Chef jefe**: inventario, compras, carta y precios; finanzas solo en lectura.
- **Equipo de cocina**: existencias, compras por recibir y fichas técnicas, sin precios.

## Estructura

```
index.html          Página única: iconos (Lucide), petroglifos y meandro copiados de la web
tokens.css          Copia literal del bloque «Tokens» de design.md
app.css             Estilos de la app (sin animaciones decorativas ni degradados)
js/formato.js       Cifras 1.234,56, «€ 1.234,56», «Bs. 45.678,90» y fechas dd/mm/aaaa
js/almacen.js       Guarda en el navegador (localStorage); si no puede, funciona en memoria
js/semilla.js       Datos de ejemplo, con fechas relativas al día en que se abre la demo
js/calculos.js      Estados, existencias, costos, márgenes, totales y alertas
js/ui.js            Iconos, estados, dinero, diálogos, avisos, campos y gráficos
js/vistas/*.js      Acceso, Inicio, Inventario, Compras, Carta y Finanzas
js/app.js           Rutas (#/seccion), marco, funciones y permisos
img/, fonts/        Logos, favicon y fuentes de la web (con sus licencias)
licencias/          Licencia de Lucide (ISC)
pruebas/            Pruebas (no se publican)
herramientas/       empaquetar.py: zip para Cloudflare y vista previa en un archivo
```

Sin frameworks ni proceso de compilación.

## Probar en local

```
python3 -m http.server 8000
```

Y abrir `http://localhost:8000`. Los datos quedan en ese navegador. Para empezar de cero: menú del rol → «Restablecer datos de ejemplo».

## Publicar en Cloudflare Pages

1. `python3 herramientas/empaquetar.py` crea `dist/shabono-gestion.zip` y `dist/vista-previa.html`.
2. En Cloudflare: **Workers & Pages → Crear → Pages → Subir recursos** y subir el zip.

El sitio lleva `noindex` y `robots.txt` para que no lo indexen los buscadores.

## Pruebas

Con [Playwright](https://playwright.dev) instalado y la demo servida en `http://127.0.0.1:8765`:

```
cd pruebas && npm install            # instala axe-core
node datos.js                        # coherencia de los datos de ejemplo
node revisar.js                      # axe (WCAG 2.2 AA) y desbordamiento lateral de 320 a 2560 px, en las tres funciones
node flujos.js                       # compras, recepción, ajustes, tasa, precios, pagos, deshacer, permisos
node capturas.js                     # capturas para revisar a ojo
```

## Fuera de la demo

- Importar los datos reales desde Excel (queda para después).
- Modo sin conexión con sincronización entre aparatos (fase real).
- Inventario descontado por ventas: necesitaría las ventas por plato.

## Créditos

- Iconos: [Lucide](https://lucide.dev), licencia ISC.
- Fuentes: Inter y Playfair Display, licencia SIL OFL 1.1.
- Dibujos inspirados en los petroglifos del Cerro Pintado, Puerto Ayacucho, copiados de la web.
