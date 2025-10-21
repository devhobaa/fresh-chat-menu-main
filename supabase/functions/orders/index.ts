import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const mongoUri = Deno.env.get('MONGODB_URI');
  if (!mongoUri) {
    return new Response(
      JSON.stringify({ error: 'MongoDB URI not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { action, order } = await req.json();
    
    // استخراج معلومات الاتصال من connection string
    const uri = new URL(mongoUri.replace('mongodb+srv://', 'https://'));
    const auth = uri.username + ':' + uri.password;
    const host = uri.hostname;
    
    // MongoDB Data API endpoint (تحتاج لتفعيله من Atlas Dashboard)
    const dataApiUrl = `https://data.mongodb-api.com/app/data-${host}/endpoint/data/v1`;
    
    const headers = {
      'Content-Type': 'application/json',
      'api-key': mongoUri, // أو استخدم API key منفصل
    };

    const dbName = 'altazaj_restaurant';
    const collectionName = 'orders';

    if (action === 'create') {
      // إنشاء طلب جديد
      const orderWithTimestamp = {
        ...order,
        createdAt: new Date().toISOString(),
        status: 'pending'
      };
      
      const response = await fetch(`${dataApiUrl}/action/insertOne`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          dataSource: 'Cluster0',
          database: dbName,
          collection: collectionName,
          document: orderWithTimestamp
        })
      });

      const result = await response.json();
      console.log('Order created:', result);

      return new Response(
        JSON.stringify({ 
          success: true, 
          orderId: result.insertedId,
          message: 'تم إنشاء الطلب بنجاح'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
      
    } else if (action === 'list') {
      // جلب جميع الطلبات
      const response = await fetch(`${dataApiUrl}/action/find`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          dataSource: 'Cluster0',
          database: dbName,
          collection: collectionName,
          sort: { createdAt: -1 },
          limit: 100
        })
      });

      const result = await response.json();
      const orders = result.documents || [];
      console.log(`Retrieved ${orders.length} orders`);

      return new Response(
        JSON.stringify({ success: true, orders }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
      
    } else if (action === 'update_status') {
      // تحديث حالة الطلب
      const { orderId, status } = order;
      
      const response = await fetch(`${dataApiUrl}/action/updateOne`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          dataSource: 'Cluster0',
          database: dbName,
          collection: collectionName,
          filter: { _id: { $oid: orderId } },
          update: { 
            $set: { 
              status, 
              updatedAt: new Date().toISOString() 
            } 
          }
        })
      });

      const result = await response.json();

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'تم تحديث حالة الطلب'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in orders function:', error);
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ غير متوقع';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: 'حدث خطأ في معالجة الطلب'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});