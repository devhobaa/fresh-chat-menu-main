import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { Menu, ShoppingCart, Trash2, UserCog, LocateFixed } from "lucide-react";

interface MenuItem {
  _id: string;
  name: string;
  price: number;
  category: string;
  image?: string;
}

interface CartItem extends MenuItem {
  quantity: number;
}

const Index = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [menu, setMenu] = useState<{ category: string; items: MenuItem[] }[]>([]);
  const [customerInfo, setCustomerInfo] = useState({ name: "", phone: "", address: "" });
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);

  useEffect(() => {
    const storedOrderId = localStorage.getItem("lastOrderId");
    if (storedOrderId) {
      setLastOrderId(storedOrderId);
    }
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/menu-items");
      if (!response.ok) {
        throw new Error("Failed to fetch menu items");
      }
      const data: MenuItem[] = await response.json();
      
      // Group items by category
      const groupedMenu = data.reduce((acc, item) => {
        const category = acc.find(c => c.category === item.category);
        if (category) {
          category.items.push(item);
        } else {
          acc.push({ category: item.category, items: [item] });
        }
        return acc;
      }, [] as { category: string; items: MenuItem[] }[]);

      setMenu(groupedMenu);
    } catch (error) {
      console.error("Error fetching menu items:", error);
      toast({
        title: "خطأ",
        description: "فشل في جلب قائمة الطعام.",
        variant: "destructive",
      });
    }
  };

  const addToCart = (item: MenuItem) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((cartItem) => cartItem.name === item.name);
      if (existingItem) {
        return prevCart.map((cartItem) =>
          cartItem.name === item.name ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem
        );
      }
      return [...prevCart, { ...item, quantity: 1 }];
    });
    toast({
      title: "تمت الإضافة إلى السلة",
      description: `${item.name} أضيفت إلى سلة التسوق.`,
    });
  };

  const removeFromCart = (itemName: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.name !== itemName));
  };

  const updateQuantity = (itemName: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(itemName);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) => (item.name === itemName ? { ...item, quantity } : item))
    );
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleSendOrder = async () => {
    if (!customerInfo.name || !customerInfo.phone) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال الاسم ورقم الهاتف.",
        variant: "destructive",
      });
      return;
    }
    if (cart.length === 0) {
        toast({
            title: "خطأ",
            description: "سلة التسوق فارغة!",
            variant: "destructive",
        });
        return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...customerInfo,
          items: cart.map(({ name, quantity }) => ({ name, quantity })),
          totalPrice: total,
        }),
      });

      if (!response.ok) {
        throw new Error("فشل إرسال الطلب");
      }

      const newOrder = await response.json();

      toast({
        title: "تم إرسال الطلب بنجاح!",
        description: "سيتم توجيهك لصفحة تتبع الطلب.",
      });
      
      localStorage.setItem("lastOrderId", newOrder._id);
      setLastOrderId(newOrder._id);
      setCart([]);
      setCustomerInfo({ name: "", phone: "", address: "" });
      navigate(`/order/${newOrder._id}`);
    } catch (error) {
      console.error("Error sending order:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إرسال الطلب. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" dir="rtl">
      <Card className="w-full max-w-6xl shadow-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary via-accent to-primary text-primary-foreground">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">مطعم الطازج - طنطا</CardTitle>
            <div className="flex items-center gap-4">
                {lastOrderId && (
                  <Button
                    variant="secondary"
                    onClick={() => navigate(`/order/${lastOrderId}`)}
                    title="تتبع آخر طلب"
                  >
                    <LocateFixed className="ml-2 h-5 w-5" />
                    تتبع آخر طلب
                  </Button>
                )}
                <Button 
                    variant="secondary" 
                    size="icon"
                    onClick={() => navigate("/auth")}
                    title="لوحة تحكم الأدمن"
                >
                    <UserCog className="h-5 w-5" />
                </Button>
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="secondary">
                            <ShoppingCart className="ml-2 h-5 w-5" />
                            سلة التسوق ({cart.reduce((acc, item) => acc + item.quantity, 0)})
                        </Button>
                    </SheetTrigger>
                    <SheetContent className="w-[400px] sm:w-[540px]">
                        <SheetHeader>
                            <SheetTitle>سلة التسوق</SheetTitle>
                        </SheetHeader>
                        <div className="h-full flex flex-col">
                            <ScrollArea className="flex-grow p-4">
                                {cart.length === 0 ? (
                                    <p>سلة التسوق فارغة.</p>
                                ) : (
                                    cart.map((item) => (
                                        <div key={item.name} className="flex justify-between items-center mb-4">
                                            <div>
                                                <p className="font-semibold">{item.name}</p>
                                                <p className="text-sm text-muted-foreground">{item.price} جنيه</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={(e) => updateQuantity(item.name, parseInt(e.target.value))}
                                                    className="w-16"
                                                />
                                                <Button variant="destructive" size="icon" onClick={() => removeFromCart(item.name)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </ScrollArea>
                            <div className="p-4 border-t">
                                <div className="space-y-4">
                                    <div className="flex justify-between font-bold text-lg">
                                        <span>الإجمالي</span>
                                        <span>{total} جنيه</span>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="name">الاسم</Label>
                                        <Input id="name" placeholder="اسمك" value={customerInfo.name} onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} />
                                        <Label htmlFor="phone">رقم الهاتف</Label>
                                        <Input id="phone" placeholder="رقم هاتفك" value={customerInfo.phone} onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})} />
                                        <Label htmlFor="address">العنوان</Label>
                                        <Input id="address" placeholder="عنوانك (اختياري)" value={customerInfo.address} onChange={e => setCustomerInfo({...customerInfo, address: e.target.value})} />
                                    </div>
                                    <Button className="w-full" onClick={handleSendOrder}>إرسال الطلب</Button>
                                </div>
                            </div>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
            <div className="space-y-8">
                {menu.map((category) => (
                    <div key={category.category}>
                        <h2 className="text-2xl font-bold mb-4 text-primary border-b-2 border-primary pb-2">{category.category}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {category.items.map((item) => (
                                <Card key={item._id} className="overflow-hidden flex flex-col">
                                    <img 
                                      src={item.image ? item.image : "https://via.placeholder.com/150"} 
                                      alt={item.name} 
                                      className="w-full h-48 object-cover"
                                    />
                                    <CardContent className="p-4 flex flex-col flex-grow">
                                        <div className="flex-grow">
                                            <h3 className="font-semibold">{item.name}</h3>
                                            <p className="text-muted-foreground">{item.price} جنيه</p>
                                        </div>
                                        <Button onClick={() => addToCart(item)} className="mt-4 w-full">أضف للسلة</Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;