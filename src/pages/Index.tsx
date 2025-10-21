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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-slate-100 p-4" dir="rtl">
      <div className="w-full max-w-7xl mx-auto">
        <header className="bg-white/90 backdrop-blur-sm shadow-lg rounded-2xl mb-6 sticky top-4 z-50">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-400 bg-clip-text text-transparent">مطعم الطازج</CardTitle>
                <p className="text-sm text-slate-600 mt-1">طنطا - أفضل المأكولات الطازجة</p>
              </div>
              <div className="flex items-center gap-3">
                {lastOrderId && (
                  <Button
                    variant="outline"
                    className="hover:bg-orange-50 border-orange-200 text-orange-600 hover:text-orange-700 transition-all duration-300"
                    onClick={() => navigate(`/order/${lastOrderId}`)}
                    title="تتبع آخر طلب"
                  >
                    <LocateFixed className="ml-2 h-5 w-5" />
                    تتبع آخر طلب
                  </Button>
                )}
                <Button
                    variant="outline"
                    size="icon"
                    className="hover:bg-slate-100 transition-all duration-300"
                    onClick={() => navigate("/auth")}
                    title="لوحة تحكم الأدمن"
                >
                    <UserCog className="h-5 w-5" />
                </Button>
                <Sheet>
                    <SheetTrigger asChild>
                        <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-md hover:shadow-lg transition-all duration-300 relative">
                            <ShoppingCart className="ml-2 h-5 w-5" />
                            سلة التسوق
                            {cart.length > 0 && (
                              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold">
                                {cart.reduce((acc, item) => acc + item.quantity, 0)}
                              </span>
                            )}
                        </Button>
                    </SheetTrigger>
                    <SheetContent className="w-[400px] sm:w-[540px] bg-gradient-to-b from-white to-slate-50">
                        <SheetHeader className="border-b pb-4">
                            <SheetTitle className="text-2xl font-bold text-orange-600">سلة التسوق</SheetTitle>
                        </SheetHeader>
                        <div className="h-full flex flex-col">
                            <ScrollArea className="flex-grow p-4">
                                {cart.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                      <ShoppingCart className="h-16 w-16 text-slate-300 mb-4" />
                                      <p className="text-slate-500 text-lg">سلة التسوق فارغة</p>
                                      <p className="text-slate-400 text-sm mt-2">أضف بعض الأصناف اللذيذة!</p>
                                    </div>
                                ) : (
                                    cart.map((item) => (
                                        <div key={item.name} className="bg-white rounded-xl shadow-sm p-4 mb-3 hover:shadow-md transition-shadow duration-200">
                                            <div className="flex justify-between items-center">
                                                <div className="flex-1">
                                                    <p className="font-semibold text-slate-800">{item.name}</p>
                                                    <p className="text-sm text-orange-600 font-medium">{item.price} جنيه</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        value={item.quantity}
                                                        onChange={(e) => updateQuantity(item.name, parseInt(e.target.value))}
                                                        className="w-16 text-center"
                                                    />
                                                    <Button variant="destructive" size="icon" className="hover:bg-red-600" onClick={() => removeFromCart(item.name)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </ScrollArea>
                            <div className="p-4 border-t bg-white">
                                <div className="space-y-4">
                                    <div className="flex justify-between font-bold text-xl bg-gradient-to-r from-orange-100 to-orange-50 p-4 rounded-xl">
                                        <span className="text-slate-800">الإجمالي</span>
                                        <span className="text-orange-600">{total} جنيه</span>
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                          <Label htmlFor="name" className="text-slate-700 font-medium">الاسم</Label>
                                          <Input id="name" placeholder="اسمك" className="mt-1 border-slate-300 focus:border-orange-400" value={customerInfo.name} onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} />
                                        </div>
                                        <div>
                                          <Label htmlFor="phone" className="text-slate-700 font-medium">رقم الهاتف</Label>
                                          <Input id="phone" placeholder="رقم هاتفك" className="mt-1 border-slate-300 focus:border-orange-400" value={customerInfo.phone} onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})} />
                                        </div>
                                        <div>
                                          <Label htmlFor="address" className="text-slate-700 font-medium">العنوان</Label>
                                          <Input id="address" placeholder="عنوانك (اختياري)" className="mt-1 border-slate-300 focus:border-orange-400" value={customerInfo.address} onChange={e => setCustomerInfo({...customerInfo, address: e.target.value})} />
                                        </div>
                                    </div>
                                    <Button className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-md hover:shadow-lg transition-all duration-300 text-lg py-6" onClick={handleSendOrder}>إرسال الطلب</Button>
                                </div>
                            </div>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
          </div>
          </div>
        </header>

        <main className="space-y-10">
            {menu.map((category) => (
                <section key={category.category} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 transition-all duration-300 hover:shadow-xl">
                    <h2 className="text-3xl font-bold mb-6 text-slate-800 border-b-4 border-orange-400 pb-3 inline-block">{category.category}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
                            {category.items.map((item) => (
                                <Card key={item._id} className="overflow-hidden flex flex-col group hover:shadow-2xl transition-all duration-300 border-2 hover:border-orange-300 bg-white">
                                    <div className="relative overflow-hidden">
                                      <img
                                        src={item.image ? item.image : "https://via.placeholder.com/150"}
                                        alt={item.name}
                                        className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                                      />
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    </div>
                                    <CardContent className="p-5 flex flex-col flex-grow">
                                        <div className="flex-grow">
                                            <h3 className="font-bold text-lg text-slate-800 mb-1">{item.name}</h3>
                                            <p className="text-orange-600 font-bold text-lg">{item.price} جنيه</p>
                                        </div>
                                        <Button
                                          onClick={() => addToCart(item)}
                                          className="mt-4 w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-md hover:shadow-lg transition-all duration-300"
                                        >
                                          أضف للسلة
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </section>
                ))}
            </main>
        </div>
    </div>
  );
};

export default Index;