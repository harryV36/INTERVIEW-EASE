import crypto from "crypto";

const getProvider = () => {
  return "simulator";
};

export const createProviderOrder = async ({
  amount,
  currency,
  receipt,
  notes = {},
}) => {
  const orderId = `sim_order_${crypto.randomUUID()}`;

  return {
    provider: "simulator",
    order: {
      id: orderId,
      amount: amount * 100,
      currency,
      receipt,
      status: "created",
      notes,
    },
  };
};

export const verifyProviderPayment = async ({
  orderId,
  paymentId,
  signature,
}) => {
  if (!orderId || !paymentId) {
    throw new Error("Simulator payment data is incomplete");
  }

  if (!orderId.startsWith("sim_order_")) {
    throw new Error("Invalid simulator order ID");
  }

  if (!paymentId.startsWith("sim_payment_")) {
    throw new Error("Invalid simulator payment ID");
  }

  return {
    provider: "simulator",
    verified: true,
    paymentId,
    signature: signature || null,
  };
};

export const getPaymentProvider = () => getProvider();