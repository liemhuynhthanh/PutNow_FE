export type PageResponse<T> = {
  items: T[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
};

export type ProblemDetail = {
  type?: string;
  title?: string;
  status: number;
  detail?: string;
  instance?: string;
  code?: string;
  traceId?: string;
  fieldErrors?: Record<string, string>;
};

export type CurrentUser = {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: "USER" | "ADMIN";
};

export type Concert = {
  id: number;
  title: string;
  description?: string;
  imageUrl?: string;
  startTime: string;
  status: string;
};

export type TicketType = {
  id: number;
  name: string;
  price: number;
  totalQuantity: number;
  remainingQuantity: number;
  concertId: number;
};

export type BookingItem = {
  id: number;
  ticketTypeId: number;
  ticketTypeName: string;
  quantity: number;
  price: number;
  subTotal: number;
};

export type Booking = {
  id: number;
  userId: number;
  concertId: number;
  concertTitle: string;
  status: "PENDING" | "PAID" | "CANCELLED" | "EXPIRED";
  idempotencyKey: string;
  totalAmount: number;
  voucherCode?: string;
  discountAmount?: number;
  expiresAt: string;
  items: BookingItem[];
};

export type UserSummary = {
  id: number;
  name: string;
  email: string;
  phone?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Voucher = {
  id: number;
  code: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number;
  maxUses: number;
  usedCount: number;
  expiredAt: string;
};

export type ConcertAvailability = {
  concertId: number;
  title: string;
  status: string;
  totalTickets: number;
  remainingTickets: number;
  soldTickets: number;
  ticketTypeDetails: TicketType[];
};

export type ImageUpload = {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
};
