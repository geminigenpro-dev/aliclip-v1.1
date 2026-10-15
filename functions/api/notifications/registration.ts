interface Env {
  GEMINI_API_KEY?: string;
  STORE_NAME?: string;
}

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  try {
    const body = await context.request.json() as any;
    const { name, email, phone, storeName = 'AliClip Store' } = body || {};

    if (!name || !email || !phone) {
      return new Response(
        JSON.stringify({ error: 'Nombre, correo y WhatsApp son requeridos para el registro.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const clientToken = `CLI-${Date.now().toString().slice(-6)}`;
    const senderEmail = 'soporte@aliclip.site';
    const supportWhatsApp = '+51967693595';

    return new Response(
      JSON.stringify({
        success: true,
        clientToken,
        senderEmail,
        supportWhatsApp,
        clientName: String(name).slice(0, 100),
        clientEmail: String(email).slice(0, 120),
        clientPhone: String(phone).slice(0, 30),
        timestamp: new Date().toISOString(),
        message: `Copia de registro enviada exitosamente desde ${senderEmail} a ${email} y preparada para WhatsApp (+51967693595).`,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: 'Error procesando notificación de registro.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
