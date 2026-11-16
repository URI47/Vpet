import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Minus,
  Package,
  Plus,
  Search,
  ShoppingBag,
  Trash2,
  Truck,
  X,
} from 'lucide-react';
import {
  STORE_CATEGORY_LABELS,
  STORE_DEPARTMENT_LABELS,
  STORE_PRODUCTS,
} from '../data/storeData';
import {
  CartItem,
  StoreCategory,
  StoreDepartment,
  StoreOrder,
  StoreProduct,
  UserAccount,
} from '../types/vet';

interface StoreTabProps {
  todayStr: string;
  activeAccount: UserAccount;
  cart: CartItem[];
  orders: StoreOrder[];
  onAddToCart: (productId: string, variant: string) => void;
  onUpdateCartQty: (productId: string, variant: string, delta: number) => void;
  onRemoveFromCart: (productId: string, variant: string) => void;
  onPlaceOrder: (order: Omit<StoreOrder, 'id' | 'orderNumber' | 'date' | 'status'>) => StoreOrder;
}

const FREE_SHIPPING_THRESHOLD = 300;
const DELIVERY_FEE = 25;

export const StoreTab: React.FC<StoreTabProps> = ({
  activeAccount,
  cart,
  orders,
  onAddToCart,
  onUpdateCartQty,
  onRemoveFromCart,
  onPlaceOrder,
}) => {
  const defaultDept: 'all' | StoreDepartment =
    activeAccount.role === 'livestock_breeder'
      ? 'farm'
      : activeAccount.role === 'pet_owner'
      ? 'pets'
      : 'all';

  const [department, setDepartment] = useState<'all' | StoreDepartment>(defaultDept);
  const [category, setCategory] = useState<'all' | StoreCategory>('all');
  const [search, setSearch] = useState('');
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  // Modals / Drawers
  const [detailProduct, setDetailProduct] = useState<StoreProduct | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [showOrders, setShowOrders] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<StoreOrder | null>(null);

  // Checkout Form
  const [customerName, setCustomerName] = useState(activeAccount.fullName);
  const [customerPhone, setCustomerPhone] = useState(activeAccount.phone);
  const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'clinic_pickup'>('delivery');
  const [address, setAddress] = useState(
    activeAccount.farmName
      ? `${activeAccount.city} — ${activeAccount.farmName}`
      : activeAccount.city
  );
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'card_on_delivery'>('cod');

  // Role-based accent styling
  const accent =
    activeAccount.role === 'livestock_breeder'
      ? {
          btn: 'bg-emerald-600 text-white hover:bg-emerald-700',
          tabActive: 'bg-emerald-600 text-white',
          highlight: 'text-emerald-700 dark:text-emerald-400',
          banner:
            'border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/60 dark:bg-emerald-950/30',
        }
      : activeAccount.role === 'pet_owner'
      ? {
          btn: 'bg-yellow-400 text-slate-950 font-bold hover:bg-yellow-500',
          tabActive: 'bg-yellow-400 text-slate-950 font-bold',
          highlight: 'text-yellow-800 dark:text-yellow-300',
          banner:
            'border-yellow-300 bg-yellow-50/80 dark:border-yellow-700/60 dark:bg-yellow-950/30',
        }
      : {
          btn: 'bg-teal-600 text-white hover:bg-teal-700',
          tabActive: 'bg-teal-600 text-white',
          highlight: 'text-teal-700 dark:text-teal-400',
          banner:
            'border-teal-200 bg-teal-50/60 dark:border-teal-900/60 dark:bg-teal-950/30',
        };

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return STORE_PRODUCTS.filter((p) => {
      const matchDept = department === 'all' || p.department === department;
      const matchCat = category === 'all' || p.category === category;
      const matchSearch =
        !q ||
        p.nameAr.toLowerCase().includes(q) ||
        p.subtitleAr.toLowerCase().includes(q) ||
        p.targetAnimals.toLowerCase().includes(q);
      return matchDept && matchCat && matchSearch;
    });
  }, [department, category, search]);

  const getProductVariant = (p: StoreProduct) =>
    selectedVariants[p.id] || p.variants[0];

  const cartDetails = useMemo(() => {
    return cart
      .map((item) => {
        const product = STORE_PRODUCTS.find((p) => p.id === item.productId);
        if (!product) return null;
        return {
          ...item,
          product,
          lineTotal: product.priceSar * item.quantity,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }, [cart]);

  const cartCount = cartDetails.reduce((sum, i) => sum + i.quantity, 0);
  const subtotalSar = cartDetails.reduce((sum, i) => sum + i.lineTotal, 0);
  const shippingFee =
    deliveryMethod === 'clinic_pickup' ||
    subtotalSar === 0 ||
    subtotalSar >= FREE_SHIPPING_THRESHOLD
      ? 0
      : DELIVERY_FEE;
  const totalSar = subtotalSar + shippingFee;

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cartDetails.length === 0 || !customerName.trim() || !customerPhone.trim())
      return;
    const created = onPlaceOrder({
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      deliveryMethod,
      address:
        deliveryMethod === 'clinic_pickup'
          ? 'استلام مباشر من العيادة'
          : address.trim() || activeAccount.city,
      paymentMethod,
      items: cartDetails.map((c) => ({
        nameAr: c.product.nameAr,
        variant: c.variant,
        quantity: c.quantity,
        unitPriceSar: c.product.priceSar,
      })),
      totalSar,
    });
    setConfirmedOrder(created);
  };

  return (
    <div className="space-y-6">
      {/* Slim Storefront Focal Banner */}
      <section className={`rounded-2xl border p-6 ${accent.banner}`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className={`text-xs font-semibold ${accent.highlight}`}>
              متجر بيطار برو المعتمد · شحن مجاني للطلبات فوق{' '}
              <span className="font-mono-num">{FREE_SHIPPING_THRESHOLD}</span> ر.س
            </div>
            <h2 className="mt-1 font-display text-xl font-bold text-slate-900 dark:text-slate-50">
              مستلزمات الحيوانات الأليفة وحيوانات المزرعة
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              أعلاف طبية، مكملات معدنية، أدوات تجريع وترقيم، ومستلزمات العناية تحت إشراف بيطري.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowOrders((v) => !v)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              <Package className="h-4 w-4" />
              طلباتي ({orders.length})
            </button>

            <button
              type="button"
              onClick={() => {
                setConfirmedOrder(null);
                setCartOpen(true);
              }}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-colors ${accent.btn}`}
            >
              <ShoppingBag className="h-4 w-4" />
              سلة المشتريات (
              <span className="font-mono-num">{cartCount}</span>)
            </button>
          </div>
        </div>
      </section>

      {/* Orders History Panel (toggled) */}
      {showOrders && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
            <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-50">
              سجل الطلبات السابقة ({orders.length})
            </h3>
            <button
              type="button"
              onClick={() => setShowOrders(false)}
              className="text-xs font-medium text-slate-500 hover:text-slate-800"
            >
              إغلاق
            </button>
          </div>
          {orders.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">
              لم تقم بإتمام أي طلب بعد.
            </p>
          ) : (
            <div className="mt-3 divide-y divide-slate-200 dark:divide-slate-800">
              {orders.map((ord) => (
                <div
                  key={ord.id}
                  className="flex flex-wrap items-center justify-between gap-4 py-3 text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-900 dark:text-slate-100">
                      طلب رقم <span className="font-mono-num">#{ord.orderNumber}</span> ·{' '}
                      {ord.customerName}
                    </div>
                    <div className="mt-0.5 text-slate-500 dark:text-slate-400">
                      {ord.items.map((i) => `${i.nameAr} (×${i.quantity})`).join('، ')}
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="font-mono-num text-sm font-bold text-slate-900 dark:text-slate-100">
                      {ord.totalSar} ر.س
                    </div>
                    <div className="mt-0.5 font-medium text-emerald-700 dark:text-emerald-400">
                      {ord.status === 'preparing'
                        ? 'جاري التجهيز'
                        : ord.status === 'shipped'
                        ? 'في الطريق'
                        : 'تم التسليم'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Search + Department + Category Controls */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {/* Department Filter */}
          <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
            {[
              { id: 'all', label: 'جميع الأقسام' },
              { id: 'pets', label: 'الحيوانات الأليفة' },
              { id: 'farm', label: 'حيوانات المزرعة' },
            ].map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setDepartment(d.id as 'all' | StoreDepartment)}
                className={`whitespace-nowrap rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
                  department === d.id
                    ? accent.tabActive
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* Category Filter */}
          <select
            aria-label="تصفية حسب الفئة"
            value={category}
            onChange={(e) => setCategory(e.target.value as 'all' | StoreCategory)}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 focus:border-slate-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          >
            <option value="all">كل الفئات</option>
            {Object.entries(STORE_CATEGORY_LABELS).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="relative w-full lg:w-80">
          <Search className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث عن منتج، علف، مكمل، أو حيوان..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-9 pl-3 text-xs text-slate-900 focus:border-slate-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      {/* Uniform 3-Column Product Catalog Grid */}
      {filteredProducts.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            لا توجد منتجات مطابقة لخيارات البحث الحالية.
          </p>
          <button
            type="button"
            onClick={() => {
              setDepartment('all');
              setCategory('all');
              setSearch('');
            }}
            className="mt-3 text-xs font-semibold text-teal-700 hover:underline dark:text-teal-400"
          >
            عرض جميع المنتجات
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => {
            const currentVariant = getProductVariant(product);
            const imgBroken = failedImages[product.id];
            return (
              <article
                key={product.id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-transform duration-200 hover:-translate-y-0.5 dark:border-slate-800 dark:bg-slate-900"
              >
                {/* 4:3 Product Photography */}
                <button
                  type="button"
                  onClick={() => setDetailProduct(product)}
                  className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 text-right dark:bg-slate-800"
                >
                  {!imgBroken ? (
                    <img
                      src={product.imageUrl}
                      alt={product.nameAr}
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setFailedImages((prev) => ({
                          ...prev,
                          [product.id]: true,
                        }))
                      }
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center bg-slate-100 p-4 text-center dark:bg-slate-800">
                      <Package className="h-8 w-8 text-slate-400" />
                      <span className="mt-2 text-xs font-medium text-slate-500">
                        {product.nameAr}
                      </span>
                    </div>
                  )}
                </button>

                {/* Uniform Metadata & Action Body */}
                <div className="flex flex-1 flex-col justify-between p-5">
                  <div>
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {STORE_CATEGORY_LABELS[product.category]} · {product.targetAnimals}
                    </div>
                    <button
                      type="button"
                      onClick={() => setDetailProduct(product)}
                      className="mt-1.5 text-right font-display text-base font-bold leading-snug text-slate-900 hover:underline dark:text-slate-50"
                    >
                      {product.nameAr}
                    </button>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                      {product.subtitleAr}
                    </p>
                  </div>

                  <div className="mt-4 space-y-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                    {/* Variant selector */}
                    <select
                      aria-label={`اختيار الحجم لـ ${product.nameAr}`}
                      value={currentVariant}
                      onChange={(e) =>
                        setSelectedVariants((prev) => ({
                          ...prev,
                          [product.id]: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-slate-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                      {product.variants.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>

                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-mono-num text-lg font-bold text-slate-900 dark:text-slate-50">
                          {product.priceSar}{' '}
                          <span className="text-xs font-medium text-slate-500">
                            ر.س
                          </span>
                        </div>
                        <div className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                          متوفر للتوصيل
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onAddToCart(product.id, currentVariant)}
                        className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-semibold transition-colors ${accent.btn}`}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        أضف للسلة
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Product Detail Modal */}
      {detailProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {STORE_DEPARTMENT_LABELS[detailProduct.department]} ·{' '}
                {STORE_CATEGORY_LABELS[detailProduct.category]}
              </div>
              <button
                type="button"
                onClick={() => setDetailProduct(null)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="aspect-[4/3] overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                <img
                  src={detailProduct.imageUrl}
                  alt={detailProduct.nameAr}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="flex flex-col justify-between">
                <div>
                  <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-50">
                    {detailProduct.nameAr}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    {detailProduct.subtitleAr}
                  </p>
                  <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300">
                    <strong>توصية الطبيب البيطري:</strong> {detailProduct.vetNote}
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <select
                    value={getProductVariant(detailProduct)}
                    onChange={(e) =>
                      setSelectedVariants((prev) => ({
                        ...prev,
                        [detailProduct.id]: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                  >
                    {detailProduct.variants.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center justify-between">
                    <span className="font-mono-num text-2xl font-bold text-slate-900 dark:text-slate-50">
                      {detailProduct.priceSar} ر.س
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onAddToCart(
                          detailProduct.id,
                          getProductVariant(detailProduct)
                        );
                        setDetailProduct(null);
                        setCartOpen(true);
                      }}
                      className={`rounded-xl px-5 py-2.5 text-xs font-semibold ${accent.btn}`}
                    >
                      أضف للسلة الآن
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Slide-Over Cart & Checkout Drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs">
          <div className="flex h-full w-full max-w-md flex-col border-r border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ShoppingBag className={`h-5 w-5 ${accent.highlight}`} />
                <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-50">
                  سلة المشتريات ({cartCount})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCartOpen(false)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {confirmedOrder ? (
                <div className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6 text-center dark:border-emerald-900/60 dark:bg-emerald-950/30">
                  <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600 dark:text-emerald-400" />
                  <h4 className="font-display text-lg font-bold text-emerald-950 dark:text-emerald-100">
                    تم تأكيد الطلب #{confirmedOrder.orderNumber}
                  </h4>
                  <p className="text-xs leading-relaxed text-emerald-900/80 dark:text-emerald-200">
                    جاري تجهيز طلبك الآن. سيتواصل معك فريق التوصيل على الرقم{' '}
                    <span className="font-mono-num font-bold">
                      {confirmedOrder.customerPhone}
                    </span>
                    .
                  </p>
                  <div className="border-t border-emerald-200 pt-3 text-right text-xs dark:border-emerald-800">
                    <div>
                      <strong>الاستلام:</strong> {confirmedOrder.address}
                    </div>
                    <div className="mt-1">
                      <strong>الإجمالي:</strong>{' '}
                      <span className="font-mono-num font-bold">
                        {confirmedOrder.totalSar} ر.س
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmedOrder(null);
                      setCartOpen(false);
                    }}
                    className={`w-full rounded-xl py-2.5 text-xs font-semibold ${accent.btn}`}
                  >
                    العودة للمتجر
                  </button>
                </div>
              ) : cartDetails.length === 0 ? (
                <div className="py-16 text-center">
                  <ShoppingBag className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
                  <p className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                    سلة المشتريات فارغة حالياً
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    أضف مستلزمات لحيوانك الأليف أو لمزرعتك للبدء.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Free Delivery Notice */}
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300">
                    <Truck className="h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400" />
                    {subtotalSar >= FREE_SHIPPING_THRESHOLD ? (
                      <span>تهانينا! طلبك مؤهل للشحن المجاني.</span>
                    ) : (
                      <span>
                        أضف بقيمة{' '}
                        <strong className="font-mono-num">
                          {FREE_SHIPPING_THRESHOLD - subtotalSar} ر.س
                        </strong>{' '}
                        للحصول على شحن مجاني.
                      </span>
                    )}
                  </div>

                  {/* Cart Items */}
                  <div className="divide-y divide-slate-200 dark:divide-slate-800">
                    {cartDetails.map((item) => (
                      <div
                        key={`${item.productId}_${item.variant}`}
                        className="flex items-start justify-between gap-3 py-3.5"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {item.product.nameAr}
                          </div>
                          <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                            {item.variant} ·{' '}
                            <span className="font-mono-num">
                              {item.product.priceSar} ر.س
                            </span>
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <button
                              type="button"
                              aria-label="إنقاص الكمية"
                              onClick={() =>
                                onUpdateCartQty(item.productId, item.variant, -1)
                              }
                              className="rounded-lg border border-slate-200 p-1 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="font-mono-num w-6 text-center text-xs font-semibold">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              aria-label="زيادة الكمية"
                              onClick={() =>
                                onUpdateCartQty(item.productId, item.variant, 1)
                              }
                              className="rounded-lg border border-slate-200 p-1 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              aria-label="حذف المنتج"
                              onClick={() =>
                                onRemoveFromCart(item.productId, item.variant)
                              }
                              className="mr-2 text-rose-600 hover:text-rose-700"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="font-mono-num text-sm font-bold text-slate-900 dark:text-slate-100">
                          {item.lineTotal} ر.س
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Checkout Verification Form */}
                  <form
                    id="store-checkout-form"
                    onSubmit={handleCheckoutSubmit}
                    className="space-y-3 border-t border-slate-200 pt-5 dark:border-slate-800"
                  >
                    <h4 className="font-display text-sm font-bold text-slate-900 dark:text-slate-100">
                      بيانات التوصيل والدفع
                    </h4>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setDeliveryMethod('delivery')}
                        className={`rounded-xl border py-2 text-xs font-semibold ${
                          deliveryMethod === 'delivery'
                            ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                            : 'border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-300'
                        }`}
                      >
                        توصيل للمنزل / المزرعة
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeliveryMethod('clinic_pickup')}
                        className={`rounded-xl border py-2 text-xs font-semibold ${
                          deliveryMethod === 'clinic_pickup'
                            ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                            : 'border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-300'
                        }`}
                      >
                        استلام من العيادة
                      </button>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                        الاسم الكامل *
                      </label>
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                        رقم الجوال *
                      </label>
                      <input
                        type="tel"
                        required
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono-num text-xs dark:border-slate-700 dark:bg-slate-800"
                      />
                    </div>
                    {deliveryMethod === 'delivery' && (
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                          المدينة والعنوان / اسم المزرعة *
                        </label>
                        <input
                          type="text"
                          required
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                        طريقة الدفع
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(e) =>
                          setPaymentMethod(
                            e.target.value as 'cod' | 'card_on_delivery'
                          )
                        }
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                      >
                        <option value="cod">الدفع نقداً عند الاستلام</option>
                        <option value="card_on_delivery">
                          شبكة / بطاقة مدى عند الاستلام
                        </option>
                      </select>
                    </div>
                  </form>
                </div>
              )}
            </div>

            {!confirmedOrder && cartDetails.length > 0 && (
              <div className="border-t border-slate-200 bg-slate-50/80 p-6 dark:border-slate-800 dark:bg-slate-900">
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>المجموع الفرعي</span>
                    <span className="font-mono-num">{subtotalSar} ر.س</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>رسوم التوصيل</span>
                    <span className="font-mono-num">
                      {shippingFee === 0 ? 'مجاني' : `${shippingFee} ر.س`}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-bold text-slate-900 dark:border-slate-800 dark:text-slate-50">
                    <span>الإجمالي النهائي</span>
                    <span className="font-mono-num">{totalSar} ر.س</span>
                  </div>
                </div>

                <button
                  type="submit"
                  form="store-checkout-form"
                  className={`mt-4 w-full rounded-xl py-3 text-sm font-bold transition-colors ${accent.btn}`}
                >
                  تأكيد وإتمام الطلب
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
