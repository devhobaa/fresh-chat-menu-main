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
    <div className="min-h-screen bg-background p-4 flex items-center justify-center" dir="rtl">
      <Card className="w-full max-w-2xl" id="invoice">
        <CardHeader>
          <CardTitle className="text-center text-2xl">تتبع الطلب - الفاتورة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {order.status === "Cancelled" ? (
            <div className="text-center text-red-500 font-bold text-xl">
              تم إلغاء هذا الطلب.
            </div>
          ) : (
            <div className="print:hidden">
              <div className="flex justify-between items-center mb-4">
                <span className={`font-bold ${statusSteps[order.status] >= 1 ? 'text-primary' : ''}`}>قيد الانتظار</span>
                <span className={`font-bold ${statusSteps[order.status] >= 2 ? 'text-primary' : ''}`}>قيد التحضير</span>
                <span className={`font-bold ${statusSteps[order.status] >= 3 ? 'text-primary' : ''}`}>تم التوصيل</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          <div className="border-t pt-6">
            <h3 className="font-bold text-lg mb-4">تفاصيل الفاتورة:</h3>
            <div className="space-y-2">
              <p><strong>رقم الطلب:</strong> {order._id}</p>
              <p><strong>الاسم:</strong> {order.name}</p>
              <p><strong>رقم الهاتف:</strong> {order.phone}</p>
              {order.address && <p><strong>العنوان:</strong> {order.address}</p>}
              <p><strong>تاريخ الطلب:</strong> {new Date(order.createdAt).toLocaleString('ar-EG')}</p>
            </div>
          </div>

          <div className="border-t pt-6">
            <h4 className="font-bold mb-2">الأصناف المطلوبة:</h4>
            <ul className="list-disc list-inside space-y-1">
              {order.items.map((item, index) => (
                <li key={index}>{item.quantity} x {item.name}</li>
              ))}
            </ul>
          </div>

          <div className="border-t pt-6 text-center">
            <p className="font-bold text-xl">الإجمالي: {order.totalPrice} جنيه</p>
          </div>
          
          <div className="text-center pt-6 print:hidden">
            <Button onClick={() => window.print()}>طباعة الفاتورة</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderTracking;