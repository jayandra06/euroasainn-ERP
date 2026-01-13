export declare class RazorpayService {
    private razorpay;
    constructor();
    createOrder(data: {
        amount: number;
        currency: string;
        receipt?: string;
        notes?: Record<string, string>;
    }): Promise<import("razorpay/dist/types/orders").Orders.RazorpayOrder>;
    verifyPaymentSignature(orderId: string, paymentId: string, signature: string): Promise<boolean>;
    getPaymentDetails(paymentId: string): Promise<import("razorpay/dist/types/payments").Payments.RazorpayPayment>;
    getOrderDetails(orderId: string): Promise<import("razorpay/dist/types/orders").Orders.RazorpayOrder>;
    refundPayment(paymentId: string, amount?: number): Promise<import("razorpay/dist/types/refunds").Refunds.RazorpayRefund>;
}
export declare function getRazorpayService(): RazorpayService;
export declare const razorpayService: RazorpayService;
//# sourceMappingURL=razorpay.service.d.ts.map