# Tu Socia! — Alta de clientes con WhatsApp Cloud API

Este es el flujo recomendado para los primeros clientes reales usando la vía oficial de Meta.

## Objetivo

Conectar cada cliente a Tu Socia! mediante WhatsApp Cloud API, evitando dependencias de WhatsApp Web o Baileys.

## Datos necesarios por cliente

Cada cliente necesita una ficha con estos campos:

```json
{
  "provider": "meta-cloud",
  "clientId": "cliente-001",
  "displayName": "Nombre del negocio",
  "graphApiVersion": "v22.0",
  "wabaId": "...",
  "phoneNumberId": "...",
  "accessToken": "...",
  "verifyToken": "..."
}
```

## Significado de las siglas

- API: Application Programming Interface, interfaz para que sistemas se comuniquen entre sí.
- WABA: WhatsApp Business Account, cuenta empresarial de WhatsApp dentro de Meta.
- ID: Identifier, identificador único.

## Flujo manual para los tres primeros clientes

### 1. Crear o revisar Business Manager

El cliente debe tener un portfolio empresarial de Meta.

### 2. Crear o seleccionar WABA

Dentro del entorno de Meta, se selecciona o crea la cuenta de WhatsApp Business Platform.

### 3. Añadir número de teléfono

Recomendación fuerte: usar un número dedicado al agente.

No prometer al cliente que conservará exactamente el mismo uso de su WhatsApp actual si lo migra a API.

### 4. Obtener `phoneNumberId`

Este identificador es el que se usa para enviar mensajes.

### 5. Obtener token

Para pruebas se puede usar token temporal.

Para cliente real hace falta token estable de sistema/negocio con permisos adecuados.

### 6. Configurar webhook

Meta enviará eventos a nuestro backend.

Ruta recomendada futura:

```txt
POST /api/webhooks/whatsapp/meta
GET  /api/webhooks/whatsapp/meta
```

El `GET` sirve para verificar el webhook con el `verifyToken`.

### 7. Probar envío

Desde backend:

```ts
const provider = getWhatsAppProvider('meta-cloud');
await provider.sendText(config, {
  to: '346XXXXXXXX',
  text: 'Hola, soy tu agente de Tu Socia!'
});
```

## Diseño recomendado en dashboard

En la ficha de cliente:

```txt
Conexión WhatsApp
Proveedor: Meta Cloud API
Estado: conectado / error / no configurado
WABA ID
Phone Number ID
Botón: Probar conexión
Botón: Enviar mensaje de prueba
Botón: Activar agente
```

## Estado actual del repo

Ya existe la abstracción inicial:

```txt
server/services/whatsapp/types.ts
server/services/whatsapp/metaCloudProvider.ts
server/services/whatsapp/registry.ts
```

Pendiente:

- Guardar configuración por cliente.
- Añadir endpoints de cliente.
- Añadir webhook de Meta.
- Añadir UI en dashboard.
- Cifrar tokens en almacenamiento real antes de producción.

## Regla de seguridad

No guardar tokens reales en Git.

Para desarrollo local, usar `.env`.

Para producción, usar variables de entorno o almacén seguro de secretos.
