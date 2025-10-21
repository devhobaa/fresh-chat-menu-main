import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

interface Order {
  _id: string;
  name: string;
  phone: string;
  address?: string;
  items: { name: string; quantity: number }[];
  totalPrice: number;
  status: string;
  createdAt: string;
}

const statusSteps = {
  "Pending": 1,
  "Preparing": 2,
  "Delivered": 3,
  "Cancelled": 0,
};

const OrderTracking = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/orders/${orderId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch order details");
        }
        const data = await response.json();
        setOrder(data);
        setProgress(statusSteps[data.status] * 33.33);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchOrder();
    const interval = setInterval(fetchOrder, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [orderId]);

  if (error) {
    return <div className="text-red-500 text-center p-8">Error: {error}</div>;
  }

  if (!order) {
    return <div className="text-center p-8">Loading order details...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-slate-100 p-4 flex items-center justify-center" dir="rtl">
      <Card className="w-full max-w-2xl shadow-2xl border-2 border-orange-100" id="invoice">
        <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardTitle className="text-center text-3xl font-bold">تتبع الطلب - الفاتورة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 p-8">
          {order.status === "Cancelled" ? (
            <div className="text-center bg-red-100 border-2 border-red-400 rounded-xl p-8">
              <p className="text-red-600 font-bold text-2xl">تم إلغاء هذا الطلب</p>
            </div>
          ) : (
            <div className="print:hidden bg-white rounded-xl p-6 shadow-md">
              <div className="flex justify-between items-center mb-6">
                <div className="text-center flex-1">
                  <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center ${statusSteps[order.status] >= 1 ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                    1
                  </div>
                  <span className={`font-bold text-sm ${statusSteps[order.status] >= 1 ? 'text-orange-600' : 'text-slate-400'}`}>قيد الانتظار</span>
                </div>
                <div className={`flex-1 h-1 ${statusSteps[order.status] >= 2 ? 'bg-orange-500' : 'bg-slate-200'}`}></div>
                <div className="text-center flex-1">
                  <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center ${statusSteps[order.status] >= 2 ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                    2
                  </div>
                  <span className={`font-bold text-sm ${statusSteps[order.status] >= 2 ? 'text-orange-600' : 'text-slate-400'}`}>قيد التحضير</span>
                </div>
                <div className={`flex-1 h-1 ${statusSteps[order.status] >= 3 ? 'bg-orange-500' : 'bg-slate-200'}`}></div>
                <div className="text-center flex-1">
                  <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center ${statusSteps[order.status] >= 3 ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                    3
                  </div>
                  <span className={`font-bold text-sm ${statusSteps[order.status] >= 3 ? 'text-green-600' : 'text-slate-400'}`}>تم التوصيل</span>
                </div>
              </div>
              <Progress value={progress} className="w-full h-3" />
            </div>
          )}

          <div className="border-t-2 border-orange-200 pt-6">
            <h3 className="font-bold text-2xl mb-4 text-slate-800">تفاصيل الفاتورة</h3>
            <div className="bg-gradient-to-r from-slate-50 to-orange-50 rounded-xl p-6 space-y-3">
              <p className="text-slate-700"><strong className="text-slate-900">رقم الطلب:</strong> <span className="font-mono text-orange-600">{order._id}</span></p>
              <p className="text-slate-700"><strong className="text-slate-900">الاسم:</strong> {order.name}</p>
              <p className="text-slate-700"><strong className="text-slate-900">رقم الهاتف:</strong> {order.phone}</p>
              {order.address && <p className="text-slate-700"><strong className="text-slate-900">العنوان:</strong> {order.address}</p>}
              <p className="text-slate-700"><strong className="text-slate-900">تاريخ الطلب:</strong> {new Date(order.createdAt).toLocaleString('ar-EG')}</p>
            </div>
          </div>

          <div className="border-t-2 border-orange-200 pt-6">
            <h4 className="font-bold text-xl mb-4 text-slate-800">الأصناف المطلوبة</h4>
            <div className="bg-white rounded-xl p-6 shadow-md">
              <ul className="space-y-3">
                {order.items.map((item, index) => (
                  <li key={index} className="flex justify-between items-center border-b border-slate-100 pb-2 last:border-0">
                    <span className="text-slate-700">{item.name}</span>
                    <span className="font-semibold text-orange-600">x {item.quantity}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t-2 border-orange-200 pt-6">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl p-6 text-center">
              <p className="text-sm mb-2">الإجمالي</p>
              <p className="font-bold text-4xl">{order.totalPrice} جنيه</p>
            </div>
          </div>

          <div className="text-center pt-6 print:hidden">
            <Button
              onClick={() => window.print()}
              className="bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-6 text-lg"
            >
              طباعة الفاتورة
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderTracking;