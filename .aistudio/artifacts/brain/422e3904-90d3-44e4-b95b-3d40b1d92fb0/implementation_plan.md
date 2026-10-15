# Implementación de Correos Automáticos en Aliclip.site con MailerSend y Webhook Gratuito

Plan integral para activar el envío de correos automáticos en **Aliclip.site** desde el remitente oficial verificado **soporte@aliclip.site** usando **MailerSend**, manteniendo el costo en $0 USD y sin exigir facturación de Firebase Blaze. Cubre bienvenida al registrarse, despacho de credenciales/productos (entrega mixta) y alertas al administrador ante nuevas solicitudes.

### User Review & Critical Decisions

> [!IMPORTANT]
> **Decisiones confirmadas en la fase de consulta:**
> 1. **Tipos de correos activados:** 
>    - Correo de bienvenida inmediata al registrarse (Email/Password y Google Sign-In).
>    - Envío oficial de credenciales y enlaces de acceso para compras confirmadas (modalidad mixta: cuentas streaming con PIN/perfil y recursos digitales con links directos).
>    - Notificación instantánea al administrador (`soporte@aliclip.site`) cuando un cliente envía una nueva solicitud de compra o sube comprobante.
> 2. **Canal de despacho seguro y gratuito:** Webhook de automatización externo gratuito (Make.com, con 1,000 operaciones/mes $0 USD sin tarjeta de crédito) que recibe el payload cifrado/sanitizado desde la web y ejecuta el envío mediante la API de MailerSend. Además, soporte en `server.ts` para entornos Node.js.
> 3. **Remitente y dominio:** Oficialmente verificado `soporte@aliclip.site` con DKIM/SPF en MailerSend.

---

### 1. Overview & Core Concept

- **Qué hace:** Automatiza la comunicación por correo electrónico de Aliclip.site en los 3 puntos de contacto críticos del ciclo de vida del cliente: bienvenida al crear cuenta, entrega oficial de productos/credenciales tras confirmación de pago (entrega mixta) y aviso interno al soporte de la tienda.
- **Audiencia objetivo:** Clientes de Aliclip.site que adquieren cuentas de streaming, cursos, recursos y herramientas, así como el equipo de soporte (`soporte@aliclip.site`) para acelerar la validación de pedidos.
- **Valor clave:** Cero costos de infraestructura (Cloudflare Pages free + Firebase Spark free + Make free + MailerSend 3,000 emails/mes free), entrega instantánea de credenciales con comprobante digital, y total seguridad al no exponer la API key de MailerSend en el código cliente.

---

### 2. User Experience & Visual Design

#### A. Flujos de Usuario Principales

1. **Flujo de Registro (Cliente):**
   - El cliente se registra con Correo/Contraseña o con su cuenta de Google en `MyPurchasesModal`.
   - Se muestra toast de éxito y se despacha en segundo plano el payload de bienvenida.
   - El cliente recibe un correo HTML responsivo con bienvenida personalizada, código de cliente y enlace de acceso directo al panel "Mis Compras".

2. **Flujo de Compra y Solicitud (Cliente -> Admin):**
   - El cliente completa el formulario en `BuyModal` y envía su comprobante de pago.
   - Se despacha una alerta automática al correo `soporte@aliclip.site` con los datos del pedido (producto, plan, monto, WhatsApp del cliente y link al comprobante).
   - El cliente recibe un aviso en pantalla y un botón de WhatsApp preformateado.

3. **Flujo de Despacho de Credenciales (Admin -> Cliente - Entrega Mixta):**
   - El administrador confirma el pago desde `AdminSalesTab` o `AdminCredentialsModal` e ingresa o verifica las credenciales (Usuario, PIN, Perfil, Link de Drive, Instrucciones).
   - Se dispara la notificación automática:
     - El cliente recibe en su bandeja de entrada (`clientEmail`) un correo oficial con diseño oscuro/morado característico de Aliclip, credenciales en una caja de seguridad destacada, fecha de vigencia y links de soporte.
     - En el panel admin se muestra confirmación visual ("Correo despachado con éxito").

#### B. Identidad Visual de las Plantillas de Correo (HTML)

- **Estilo:** Dark/Modern UI consistente con la web de Aliclip.site (fondo `#0b0f19`, tarjeta `#151c2e`, bordes `#263352`, acentos `#6366f1` Índigo y `#ec4899` Rosa Neón).
- **Tipografía:** Sistema sans-serif limpio (`system-ui`, `-apple-system`, `Inter`, `Segoe UI`).
- **Jerarquía:** Sin "pill badges" estáticos decorativos excesivos; tipografía sobria con separadores discretos, caja de credenciales con tipografía monoespaciada para PINs y contraseñas (`font-family: monospace`), y botón CTA claro y legible.
- **Canal de Soporte:** Pie de página siempre visible con `soporte@aliclip.site` y enlace directo a WhatsApp oficial `+51967693595`.

---

### 3. Key Product Decisions & Trade-Offs

- **Decisión 1: Webhook Externo Gratuito (Make.com) vs. Firebase Cloud Functions**
  - *Enfoque elegido:* Webhook de automatización Make.com (plan gratuito $0, 1,000 tareas/mes).
  - *Por qué:* Firebase Cloud Functions exige obligatoriamente cambiar el proyecto al plan **Blaze** (facturación con tarjeta de crédito). El usuario especificó explícitamente evitar servicios que exijan facturación y mantenerse en costo $0.
  - *Alternativas consideradas:*
    - *Llamar a MailerSend directamente desde el navegador (fetch client-side):* Descartado por seguridad crítica, ya que expondría el Token secreto de MailerSend en el código JavaScript público.
    - *Cloudflare Worker / Pages Function:* Excelente opción técnica que también dejaremos preparada como alternativa directa en el código de despacho.

- **Decisión 2: Soporte de Entrega Mixta de Productos**
  - *Enfoque elegido:* Payload flexible en `notificationService.ts` que discrimina según el tipo de producto:
    - *Productos digitales / Cursos / Recursos:* Incluye enlace de Google Drive / descarga y contraseña de descompresión si aplica.
    - *Membresías / Streaming:* Incluye correo de acceso, PIN de pantalla, nombre de perfil asignado, vigencia y reglas de uso.
  - *Por qué:* Evita confusiones para el cliente y adapta el contenido del correo a lo que realmente adquirió.

- **Decisión 3: Configuración del Webhook en el Panel de Administración**
  - *Enfoque elegido:* Permitir ingresar y editar la URL del Webhook tanto mediante variable de entorno (`VITE_MAKE_WEBHOOK_URL` / `MAKE_WEBHOOK_URL`) como desde la pestaña de Configuración en el panel de Administración de Aliclip.
  - *Por qué:* Si el usuario cambia o regenera su Webhook en Make.com, no necesita recompilar ni redeplegar la web; se guarda en Firestore / StoreSettings al instante.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ALICLIP.SITE FRONTEND                           │
│  (React 19 + Tailwind + Vite alojado en Cloudflare Pages)               │
│                                                                        │
│   ┌────────────────────┐   ┌─────────────────┐   ┌─────────────────┐  │
│   │   MyPurchasesModal │   │    BuyModal     │   │ AdminCredentials│  │
│   │   (Registro Auth)  │   │  (Nuevo Pedido) │   │ (Despacho Venta)│  │
│   └─────────┬──────────┘   └────────┬────────┘   └────────┬────────┘  │
│             │                       │                     │           │
│             └───────────────────────┼─────────────────────┘           │
│                                     ▼                                 │
│                         notificationService.ts                        │
│          (Construye payload normalizado con soporte@aliclip.site)      │
└─────────────────────────────────────┬──────────────────────────────────┘
                                      │
              POST HTTPS (Payload JSON estructurado + Sanitización)
                                      │
                                      ▼
┌────────────────────────────────────────────────────────────────────────┐
│            WEBHOOK DE AUTOMATIZACIÓN (Make.com - Plan $0)              │
│                                                                        │
│   1. Módulo Webhook Receptor:                                          │
│      Recibe { eventType, recipientEmail, recipientName, details... }   │
│                                                                        │
│   2. Router por tipo de evento:                                        │
│      ├─ "welcome"       -> Plantilla Correo Bienvenida                 │
│      ├─ "credentials"   -> Plantilla Despacho de Credenciales/Links    │
│      └─ "admin_alert"   -> Alerta interna a soporte@aliclip.site       │
│                                                                        │
│   3. Módulo MailerSend (API Oficial):                                  │
│      From: AliClip Store <soporte@aliclip.site>                        │
│      To: recipientEmail                                                │
│      Subject & HTML Body generado                                      │
└─────────────────────────────────────┬──────────────────────────────────┘
                                      │
                                      ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        MAILERSEND DELIVERY                             │
│   • Dominio verificado: aliclip.site (SPF / DKIM / CNAME)              │
│   • Entrega directa en Inbox de Gmail / Outlook / Yahoo                │
└────────────────────────────────────────────────────────────────────────┘
```

#### Entidades de Datos del Payload de Correo

```typescript
export type EmailEventType = 'welcome' | 'sale_credentials' | 'admin_order_alert';

export interface AutomatedEmailPayload {
  eventType: EmailEventType;
  storeName: string;
  senderEmail: 'soporte@aliclip.site';
  supportWhatsApp: string;
  timestamp: string;
  // Destinatario
  recipientEmail: string;
  recipientName: string;
  recipientPhone?: string;
  // Datos específicos para credenciales / entrega mixta
  orderDetails?: {
    orderId: string;
    productName: string;
    planName: string;
    accountType?: string;
    expirationDate?: string;
    price?: number;
    credentials?: {
      email?: string;
      pin?: string;
      profileName?: string;
      driveLink?: string;
      instructions?: string;
    };
  };
}
```

---

### 5. Pasos Concretos de Implementación

1. **Paso 1: Actualización de `notificationService.ts`**
   - Unificar los disparadores de correo para que envíen directamente al Webhook configurado (priorizando la URL definida en `StoreSettings` o variables de entorno, con fallback al endpoint de `server.ts` para desarrollo local).
   - Agregar la función `sendAdminOrderAlertNotification` para notificar al administrador ante cada nuevo pedido registrado en `BuyModal`.
   - Incorporar plantillas HTML completas y formateadas listas para copiar y pegar en Make.com o en MailerSend.

2. **Paso 2: Conexión en `BuyModal.tsx`**
   - Al completar la solicitud de compra, invocar `sendAdminOrderAlertNotification` para enviar a `soporte@aliclip.site` el aviso del pedido con el link al comprobante y datos del cliente.

3. **Paso 3: Verificación y robustecimiento en `AdminCredentialsModal.tsx` y `AdminSalesTab.tsx`**
   - Asegurar que al guardar credenciales o activar ventas, se dispare el evento con la bandera de éxito y notificación al cliente mediante `sendSaleCredentialsNotification`.

4. **Paso 4: Campo de configuración en el Panel de Administración**
   - Añadir en la pestaña de Configuración o Textos del panel Admin un campo sencillo para visualizar y actualizar la URL del Webhook de Make.com (`webhookUrl`) sin necesidad de tocar código.

5. **Paso 5: Guía clara para el usuario**
   - Entrega del manual paso a paso con capturas o instrucciones para configurar el escenario gratuito en Make.com con MailerSend en menos de 5 minutos, garantizando 100% de costo cero.
