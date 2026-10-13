# Mecánico Chat · Prueba

Página web simple para probar la identificación de motos:

- **Foto:** tomas una foto del chasis, del número de motor o de la matrícula. El celular lee el texto (OCR) y busca solo.
- **Manual:** escribes el chasis o el número de motor.
- **Resultado:** te muestra todo lo que hay en la base: marca, modelo, cilindraje, transmisión, tipo, estado, VIN genérico, representante, año probable y qué otras marcas usan el mismo chasis.

Fuente: Listado de Vehículos Homologados de la ANT, 24-ago-2026 (información pública). La foto se procesa en el celular: no se sube a ningún servidor.

## Archivos

| Archivo | Qué es |
|---|---|
| `index.html` | La página |
| `core.js` | La búsqueda (la misma lógica que la API v1) |
| `data/motos.js` | 3,154 motos homologadas de la ANT |

## Publicarlo gratis en GitHub Pages (10 minutos, sin programar)

1. Entra a **github.com** y crea una cuenta gratis (o inicia sesión).
2. Arriba a la derecha, toca **+** y luego **New repository**.
3. En **Repository name** escribe `mecanico-chat-prueba`. Elige **Public** y no marques nada más. Toca **Create repository**.
4. En la página del repo vacío, toca el link **uploading an existing file**.
5. Descomprime el zip en tu computadora. Abre la carpeta `mecanico-chat-prueba` y arrastra **todo su contenido** a la página: `index.html`, `core.js`, `README.md` y la carpeta `data`. Toca **Commit changes**.
   - Revisa que en el repo aparezca la carpeta `data` con `motos.js` adentro.
6. En el repo, entra a **Settings** y luego a **Pages** (menú de la izquierda).
   - En **Source** elige **Deploy from a branch**.
   - En **Branch** elige **main** y la carpeta **/ (root)**. Toca **Save**.
7. Espera 1 a 2 minutos y recarga la página. Arriba aparece *"Your site is live at https://TU-USUARIO.github.io/mecanico-chat-prueba/"*.
8. Abre ese link en el celular, toca **Tomar foto** y permite la cámara.
9. Manda el link a tu socio.

**Para actualizar:** en el repo toca **Add file** y luego **Upload files**. Arrastra el archivo nuevo con el mismo nombre y toca **Commit changes**. En 1 minuto se actualiza.

**Ojo:**
- Un repo público lo puede ver cualquiera que tenga el link. Los datos son públicos de la ANT y aquí no hay nada sensible.
- Si lo quieres privado: GitHub Pages en repos privados es de pago. Gratis, puedes conectar el repo privado a Netlify o Cloudflare Pages.

## Probar en la computadora

Abre `index.html` con doble clic. La búsqueda manual funciona igual. La cámara del celular necesita el link `https` de GitHub Pages.

## Chasis y motores de prueba

| Escribe | Debería salir |
|---|---|
| `LHJYCLLA1RB345678` | Dukare DK200, Daytona DY200 Shark II y Thunder TRX 200R: misma plataforma |
| `LXYPCKL01R4567890` | Shineray XY150-15 y otros modelos Shineray de 150 cc |
| `LEAPCK031R4567890` | Daytona DY150 Workforce |
| `8LMM165N2RMA34567` | Thunder Mamut M3, ensamblada en Ecuador (8L = Ecuador) |
| `162FMJ12345678` | Motor de 1 cilindro, diámetro probable 62 mm |

## Límites de la prueba

- El OCR gratis lee bien la matrícula y los números impresos. Los números estampados en metal, sucios u oxidados pueden salir con errores: corrígelos en la casilla de texto.
- Un mismo chasis puede corresponder a varios modelos o marcas. La página los muestra todos para que el cliente elija.
- El año sale del carácter 10 del chasis y el diámetro del cilindro sale del código de motor. Ambos son "probables".
