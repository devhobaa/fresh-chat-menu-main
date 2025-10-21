import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Trash2 } from "lucide-react";

interface Order {
  _id: string;
  name: string;
  phone: string;
  address?: string;
  items: { name: string; quantity: number }[];
  totalPrice: number;
  createdAt: string;
  status: string;
}

interface MenuItem {
  _id: string;
  name: string;
  price: number;
  category: string;
  image?: string;
}

const Admin = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [newItem, setNewItem] = useState<{ name: string; price: string; category: string; image?: string }>({ name: '', price: '', category: '', image: '' });
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchOrders = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/orders");
      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }
      const data = await response.json();
      setOrders(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchMenuItems = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/menu-items");
      if (!response.ok) {
        throw new Error("Failed to fetch menu items");
      }
      const data = await response.json();
      setMenuItems(data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchMenuItems();
    const interval = setInterval(fetchOrders, 5000); // Fetch every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (orderId: string, status: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update order status');
      }

      toast({ title: "نجاح", description: "تم تحديث حالة الطلب بنجاح." });
      fetchOrders(); // Refresh orders after update
    } catch (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    }
  };

  const handleCreateOrUpdateMenuItem = async () => {
    if (!newItem.name || !newItem.price || !newItem.category) {
      toast({ title: "خطأ", description: "يرجى ملء جميع الحقول.", variant: "destructive" });
      return;
    }

    const method = editingItem ? 'PUT' : 'POST';
    const url = editingItem
      ? `http://localhost:5000/api/menu-items/${editingItem._id}`
      : 'http://localhost:5000/api/menu-items';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newItem),
      });

      if (!response.ok) {
        throw new Error(editingItem ? 'Failed to update menu item' : 'Failed to create menu item');
      }

      toast({ title: "نجاح", description: `تم ${editingItem ? 'تحديث' : 'إنشاء'} المنتج بنجاح.` });
      fetchMenuItems();
      setIsDialogOpen(false);
      setNewItem({ name: '', price: '', category: '', image: null });
      setEditingItem(null);
    } catch (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteMenuItem = async (itemId: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/menu-items/${itemId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete menu item');
      }

      toast({ title: "نجاح", description: "تم حذف المنتج بنجاح." });
      fetchMenuItems();
    } catch (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    }
  };

  const openEditDialog = (item: MenuItem) => {
    setEditingItem(item);
    setNewItem({ name: item.name, price: item.price.toString(), category: item.category, image: item.image || '' });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingItem(null);
    setNewItem({ name: '', price: '', category: '', image: '' });
    setIsDialogOpen(true);
  };

  const handleBulkUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const items = JSON.parse(e.target?.result as string);
        const response = await fetch('http://localhost:5000/api/menu-items/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(items),
        });

        if (!response.ok) {
          throw new Error('Failed to upload bulk items');
        }

        toast({ title: "نجاح", description: "تم رفع المنتجات بنجاح." });
        fetchMenuItems();
      } catch (error) {
        toast({ title: "خطأ", description: "فشل في تحليل ملف JSON أو رفعه.", variant: "destructive" });
      }
    };
    reader.readAsText(file);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-500';
      case 'Preparing': return 'bg-blue-500';
      case 'Delivered': return 'bg-green-500';
      case 'Cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'Pending': return 'قيد الانتظار';
      case 'Preparing': return 'قيد التحضير';
      case 'Delivered': return 'تم التوصيل';
      case 'Cancelled': return 'ملغي';
      default: return status;
    }
  };

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div className="min-h-screen bg-background p-4 grid grid-cols-1 lg:grid-cols-2 gap-4" dir="rtl">
      <Card className="w-full mx-auto">
        <CardHeader>
          <CardTitle>الطلبات الواردة</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[70vh]">
            <div className="space-y-4">
              {orders.length === 0 ? (
                <p>لا توجد طلبات حالياً.</p>
              ) : (
                orders.map((order) => (
                  <Card key={order._id}>
                    <CardHeader>
                      <CardTitle className="flex justify-between items-center">
                        <span>طلب من: {order.name}</span>
                        <Badge className={getStatusColor(order.status)}>{getStatusText(order.status)}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p><strong>رقم الهاتف:</strong> {order.phone}</p>
                      {order.address && <p><strong>العنوان:</strong> {order.address}</p>}
                      <p><strong>إجمالي السعر:</strong> {order.totalPrice} جنيه</p>
                      <h4 className="font-bold mt-2">الأصناف:</h4>
                      <ul>
                        {order.items.map((item, index) => (
                          <li key={index}>{item.quantity} x {item.name}</li>
                        ))}
                      </ul>
                      <div className="flex gap-2 pt-4">
                        {order.status === 'Pending' && (
                          <Button size="sm" onClick={() => handleUpdateStatus(order._id, 'Preparing')}>بدء التحضير</Button>
                        )}
                        {order.status === 'Preparing' && (
                          <Button size="sm" onClick={() => handleUpdateStatus(order._id, 'Delivered')}>تم التوصيل</Button>
                        )}
                        {order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                            <Button size="sm" variant="destructive" onClick={() => handleUpdateStatus(order._id, 'Cancelled')}>إلغاء الطلب</Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card className="w-full mx-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>إدارة المنتجات</CardTitle>
          <div className="flex gap-2">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreateDialog}>إضافة منتج جديد</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingItem ? 'تعديل المنتج' : 'إضافة منتج جديد'}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">الاسم</Label>
                    <Input id="name" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="price" className="text-right">السعر</Label>
                    <Input id="price" type="number" value={newItem.price} onChange={(e) => setNewItem({ ...newItem, price: e.target.value })} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="category" className="text-right">الفئة</Label>
                    <Input id="category" value={newItem.category} onChange={(e) => setNewItem({ ...newItem, category: e.target.value })} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="image" className="text-right">رابط الصورة</Label>
                    <Input id="image" value={newItem.image} onChange={(e) => setNewItem({ ...newItem, image: e.target.value })} className="col-span-3" />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">إلغاء</Button>
                  </DialogClose>
                  <Button onClick={handleCreateOrUpdateMenuItem}>{editingItem ? 'حفظ التغييرات' : 'إضافة'}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Input type="file" accept=".json" onChange={handleBulkUpload} className="hidden" id="bulk-upload-input" />
            <Button asChild>
              <Label htmlFor="bulk-upload-input">رفع ملف JSON</Label>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[70vh]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الصورة</TableHead>
                  <TableHead>الاسم</TableHead>
                  <TableHead>الفئة</TableHead>
                  <TableHead>السعر</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {menuItems.length > 0 ? (
                  menuItems.map((item) => (
                    <TableRow key={item._id}>
                      <TableCell>
                        {item.image && <img src={item.image} alt={item.name} className="h-16 w-16 object-cover rounded-md" />}
                      </TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>{item.price} جنيه</TableCell>
                      <TableCell className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteMenuItem(item._id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      لا توجد منتجات.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default Admin;